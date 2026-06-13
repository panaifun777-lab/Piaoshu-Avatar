/**
 * Redis connection — lazily loaded to avoid Turbopack bundling issues.
 * Uses dynamic import for ioredis (ESM package).
 */
import type { Redis as RedisType } from 'ioredis'

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379'

// Singleton factory — lazily initialized on first use
let _redis: RedisType | null = null
let _initPromise: Promise<RedisType> | null = null

async function getRedis(): Promise<RedisType> {
  if (_redis) return _redis
  if (_initPromise) return _initPromise

  _initPromise = (async () => {
    // Dynamic import avoids Turbopack static analysis
    const { default: Redis } = await import('ioredis')
    _redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times: number) {
        if (times > 5) return null
        return Math.min(times * 200, 2000)
      },
      lazyConnect: false,
    })
    _redis.on('error', (err: Error) => {
      console.error('[redis] error:', err.message)
    })
    console.log('[redis] connected')
    return _redis
  })()

  return _initPromise
}

// ─── Public API (all async because of lazy init) ─────────────

export async function isRedisAvailable(): Promise<boolean> {
  try {
    const r = await getRedis()
    return (await r.ping()) === 'PONG'
  } catch {
    return false
  }
}

// Inline redis for simple commands (avoids exporting getRedis directly)
async function r() { return getRedis() }

export const redis = {
  async ping() { return (await r()).ping() },
  async llen(key: string) { return (await r()).llen(key) },
  async xadd(stream: string, id: string, ...args: string[]) {
    return (await r()).xadd(stream, id, ...args)
  },
  async xlen(stream: string) { return (await r()).xlen(stream) },
  async xinfo(command: string, stream: string) {
    return (await r()).xinfo(command, stream)
  },
  async xreadgroup(...args: (string | number)[]) {
    return (await r()).xreadgroup(...args as any)
  },
  async xack(stream: string, group: string, id: string) {
    return (await r()).xack(stream, group, id)
  },
  async xgroup(command: string, stream: string, group: string, id: string, mkstream = false) {
    return (await r()).xgroup(command, stream, group, id, mkstream ? 'MKSTREAM' : undefined as any)
  },
  async hset(key: string, field: string, value: string) {
    return (await r()).hset(key, field, value)
  },
  async hget(key: string, field: string) { return (await r()).hget(key, field) },
  async hgetall(key: string) { return (await r()).hgetall(key) },
  async hdel(key: string, field: string) { return (await r()).hdel(key, field) },
  async publish(channel: string, message: string) {
    return (await r()).publish(channel, message)
  },
  async subscribe(channel: string) {
    const sub = (await r()).duplicate()
    await sub.subscribe(channel)
    return sub
  },
  async duplicate() { return (await r()).duplicate() },

  // ─── ZSET methods (leaderboard) ─────────────────────
  async zadd(key: string, score: number | string, member: string) {
    return (await r()).zadd(key, score, member)
  },
  async zincrby(key: string, increment: number, member: string) {
    return (await r()).zincrby(key, increment, member)
  },
  async zrevrange(key: string, start: number, stop: number, withScores?: 'WITHSCORES') {
    if (withScores === 'WITHSCORES') {
      return (await r()).zrevrange(key, start, stop, 'WITHSCORES')
    }
    return (await r()).zrevrange(key, start, stop)
  },
  async zrank(key: string, member: string) {
    return (await r()).zrank(key, member)
  },
  async zrevrank(key: string, member: string) {
    return (await r()).zrevrank(key, member)
  },
  async zscore(key: string, member: string) {
    return (await r()).zscore(key, member)
  },
  async zcard(key: string) {
    return (await r()).zcard(key)
  },
}

/**
 * Redis-backed EventBus — uses Redis Streams for pub/sub
 */
export const EventBus = {
  async publish(stream: string, data: Record<string, unknown>) {
    const payload = JSON.stringify({ ...data, timestamp: new Date().toISOString() })
    const red = await r()
    await red.xadd(stream, '*', 'data', payload)
    await red.xadd('swarm:global', '*', 'channel', stream, 'data', payload)
    return payload
  },
}

/**
 * Capability Registry — uses Redis Hash
 */
export const CapabilityRegistry = {
  async register(avatarId: string, capabilities: Record<string, unknown>) {
    const payload = JSON.stringify({ ...capabilities, lastHeartbeat: new Date().toISOString(), online: true })
    const red = await r()
    await red.hset('swarm:registry', avatarId, payload)
    await red.publish('swarm:heartbeat', JSON.stringify({ avatarId, ...capabilities }))
  },
  async getAll(): Promise<Record<string, Record<string, unknown>>> {
    const raw = await (await r()).hgetall('swarm:registry')
    const result: Record<string, Record<string, unknown>> = {}
    for (const [id, data] of Object.entries(raw)) {
      try { result[id] = JSON.parse(data) }
      catch { result[id] = { raw: data } }
    }
    return result
  },
  async get(avatarId: string): Promise<Record<string, unknown> | null> {
    const raw = await (await r()).hget('swarm:registry', avatarId)
    return raw ? JSON.parse(raw) : null
  },
  async heartbeat(avatarId: string) {
    const raw = await (await r()).hget('swarm:registry', avatarId)
    if (!raw) return false
    const data = JSON.parse(raw)
    data.lastHeartbeat = new Date().toISOString()
    data.online = true
    await (await r()).hset('swarm:registry', avatarId, JSON.stringify(data))
    return true
  },
}
