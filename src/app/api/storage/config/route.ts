import { NextRequest, NextResponse } from 'next/server'
import { StorageService } from '@/lib/storage'

// GET /api/storage/config — Get current storage configuration
export async function GET() {
  const status = await StorageService.getStatus()

  return NextResponse.json({
    success: true,
    data: {
      ipfsGateway: status.ipfs.gateway,
      arweaveGateway: status.arweave.gateway,
      ipfsConfigured: status.ipfs.configured,
      arweaveConfigured: status.arweave.configured,
      strategy: status.ipfs.configured && status.arweave.configured
        ? 'dual-redundant'
        : status.ipfs.configured
          ? 'ipfs-only'
          : status.arweave.configured
            ? 'arweave-only'
            : 'auto-select',
      autoPin: status.ipfs.configured,
      replicationCount: status.fallback.files > 0 ? 1 : 0,
    },
  })
}

// POST /api/storage/config — Update configuration (runtime, non-persistent)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const updates: string[] = []

    // Runtime config changes are limited — for now just acknowledge
    if (body.ipfsGateway !== undefined) updates.push('ipfsGateway')
    if (body.arweaveGateway !== undefined) updates.push('arweaveGateway')
    if (body.strategy !== undefined) updates.push('strategy')

    // Note: API keys cannot be changed at runtime — they're set via env vars
    return NextResponse.json({
      success: true,
      data: {
        message: 'Runtime config received. Note: API keys must be set via environment variables.',
        updated: updates,
      },
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 },
    )
  }
}
