import { NextResponse } from 'next/server'
import { StorageService } from '@/lib/storage'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const status = await StorageService.getStatus()

    // Try to get counts from DB
    let dbStats = { total: 0, ipfsOnly: 0, arweaveOnly: 0, dual: 0, fallback: 0 }
    try {
      const records = await db.storageRecord.findMany()
      dbStats.total = records.length
      dbStats.ipfsOnly = records.filter((r) => r.storageType === 'ipfs').length
      dbStats.arweaveOnly = records.filter((r) => r.storageType === 'arweave').length
      dbStats.dual = records.filter((r) => r.storageType === 'dual').length
      dbStats.fallback = records.filter((r) => r.storageType === 'fallback').length
    } catch {
      // DB not available
    }

    return NextResponse.json({
      success: true,
      data: {
        ipfs: {
          configured: status.ipfs.configured,
          gateway: status.ipfs.gateway,
          mode: status.ipfs.configured ? 'pinata' : 'unconfigured',
        },
        arweave: {
          configured: status.arweave.configured,
          gateway: status.arweave.gateway,
          mode: status.arweave.configured ? 'arweave' : 'unconfigured',
        },
        fallback: status.fallback,
        database: dbStats,
        overall: {
          health: status.ipfs.configured || status.arweave.configured ? 'healthy' : 'fallback',
          storageUsed: `${dbStats.total} records`,
          lastActivity: new Date().toISOString(),
        },
      },
    })
  } catch {
    return NextResponse.json({
      success: true,
      data: {
        ipfs: { configured: false, gateway: '', mode: 'error' },
        arweave: { configured: false, gateway: '', mode: 'error' },
        fallback: { active: true, dir: '.fallback-storage', files: 0 },
        database: { total: 0, ipfsOnly: 0, arweaveOnly: 0, dual: 0, fallback: 0 },
        overall: { health: 'error', storageUsed: '0 records', lastActivity: new Date().toISOString() },
      },
    })
  }
}
