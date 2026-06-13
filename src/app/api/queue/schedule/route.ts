/**
 * POST /api/queue/schedule — enqueue a task via Redis directly.
 * Uses lazy-loaded redis to avoid Turbopack ESM issues.
 */
import { NextRequest, NextResponse } from 'next/server'
import { redis, isRedisAvailable } from '@/lib/redis'

const QUEUE_KEYS: Record<string, string> = {
  'agent:task': 'avatar:task',
  'agent:cycle': 'avatar:cycle',
  'swarm:distribute': 'swarm:distribute',
  'swarm:insight': 'swarm:insight',
}

export async function POST(req: NextRequest) {
  try {
    const redisOk = await isRedisAvailable()
    if (!redisOk) {
      return NextResponse.json({
        success: false,
        error: 'Redis unavailable',
      }, { status: 503 })
    }

    const body = await req.json()
    const { type, payload, priority = 5, delay = 0 } = body

    if (!type || !payload) {
      return NextResponse.json({
        success: false,
        error: 'type and payload are required',
      }, { status: 400 })
    }

    const queueKey = QUEUE_KEYS[type]
    if (!queueKey) {
      return NextResponse.json({
        success: false,
        error: `Unknown task type: ${type}`,
      }, { status: 400 })
    }

    // Push to BullMQ-compatible Redis list
    const jobData = JSON.stringify({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: type,
      data: payload,
      opts: { priority, delay, attempts: 3 },
      timestamp: Date.now(),
    })

    if (delay > 0) {
      // Delayed jobs go to delayed list with score
      await redis.hset(`bull:${queueKey}:delayed`, jobData, String(Date.now() + delay))
    } else {
      // Immediate jobs go to wait list
      await redis.llen(`bull:${queueKey}:wait`)  // just to ensure connection
      // Use Redis list for BullMQ compatibility
      const red = await (await import('ioredis')).default
      const r = new red(process.env.REDIS_URL || 'redis://127.0.0.1:6379')
      await r.lpush(`bull:${queueKey}:wait`, jobData)
      r.disconnect()
    }

    return NextResponse.json({
      success: true,
      queueName: queueKey,
      message: `Task enqueued on ${queueKey}`,
    })
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: (err as Error).message,
    }, { status: 500 })
  }
}
