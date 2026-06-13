/**
 * GET/POST /api/leaderboard — Redis-backed leaderboard API
 *
 * GET: Return top 20 from Redis ZSET "leaderboard:global"
 * GET ?user=username: Return specific user's rank and score
 * POST: Accept { username: string, score: number } and ZADD to Redis
 */
import { NextRequest, NextResponse } from 'next/server'
import { redis, isRedisAvailable } from '@/lib/redis'

const LEADERBOARD_KEY = 'leaderboard:global'

// ─── Mock data for when Redis is unavailable ────────────────
const MOCK_LEADERBOARD = [
  { rank: 1,  username: 'piaoshu',   score: 9842 },
  { rank: 2,  username: 'design_ai',  score: 8721 },
  { rank: 3,  username: 'data_node',  score: 7640 },
  { rank: 4,  username: 'biz_mind',   score: 6983 },
  { rank: 5,  username: 'shadow_01',  score: 5410 },
  { rank: 6,  username: 'neo_coder',  score: 4932 },
  { rank: 7,  username: 'quant_lee',  score: 4210 },
  { rank: 8,  username: 'arch_faye',  score: 3876 },
  { rank: 9,  username: 'dev_null',   score: 3200 },
  { rank: 10, username: 'web4_bot',   score: 2894 },
  { rank: 11, username: 'cto_slash',  score: 2540 },
  { rank: 12, username: 'ml_phantom', score: 2180 },
  { rank: 13, username: 'rust_fan',   score: 1920 },
  { rank: 14, username: 'chain_wolf', score: 1680 },
  { rank: 15, username: 'sol_queen',  score: 1420 },
  { rank: 16, username: 'go_rider',   score: 1180 },
  { rank: 17, username: 'py_ninja',   score: 950 },
  { rank: 18, username: 'js_cat',     score: 780 },
  { rank: 19, username: 'css_wiz',    score: 620 },
  { rank: 20, username: 'sql_dog',    score: 500 },
]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userParam = searchParams.get('user')

  try {
    const redisOk = await isRedisAvailable()

    if (!redisOk) {
      // Fallback to mock data
      if (userParam) {
        const found = MOCK_LEADERBOARD.find(
          e => e.username.toLowerCase() === userParam.toLowerCase()
        )
        return NextResponse.json({
          success: true,
          leaderboard: MOCK_LEADERBOARD.slice(0, 20),
          user: found
            ? { rank: found.rank, score: found.score }
            : { rank: null, score: 0 },
          _fallback: true,
        })
      }
      return NextResponse.json({
        success: true,
        leaderboard: MOCK_LEADERBOARD.slice(0, 20),
        _fallback: true,
      })
    }

    // Real Redis path
    const results = await redis.zrevrange(LEADERBOARD_KEY, 0, 19, 'WITHSCORES')

    // ioredis returns [member1, score1, member2, score2, ...] when WITHSCORES
    const leaderboard: Array<{ rank: number; username: string; score: number }> = []
    if (Array.isArray(results)) {
      for (let i = 0; i < results.length; i += 2) {
        leaderboard.push({
          rank: leaderboard.length + 1,
          username: results[i] as string,
          score: parseFloat(results[i + 1] as string),
        })
      }
    }

    let user: { rank: number | null; score: number } | undefined
    if (userParam) {
      const score = await redis.zscore(LEADERBOARD_KEY, userParam)
      if (score !== null && score !== undefined) {
        const rank = await redis.zrevrank(LEADERBOARD_KEY, userParam)
        user = {
          rank: rank !== null && rank !== undefined ? (rank as number) + 1 : null,
          score: parseFloat(String(score)),
        }
      } else {
        user = { rank: null, score: 0 }
      }
    }

    return NextResponse.json({
      success: true,
      leaderboard,
      ...(user ? { user } : {}),
    })
  } catch (err) {
    console.error('[leaderboard] GET error:', err)
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { username, score } = body as { username?: string; score?: number }

    if (!username || typeof username !== 'string' || username.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'username is required' },
        { status: 400 }
      )
    }
    if (typeof score !== 'number' || isNaN(score)) {
      return NextResponse.json(
        { success: false, error: 'score must be a number' },
        { status: 400 }
      )
    }

    const redisOk = await isRedisAvailable()

    if (!redisOk) {
      return NextResponse.json({
        success: true,
        message: 'Score recorded (fallback — Redis unavailable)',
        username: username.trim(),
        score,
        _fallback: true,
      })
    }

    await redis.zadd(LEADERBOARD_KEY, score, username.trim())

    const rank = await redis.zrevrank(LEADERBOARD_KEY, username.trim())

    return NextResponse.json({
      success: true,
      username: username.trim(),
      score,
      rank: rank !== null && rank !== undefined ? (rank as number) + 1 : null,
    })
  } catch (err) {
    console.error('[leaderboard] POST error:', err)
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    )
  }
}
