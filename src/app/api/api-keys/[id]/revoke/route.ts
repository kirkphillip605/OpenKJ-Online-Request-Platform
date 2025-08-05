import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find the API key and verify ownership
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id: params.id,
        customer: {
          id: session.user.id,
        },
      },
    })

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 })
    }

    if (apiKey.status !== 'active') {
      return NextResponse.json({ error: 'API key is already revoked' }, { status: 400 })
    }

    // Revoke the API key
    await prisma.apiKey.update({
      where: { id: params.id },
      data: {
        status: 'revoked',
        revokedAt: new Date(),
      },
    })

    logger.info(`API key ${params.id} revoked by user ${session.user.id}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Error revoking API key:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}