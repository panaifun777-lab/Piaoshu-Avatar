import { NextRequest, NextResponse } from 'next/server'
import { StorageService } from '@/lib/storage'
import { db } from '@/lib/db'

// POST /api/storage/upload — Upload file to IPFS (+ Arweave if dual)
export async function POST(request: NextRequest) {
  try {
    // Accept both FormData (file upload) and JSON (text content)
    const contentType = request.headers.get('content-type') || ''

    let buffer: Buffer
    let fileName: string
    let mimeType: string | undefined
    let metadata: Record<string, string> = {}
    let storageType = 'ipfs'

    if (contentType.includes('multipart/form-data')) {
      // FormData multipart upload
      const formData = await request.formData()
      const file = formData.get('file')

      if (!file || !(file instanceof File)) {
        return NextResponse.json(
          { success: false, error: 'No file provided in FormData' },
          { status: 400 },
        )
      }

      buffer = Buffer.from(await file.arrayBuffer())
      fileName = file.name || 'unnamed'
      mimeType = file.type || undefined

      const storageTypeField = formData.get('storageType')
      if (storageTypeField) storageType = String(storageTypeField)

      const metadataField = formData.get('metadata')
      if (metadataField) {
        try {
          metadata = JSON.parse(String(metadataField))
        } catch {
          metadata = { raw: String(metadataField) }
        }
      }
    } else {
      // JSON content upload
      const body = await request.json()
      const content = body.content as string | undefined
      fileName = body.fileName as string || 'unnamed'
      storageType = (body.storageType as string) || 'ipfs'
      metadata = (body.metadata as Record<string, string>) || {}

      if (!content) {
        return NextResponse.json(
          { success: false, error: 'Content is required' },
          { status: 400 },
        )
      }

      buffer = Buffer.from(content, 'utf-8')
      mimeType = body.mimeType || 'text/plain'
    }

    // Generate real SHA256 content hash
    const contentHash = StorageService.contentHash(buffer)

    // Determine actual storage type
    let actualType: 'ipfs' | 'arweave' | 'dual' | 'fallback' = 'ipfs'

    if (storageType === 'dual' || storageType === 'both') {
      actualType = 'dual'
    } else if (storageType === 'arweave') {
      actualType = 'arweave'
    } else {
      actualType = 'ipfs'
    }

    // If neither IPFS nor Arweave is configured, fallback
    const ipfsConfigured = StorageService.isIPFSConfigured()
    const arweaveConfigured = StorageService.isArweaveConfigured()

    if (!ipfsConfigured && !arweaveConfigured) {
      actualType = 'fallback'
    } else if (actualType === 'ipfs' && !ipfsConfigured) {
      actualType = 'fallback'
    } else if (actualType === 'arweave' && !arweaveConfigured) {
      actualType = 'fallback'
    }

    // Perform upload(s)
    let ipfsCid: string | undefined
    let ipfsGatewayUrl: string | undefined
    let arweaveTxId: string | undefined
    let arweaveGatewayUrl: string | undefined
    let finalCid: string
    let finalGatewayUrl: string

    if (actualType === 'ipfs') {
      const result = await StorageService.uploadToIPFS(buffer, fileName)
      ipfsCid = result.cid
      ipfsGatewayUrl = result.url
      finalCid = result.cid
      finalGatewayUrl = result.url
    } else if (actualType === 'arweave') {
      const arweaveTags = [
        { name: 'File-Name', value: fileName },
        { name: 'Content-Hash', value: contentHash },
      ]
      const result = await StorageService.uploadToArweave(buffer, arweaveTags)
      arweaveTxId = result.txId
      arweaveGatewayUrl = result.url
      finalCid = result.txId
      finalGatewayUrl = result.url
    } else if (actualType === 'dual') {
      const arweaveTags = [
        { name: 'File-Name', value: fileName },
        { name: 'Content-Hash', value: contentHash },
      ]
      const [ipfsResult, arweaveResult] = await Promise.all([
        (ipfsConfigured
          ? StorageService.uploadToIPFS(buffer, fileName)
          : Promise.resolve({ cid: contentHash, url: `/api/storage/download?cid=sha256:${contentHash}` })),
        (arweaveConfigured
          ? StorageService.uploadToArweave(buffer, arweaveTags)
          : Promise.resolve({ txId: contentHash, url: `/api/storage/download?txId=sha256:${contentHash}` })),
      ])

      ipfsCid = ipfsResult.cid
      ipfsGatewayUrl = ipfsResult.url
      arweaveTxId = arweaveResult.txId
      arweaveGatewayUrl = arweaveResult.url
      finalCid = ipfsCid
      finalGatewayUrl = ipfsGatewayUrl
    } else {
      // Fallback only
      const result = await StorageService.uploadToIPFS(buffer, fileName)
      ipfsCid = result.cid
      ipfsGatewayUrl = result.url
      finalCid = result.cid
      finalGatewayUrl = result.url
    }

    // Store metadata in PostgreSQL
    let record = null
    try {
      record = await db.storageRecord.create({
        data: {
          fileName,
          fileSize: buffer.length,
          mimeType,
          contentHash,
          ipfsCid: ipfsCid || null,
          ipfsGatewayUrl: ipfsGatewayUrl || null,
          arweaveTxId: arweaveTxId || null,
          arweaveGatewayUrl: arweaveGatewayUrl || null,
          storageType: actualType,
          metadata: Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : null,
          status: 'uploaded',
        },
      })
    } catch (dbError) {
      console.warn('[Storage] DB record creation failed (DB may not be available):', dbError)
    }

    return NextResponse.json({
      success: true,
      data: {
        id: record?.id || `stor_${Date.now()}`,
        cid: finalCid,
        gatewayUrl: finalGatewayUrl,
        storageType: actualType,
        fileName,
        size: buffer.length,
        contentHash,
        timestamp: new Date().toISOString(),
        arweaveTxId: arweaveTxId || undefined,
        arweaveGatewayUrl: arweaveGatewayUrl || undefined,
        ipfsCid: ipfsCid || undefined,
        ipfsGatewayUrl: ipfsGatewayUrl || undefined,
      },
    })
  } catch (error) {
    console.error('[Storage] Upload failed:', error)
    return NextResponse.json(
      { success: false, error: 'Upload failed' },
      { status: 500 },
    )
  }
}

// GET /api/storage/upload — List upload history
export async function GET() {
  try {
    const records = await db.storageRecord.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({
      success: true,
      data: {
        uploads: records,
        total: records.length,
      },
    })
  } catch {
    // Fallback: return empty if DB not available
    return NextResponse.json({
      success: true,
      data: {
        uploads: [],
        total: 0,
      },
    })
  }
}
