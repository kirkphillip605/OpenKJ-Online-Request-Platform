import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { logger } from '@/lib/logger'
import { z } from 'zod'

// Rate limiting map (in production, use Redis or similar)
const rateLimitMap = new Map()

// Helper function for rate limiting
function rateLimit(ip: string): boolean {
  const now = Date.now()
  const windowMs = 60000 // 1 minute
  const maxRequests = 100

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }

  const { count, resetTime } = rateLimitMap.get(ip)

  if (now > resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (count >= maxRequests) {
    return false
  }

  rateLimitMap.set(ip, { count: count + 1, resetTime })
  return true
}

// Request validation schemas
const baseRequestSchema = z.object({
  api_key: z.string(),
  command: z.string(),
})

const venueCommandSchema = baseRequestSchema.extend({
  venue_id: z.number().optional(),
  system_id: z.number().default(0),
})

const requestSchema = venueCommandSchema.extend({
  request_id: z.number().optional(),
})

const acceptingSchema = venueCommandSchema.extend({
  accepting: z.union([z.boolean(), z.string()]).transform((val) => {
    if (typeof val === 'boolean') return val
    return val === 'true' || val === '1'
  }),
})

const addSongsSchema = baseRequestSchema.extend({
  songs: z.array(z.object({
    artist: z.string(),
    title: z.string(),
  })),
  system_id: z.number().default(0),
})

async function updateSerial(venueRelationshipId: string, systemId: number): Promise<number> {
  try {
    const state = await prisma.state.upsert({
      where: {
        venueRelationshipId_systemId: {
          venueRelationshipId,
          systemId,
        },
      },
      update: {
        serial: {
          increment: 1,
        },
      },
      create: {
        venueRelationshipId,
        systemId,
        serial: 1,
        accepting: false,
      },
    })

    return state.serial
  } catch (error) {
    logger.error('Failed to update serial:', error)
    return 0
  }
}

async function authenticateApiKey(apiKey: string) {
  try {
    // Find all active API keys (we'll check hash against each)
    const apiKeys = await prisma.apiKey.findMany({
      where: {
        status: 'active',
        OR: [
          { revokedAt: null },
          { revokedAt: { gt: new Date() } }
        ]
      },
      include: {
        customer: {
          include: {
            user: {
              include: {
                venueRelationships: {
                  include: {
                    venue: true,
                    states: true,
                  }
                }
              }
            }
          }
        }
      }
    })

    for (const key of apiKeys) {
      const isValid = await bcrypt.compare(apiKey, key.apiKeyHash)
      if (isValid) {
        // Update last used timestamp
        await prisma.apiKey.update({
          where: { id: key.id },
          data: { lastUsedAt: new Date() }
        })

        return {
          apiKeyId: key.id,
          customer: key.customer,
          user: key.customer.user,
          venueRelationships: key.customer.user.venueRelationships,
        }
      }
    }

    return null
  } catch (error) {
    logger.error('API key authentication error:', error)
    return null
  }
}

