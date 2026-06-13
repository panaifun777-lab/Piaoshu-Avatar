/**
 * POST /api/shadow — Shadow Test: "如果是X场景，我分身会怎么回复？"
 * Loads SOUL.md from DB as system prompt, calls LLM with user scenario,
 * returns the response in the user's voice.
 */
import { NextRequest, NextResponse } from 'next/server'

// Dynamic import to avoid Turbopack issues
async function getZAI() {
  try {
    const ZAI = await import('z-ai-web-dev-sdk')
    return ZAI.default
  } catch {
    return null
  }
}

async function getSoulFromDB(): Promise<string> {
  try {
    const { db } = await import('@/lib/db')
    const soul = await db.soulConfig.findFirst({ where: { isActive: true } })
    return soul?.content || ''
  } catch {
    return ''
  }
}

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || ''
const DEEPSEEK_BASE = 'https://api.deepseek.com/v1'

async function callDeepSeek(systemPrompt: string, userMessage: string): Promise<string> {
  const res = await fetch(`${DEEPSEEK_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 500,
      temperature: 0.9,
    }),
  })
  const data = await res.json() as any
  return data.choices?.[0]?.message?.content || ''
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { scenario, personality } = body

    if (!scenario) {
      return NextResponse.json({ success: false, error: 'scenario is required' }, { status: 400 })
    }

    // Load personality
    const soul = personality || await getSoulFromDB()

    const systemPrompt = `你是用户的AI分身。你需要完全按照用户的表达DNA和人格来回复。
以下是用户的人格配置文件（SOUL.md）：

${soul || '（无特定人格配置，用自然的中文回复）'}

---
规则：
1. 用用户的口吻回复，模仿其语气、用词、句式
2. 回复控制在100字以内，像一条社交媒体回复/推文
3. 不要解释你是谁，直接进入角色回复
4. 如果用词习惯中包含特定脏话或口头禅，自然使用`

    let response = ''

    // Try DeepSeek first
    if (DEEPSEEK_API_KEY) {
      response = await callDeepSeek(systemPrompt, scenario)
    }

    // Fallback to Z-AI SDK
    if (!response) {
      try {
        const ZAI = await getZAI()
        if (ZAI) {
          const zai = await ZAI.create()
          const result = await zai.completion({
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: scenario },
            ],
            maxTokens: 300,
          })
          response = (result as any)?.choices?.[0]?.message?.content || ''
        }
      } catch {
        // Both providers failed
      }
    }

    if (!response) {
      return NextResponse.json({
        success: true,
        response: '（AI 服务暂不可用，请稍后重试 /shadow）',
        personality_used: soul ? 'SOUL.md' : 'default',
        fallback: true,
      })
    }

    return NextResponse.json({
      success: true,
      response: response.trim(),
      personality_used: soul ? 'SOUL.md' : 'default',
    })
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: (err as Error).message,
    }, { status: 500 })
  }
}
