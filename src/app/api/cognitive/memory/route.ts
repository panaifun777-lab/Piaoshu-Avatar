import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const memories = await db.memoryEntry.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
    const totalMemories = await db.memoryEntry.count()
    const avgRelevance = await db.memoryEntry.aggregate({
      _avg: { relevanceScore: true },
    })
    return NextResponse.json({
      memories,
      total: totalMemories,
      continuity: Math.min((avgRelevance._avg.relevanceScore || 0) * 100, 100),
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch memories' }, { status: 500 })
  }
}
