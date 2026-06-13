/**
 * GET /api/queue/stats — real-time queue statistics for dashboard.
 * Uses direct Redis calls (no bullmq import) to avoid Turbopack ESM issues.
 */
import { NextResponse } from 'next/server'
import { redis, isRedisAvailable } from '@/lib/redis'

export async function GET() {
  try {
    const redisOk = await isRedisAvailable()
    
    if (!redisOk) {
      return NextResponse.json({
        success: true,
        redis: 'disconnected',
        queues: 'unhealthy',
        stats: null,
      })
    }

    // Get queue stats from Redis keys
    const queueKeys = [
      'avatar:task', 'avatar:cycle', 
      'swarm:distribute', 'swarm:insight',
    ]
    
    const stats: Record<string, Record<string, number>> = {}
    
    for (const name of queueKeys) {
      try {
        const [waiting, active, completed, failed, delayed] = await Promise.all([
          redis.llen(`bull:${name}:wait`),
          redis.llen(`bull:${name}:active`),
          redis.llen(`bull:${name}:completed`),
          redis.llen(`bull:${name}:failed`),
          redis.llen(`bull:${name}:delayed`),
        ])
        stats[name] = { waiting, active, completed, failed, delayed }
      } catch {
        stats[name] = { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 }
      }
    }

    return NextResponse.json({
      success: true,
      redis: 'connected',
      queues: 'healthy',
      stats,
    })
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: (err as Error).message,
      stats: null,
    }, { status: 500 })
  }
}
