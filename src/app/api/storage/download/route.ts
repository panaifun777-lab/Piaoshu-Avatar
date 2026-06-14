import { NextRequest, NextResponse } from 'next/server'
import { StorageService } from '@/lib/storage'

// GET /api/storage/download?cid=X — Download from IPFS
// GET /api/storage/download?txId=X — Download from Arweave
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cid = searchParams.get('cid')
    const txId = searchParams.get('txId')

    if (!cid && !txId) {
      return NextResponse.json(
        { success: false, error: 'Either cid or txId query parameter is required' },
        { status: 400 },
      )
    }

    let buffer: Buffer | null = null
    let contentType = 'application/octet-stream'

    if (cid) {
      buffer = await StorageService.downloadFromIPFS(cid)
      if (!buffer) {
        return NextResponse.json(
          { success: false, error: `Content not found for CID: ${cid}` },
          { status: 404 },
        )
      }
      // Try to detect content type
      if (cid.startsWith('sha256:')) {
        // Fallback: might be text
        try {
          const text = buffer.toString('utf-8')
          if (text.length > 0) {
            contentType = 'text/plain; charset=utf-8'
          }
        } catch {
          // Keep default
        }
      }
    } else if (txId) {
      buffer = await StorageService.downloadFromArweave(txId)
      if (!buffer) {
        return NextResponse.json(
          { success: false, error: `Content not found for txId: ${txId}` },
          { status: 404 },
        )
      }
    }

    if (!buffer) {
      return NextResponse.json(
        { success: false, error: 'Content not found' },
        { status: 404 },
      )
    }

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(buffer.length),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('[Storage] Download failed:', error)
    return NextResponse.json(
      { success: false, error: 'Download failed' },
      { status: 500 },
    )
  }
}
