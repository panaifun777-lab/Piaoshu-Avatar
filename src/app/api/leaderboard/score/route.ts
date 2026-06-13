/**
 * POST /api/leaderboard/score — Semantic entropy scoring endpoint
 *
 * Accept: { username: string, text: string }
 * Calculates a semantic entropy score based on text analysis:
 *   base = text.length / 2
 *   + keyword bonuses for Chinese tech/finance/AI terms
 * ZINCRBY the calculated score to Redis leaderboard
 * Returns: { success: true, score_increment: N, new_score: N, rank: N }
 */
import { NextRequest, NextResponse } from 'next/server'
import { redis, isRedisAvailable } from '@/lib/redis'

const LEADERBOARD_KEY = 'leaderboard:global'

// ─── Semantic keyword bonus map ──────────────────────────────
// Each keyword contributes bonus points when found in the text
interface KeywordBonus {
  pattern: RegExp
  bonus: number
  label: string
}

const KEYWORD_BONUSES: KeywordBonus[] = [
  // Chinese AI/tech terms — high value
  { pattern: /大模型|LLM|GPT|Claude|DeepSeek|通义|文心/, bonus: 150, label: 'AI大模型' },
  { pattern: /AI Agent|智能体|多智能体|Multi.?Agent|Swarm/, bonus: 130, label: 'AI Agent' },
  { pattern: /Transformer|注意力机制|Attention/, bonus: 120, label: 'Transformer' },
  { pattern: /RAG|向量数据库|Vector|Embedding|语义搜索/, bonus: 110, label: 'RAG/向量' },
  { pattern: /微调|Fine.?tuning|RLHF|对齐|Alignment/, bonus: 100, label: '微调对齐' },

  // Blockchain / Web4 terms
  { pattern: /区块链|Blockchain|去中心化|Decentralized/, bonus: 120, label: '区块链' },
  { pattern: /Web4|Web3|DID|VC|可验证凭证|意识主权/, bonus: 130, label: 'Web4' },
  { pattern: /智能合约|Solidity|Move|Rust合约/, bonus: 100, label: '智能合约' },
  { pattern: /PoUE|PAS|共识|Consensus|TEE|MPC/, bonus: 110, label: '共识协议' },
  { pattern: /AFC|Token经济|代币|通证|NFT/, bonus: 100, label: 'Token经济' },
  { pattern: /AIBBS|Avatar|数字分身|数字永生/, bonus: 120, label: 'Avatar' },

  // Finance / Business
  { pattern: /量化|Quantitative|交易策略|Trading/, bonus: 110, label: '量化交易' },
  { pattern: /融资|VC|估值|Valuation|商业模式|Business.?Model/, bonus: 90, label: '融资商业' },
  { pattern: /增长|Growth|DAU|MAU|获客|冷启动/, bonus: 80, label: '增长' },
  { pattern: /GEO|SEO|搜索优化|关键词/, bonus: 70, label: 'GEO/SEO' },

  // Engineering
  { pattern: /架构|Architecture|微服务|Microservice|分布式/, bonus: 100, label: '架构设计' },
  { pattern: /Rust|Go|TypeScript|Kubernetes|Docker|Redis/, bonus: 90, label: '技术栈' },
  { pattern: /性能优化|Performance|压测|Benchmark|Profile/, bonus: 80, label: '性能优化' },
  { pattern: /开源|Open.?Source|GitHub|Star/, bonus: 70, label: '开源' },

  // General Chinese tech terms
  { pattern: /技术选型|框架|语言|数据库|Database/, bonus: 60, label: '技术选型' },
  { pattern: /安全|Security|加密|Encryption|隐私|Privacy/, bonus: 60, label: '安全隐私' },
  { pattern: /产品|Product|MVP|迭代|Sprint/, bonus: 50, label: '产品' },
  { pattern: /社区|Community|治理|Governance|节点/, bonus: 50, label: '社区治理' },
]

/**
 * Calculate a semantic entropy score for a given text.
 * Score = (text.length / 2) + sum of keyword bonuses (one-time per category)
 */
function calculateScore(text: string): {
  score: number
  breakdown: { base: number; bonuses: Array<{ label: string; bonus: number }> }
} {
  const base = Math.round(text.length / 2)
  const bonuses: Array<{ label: string; bonus: number }> = []

  for (const kb of KEYWORD_BONUSES) {
    if (kb.pattern.test(text)) {
      bonuses.push({ label: kb.label, bonus: kb.bonus })
    }
  }

  const totalBonus = bonuses.reduce((sum, b) => sum + b.bonus, 0)
  const score = base + totalBonus

  return {
    score: Math.max(1, score),
    breakdown: { base, bonuses },
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { username, text } = body as { username?: string; text?: string }

    if (!username || typeof username !== 'string' || username.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'username is required' },
        { status: 400 }
      )
    }
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'text is required' },
        { status: 400 }
      )
    }

    // Calculate semantic entropy score
    const { score: scoreIncrement, breakdown } = calculateScore(text)

    const redisOk = await isRedisAvailable()

    if (!redisOk) {
      return NextResponse.json({
        success: true,
        username: username.trim(),
        score_increment: scoreIncrement,
        new_score: scoreIncrement,
        rank: null,
        breakdown,
        _fallback: true,
      })
    }

    // ZINCRBY — atomically increments and returns new score
    const newScoreRaw = await redis.zincrby(LEADERBOARD_KEY, scoreIncrement, username.trim())
    const newScore = parseFloat(String(newScoreRaw))

    // Get updated rank (0-indexed from Redis, we add 1)
    const rankRaw = await redis.zrevrank(LEADERBOARD_KEY, username.trim())
    const rank =
      rankRaw !== null && rankRaw !== undefined ? (rankRaw as number) + 1 : null

    return NextResponse.json({
      success: true,
      username: username.trim(),
      score_increment: scoreIncrement,
      new_score: newScore,
      rank,
      breakdown,
    })
  } catch (err) {
    console.error('[leaderboard/score] POST error:', err)
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    )
  }
}
