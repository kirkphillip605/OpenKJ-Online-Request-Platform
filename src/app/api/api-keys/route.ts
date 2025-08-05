import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateApiKey } from '@/lib/utils'
import bcrypt from 'bcryptjs'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const createApiKeySchema = z.object({
  description: z.string().min(1, 'Description is required'),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { description } = createApiKeySchema.parse(body)

    // Generate a new API key
    const apiKey = generateApiKey()
    const apiKeyHash = await bcrypt.hash(apiKey, 12)

    // Get or create customer record
    const customer = await prisma.customer.upsert({
      where: { id: session.user.id },
      update: {},
      create: {
        id: session.user.id,
        stripeCustomerId: `temp_${session.user.id}`, // Will be updated when Stripe customer is created
      },
    })

    // Create the API key record
    const apiKeyRecord = await prisma.apiKey.create({
      data: {
        customerId: customer.id,
        description,
        apiKeyHash,
        status: 'active',
      },
    })

    logger.info(`API key created for user ${session.user.id}: ${apiKeyRecord.id}`)

    return NextResponse.json({
      id: apiKeyRecord.id,
      apiKey, // Return the plain text key only once
      description: apiKeyRecord.description,
      status: apiKeyRecord.status,
      createdAt: apiKeyRecord.createdAt,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    logger.error('Error creating API key:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}