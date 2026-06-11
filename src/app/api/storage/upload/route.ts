import { NextRequest, NextResponse } from 'next/server'

// In-memory upload records (simulated — would be DB in production)
interface UploadRecord {
  id: string
  cid: string
  gatewayUrl: string
  storageType: 'ipfs' | 'arweave' | 'dual'
  fileName: string
  size: number
  metadata: Record<string, string>
  timestamp: string
  arweaveTxId?: string
  arweaveGatewayUrl?: string
}

const uploadRecords: UploadRecord[] = []

// Generate a realistic-looking CID (Content Identifier) for IPFS
function generateMockCID(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  let cid = 'Qm'
  for (let i = 0; i < 44; i++) {
    cid += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return cid
}

// Generate a realistic-looking Arweave transaction ID
function generateMockTxId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
  let txId = ''
  for (let i = 0; i < 43; i++) {
    txId += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return txId
}

function generateId(): string {
  return `stor_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const content = body.content as string | undefined
    const storageType = (body.storageType as string) || 'auto'
    const metadata = (body.metadata as Record<string, string>) || {}
    const fileName = body.fileName as string || 'unnamed'

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Content is required' },
        { status: 400 }
      )
    }

    const contentSize = new TextEncoder().encode(content).length

    // Determine actual storage type
    let actualType: 'ipfs' | 'arweave' | 'dual'
    if (storageType === 'auto') {
      // Auto-select: use dual for large content, IPFS for small
      actualType = contentSize > 100000 ? 'dual' : 'ipfs'
    } else if (storageType === 'ipfs') {
      actualType = 'ipfs'
    } else if (storageType === 'arweave') {
      actualType = 'arweave'
    } else {
      actualType = 'dual'
    }

    // Simulate upload latency
    await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 700))

    const record: UploadRecord = {
      id: generateId(),
      cid: '',
      gatewayUrl: '',
      storageType: actualType,
      fileName,
      size: contentSize,
      metadata,
      timestamp: new Date().toISOString(),
    }

    if (actualType === 'ipfs' || actualType === 'dual') {
      record.cid = generateMockCID()
      record.gatewayUrl = `https://ipfs.io/ipfs/${record.cid}`
    }

    if (actualType === 'arweave' || actualType === 'dual') {
      record.arweaveTxId = generateMockTxId()
      record.arweaveGatewayUrl = `https://arweave.net/${record.arweaveTxId}`
    }

    // For dual, the main CID is IPFS, arweave is supplementary
    if (actualType === 'arweave') {
      record.cid = record.arweaveTxId || ''
      record.gatewayUrl = record.arweaveGatewayUrl || ''
    }

    uploadRecords.push(record)

    return NextResponse.json({
      success: true,
      data: {
        id: record.id,
        cid: record.cid,
        gatewayUrl: record.gatewayUrl,
        storageType: record.storageType,
        fileName: record.fileName,
        size: record.size,
        timestamp: record.timestamp,
        arweaveTxId: record.arweaveTxId,
        arweaveGatewayUrl: record.arweaveGatewayUrl,
      },
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Upload failed' },
      { status: 500 }
    )
  }
}

// GET to list upload history
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      uploads: uploadRecords.slice(-50).reverse(),
      total: uploadRecords.length,
    },
  })
}