function findVenueRelationship(venueRelationships: any[], venueId?: number) {
  if (!venueId) return null
  
  // In the old system, venue_id was an integer
  // We need to find the venue relationship that matches
  return venueRelationships.find(vr => 
    vr.venue && (vr.venue.name === venueId.toString() || vr.id === venueId.toString())
  ) || venueRelationships[0] // Fallback to first venue
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.ip || 'unknown'
    if (!rateLimit(ip)) {
      return NextResponse.json(
        { error: true, errorString: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { command } = body

    logger.info(`OpenKJ API request: ${command}`, { 
      ip, 
      command, 
      hasApiKey: !!body.api_key 
    })

    // Validate base request
    const baseValidation = baseRequestSchema.safeParse(body)
    if (!baseValidation.success) {
      return NextResponse.json({
        command,
        error: true,
        errorString: 'Invalid request format'
      })
    }

    // Authenticate API key
    const auth = await authenticateApiKey(body.api_key)
    if (!auth) {
      return NextResponse.json({
        command,
        error: true,
        errorString: 'Invalid API key'
      })
    }

    const { user, venueRelationships } = auth

    // Handle commands
    switch (command) {
      case 'getSerial': {
        // For getSerial, return the highest serial across all venues
        const maxSerial = venueRelationships.reduce((max, vr) => {
          const state = vr.states.find((s: any) => s.systemId === (body.system_id || 0))
          return Math.max(max, state?.serial || 1)
        }, 1)

        return NextResponse.json({
          command,
          serial: maxSerial,
          error: false
        })
      }

      case 'getRequests': {
        const validation = venueCommandSchema.safeParse(body)
        if (!validation.success) {
          return NextResponse.json({
            command,
            error: true,
            errorString: 'venue_id is required'
          })
        }

        const venueRelationship = findVenueRelationship(venueRelationships, validation.data.venue_id)
        if (!venueRelationship) {
          return NextResponse.json({
            command,
            error: true,
            errorString: 'Venue not found'
          })
        }

        const requests = await prisma.request.findMany({
          where: {
            venueRelationshipId: venueRelationship.id,
            systemId: validation.data.system_id,
          },
          orderBy: {
            requestTime: 'asc'
          }
        })

        const formattedRequests = requests.map(req => ({
          request_id: Number(req.requestId),
          artist: req.artist,
          title: req.title,
          singer: req.singer,
          request_time: Math.floor(req.requestTime.getTime() / 1000),
          key_change: req.keyChange,
        }))

        // Get current serial
        const state = await prisma.state.findUnique({
          where: {
            venueRelationshipId_systemId: {
              venueRelationshipId: venueRelationship.id,
              systemId: validation.data.system_id,
            }
          }
        })

        return NextResponse.json({
          command,
          requests: formattedRequests,
          serial: state?.serial || 1,
          error: false
        })
      }

      case 'deleteRequest': {
        const validation = requestSchema.safeParse(body)
        if (!validation.success || !validation.data.request_id) {
          return NextResponse.json({
            command,
            error: true,
            errorString: 'venue_id and request_id are required'
          })
        }

        const venueRelationship = findVenueRelationship(venueRelationships, validation.data.venue_id)
        if (!venueRelationship) {
          return NextResponse.json({
            command,
            error: true,
            errorString: 'Venue not found'
          })
        }

        const deleted = await prisma.request.deleteMany({
          where: {
            requestId: BigInt(validation.data.request_id),
            venueRelationshipId: venueRelationship.id,
            systemId: validation.data.system_id,
          }
        })

        if (deleted.count === 0) {
          return NextResponse.json({
            command,
            error: true,
            errorString: 'Request not found'
          })
        }

        const newSerial = await updateSerial(venueRelationship.id, validation.data.system_id)

        return NextResponse.json({
          command,
          serial: newSerial,
          error: false
        })
      }

      case 'setAccepting': {
        const validation = acceptingSchema.safeParse(body)
        if (!validation.success) {
          return NextResponse.json({
            command,
            error: true,
            errorString: 'venue_id and accepting status are required'
          })
        }

        const venueRelationship = findVenueRelationship(venueRelationships, validation.data.venue_id)
        if (!venueRelationship) {
          return NextResponse.json({
            command,
            error: true,
            errorString: 'Venue not found'
          })
        }

        // Update venue relationship accepting status
        await prisma.venueRelationship.update({
          where: { id: venueRelationship.id },
          data: { acceptingRequests: validation.data.accepting }
        })

        // Update state
        await prisma.state.upsert({
          where: {
            venueRelationshipId_systemId: {
              venueRelationshipId: venueRelationship.id,
              systemId: validation.data.system_id,
            }
          },
          update: {
            accepting: validation.data.accepting,
          },
          create: {
            venueRelationshipId: venueRelationship.id,
            systemId: validation.data.system_id,
            accepting: validation.data.accepting,
            serial: 1,
          }
        })

        const newSerial = await updateSerial(venueRelationship.id, validation.data.system_id)

        return NextResponse.json({
          command,
          venue_id: validation.data.venue_id,
          accepting: validation.data.accepting,
          serial: newSerial,
          error: false
        })
      }

      case 'getVenues': {
        const venues = venueRelationships.map((vr, index) => ({
          venue_id: index + 1, // Use index as ID for compatibility
          name: vr.displayName || vr.venue.name,
          url_name: vr.urlName,
          accepting: vr.acceptingRequests,
        }))

        return NextResponse.json({
          command,
          venues,
          error: false
        })
      }

      case 'clearRequests': {
        const validation = venueCommandSchema.safeParse(body)
        if (!validation.success) {
          return NextResponse.json({
            command,
            error: true,
            errorString: 'venue_id is required'
          })
        }

        const venueRelationship = findVenueRelationship(venueRelationships, validation.data.venue_id)
        if (!venueRelationship) {
          return NextResponse.json({
            command,
            error: true,
            errorString: 'Venue not found'
          })
        }

        await prisma.request.deleteMany({
          where: {
            venueRelationshipId: venueRelationship.id,
            systemId: validation.data.system_id,
          }
        })

        const newSerial = await updateSerial(venueRelationship.id, validation.data.system_id)

        return NextResponse.json({
          command,
          serial: newSerial,
          error: false
        })
      }

      case 'addSongs': {
        const validation = addSongsSchema.safeParse(body)
        if (!validation.success) {
          return NextResponse.json({
            command,
            error: true,
            errorString: 'Songs array is required',
            errors: [],
            'entries processed': 0,
            last_artist: null,
            last_title: null,
            serial: 1
          })
        }

        const { songs, system_id } = validation.data
        const errors: string[] = []
        let processedCount = 0
        let lastArtist: string | null = null
        let lastTitle: string | null = null

        const songsToAdd = songs
          .filter(song => {
            if (!song.artist?.trim() || !song.title?.trim()) {
              errors.push(`Invalid song entry: ${JSON.stringify(song)}`)
              return false
            }
            return true
          })
          .map(song => {
            const artist = song.artist.trim()
            const title = song.title.trim()
            const combined = `${artist} - ${title}`
            
            lastArtist = artist
            lastTitle = title
            
            return {
              userId: user.id,
              systemId: system_id,
              artist,
              title,
              combined,
              normalizedCombined: combined.toLowerCase(), // Simplified normalization
            }
          })

        if (songsToAdd.length > 0) {
          try {
            await prisma.songDb.createMany({
              data: songsToAdd,
              skipDuplicates: true,
            })
            processedCount = songsToAdd.length
          } catch (error) {
            logger.error('Error adding songs:', error)
            errors.push('Database error during bulk add')
          }
        }

        // Get current serial
        const state = await prisma.state.findFirst({
          where: {
            venueRelationship: {
              userId: user.id
            },
            systemId: system_id,
          }
        })

        return NextResponse.json({
          command,
          error: errors.length > 0,
          errorString: errors.length > 0 ? 'Some errors occurred during song addition' : null,
          errors,
          'entries processed': processedCount,
          last_artist: lastArtist,
          last_title: lastTitle,
          serial: state?.serial || 1
        })
      }

      case 'clearDatabase': {
        const { system_id = 0 } = body

        await prisma.songDb.deleteMany({
          where: {
            userId: user.id,
            systemId: system_id,
          }
        })

        // Get current serial
        const state = await prisma.state.findFirst({
          where: {
            venueRelationship: {
              userId: user.id
            },
            systemId: system_id,
          }
        })

        return NextResponse.json({
          command,
          serial: state?.serial || 1,
          error: false
        })
      }

      case 'getAlert': {
        // Placeholder for alert functionality
        return NextResponse.json({
          command,
          alert: false,
          title: '',
          message: '',
          error: false
        })
      }

      case 'getEntitledSystemCount': {
        // Return number of venue relationships as entitled systems
        return NextResponse.json({
          command,
          count: Math.max(venueRelationships.length, 1),
          error: false
        })
      }

      case 'connectionTest': {
        return NextResponse.json({
          command,
          connection: 'ok'
        })
      }

      default: {
        return NextResponse.json({
          command,
          error: true,
          errorString: 'Unrecognized command'
        })
      }
    }

  } catch (error) {
    logger.error('OpenKJ API error:', error)
    
    return NextResponse.json({
      command: 'unknown',
      error: true,
      errorString: 'Internal server error'
    }, { status: 500 })
  }
}