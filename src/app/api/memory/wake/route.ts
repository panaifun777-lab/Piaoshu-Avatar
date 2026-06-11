import { NextRequest, NextResponse } from 'next/server'
import { wakeUp, loadRoom, deepSearch } from '@/lib/memory-loader'
import { seedDefaultWings } from '@/lib/memory-seed'

// GET /api/memory/wake — Memory wake-up, returns L0+L1 layered content for a clone
export async function GET(req: NextRequest) {
  try {
    const cloneId = req.nextUrl.searchParams.get('cloneId')
    const roomId = req.nextUrl.searchParams.get('roomId')
    const query = req.nextUrl.searchParams.get('query')
    const wingId = req.nextUrl.searchParams.get('wingId')

    if (!cloneId) {
      return NextResponse.json(
        { success: false, error: 'cloneId is required' },
        { status: 400 }
      )
    }

    // Auto-seed default wings if none exist
    await seedDefaultWings(cloneId)

    // Default: wake-up (L0 + L1)
    const wakeResult = await wakeUp(cloneId)

    // Optional: also load L2 for a specific room
    let roomResult = null
    if (roomId) {
      roomResult = await loadRoom(roomId)
    }

    // Optional: also do L3 deep search
    let searchResult = null
    if (query) {
      searchResult = await deepSearch(cloneId, query, wingId || undefined)
    }

    return NextResponse.json({
      success: true,
      data: {
        wakeUp: wakeResult,
        ...(roomResult ? { room: roomResult } : {}),
        ...(searchResult ? { search: searchResult } : {}),
      },
    })
  } catch (error) {
    console.error('Failed to wake memory:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to wake memory' },
      { status: 500 }
    )
  }
}
