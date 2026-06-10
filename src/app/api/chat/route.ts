import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'

// Singleton for ZAI instance
let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create()
  }
  return zaiInstance
}

async function getSoulConfig(): Promise<string> {
  try {
    const soul = await db.soulConfig.findFirst({ where: { isActive: true } })
    return soul?.content || ''
  } catch {
    return ''
  }
}

// Default system prompt for piaoshu founder system
const DEFAULT_SYSTEM_PROMPT = `你是飘数(Piaoshu)创始人操作系统的AI共生体。你的角色是：
1. 作为创始人的数字分身，帮助分析战略决策
2. 进行红蓝对抗思维，识别致命漏洞
3. 基于数据证据给出建议，拒绝模糊表述
4. 所有输出必须附带置信度评分（0-1）
5. 当置信度低于0.6时，明确建议人工介入

系统架构：
- 认知分片引擎：基于创始人语料训练的数字分身，进行红蓝对抗
- 可信证据链：W3C DID+VC规范，消除AI幻觉
- 流体协作调度器：动态分配任务给AI或人类节点
- 虚实共生沙盒：直接生成可交互3D原型

当前处于Phase 1（D1-D30）：基建与协议验证阶段。`

// POST /api/chat - AI-powered chat for the founder system
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { message, systemPrompt, context, sessionId } = body

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const zai = await getZAI()
    const soulContent = await getSoulConfig()

    // Build personality context from SOUL.md
    const personalityContext = soulContent
      ? `\n\n你的行为规范（基于飘叔SOUL.md）：\n${soulContent.substring(0, 2000)}`
      : ''

    const effectiveSystemPrompt = (systemPrompt || DEFAULT_SYSTEM_PROMPT) + personalityContext

    // Build messages array
    const messages: Array<{ role: 'assistant' | 'user'; content: string }> = [
      {
        role: 'assistant',
        content: effectiveSystemPrompt,
      },
    ]

    // Add context if provided
    if (context) {
      messages.push({
        role: 'user',
        content: `[上下文信息]\n${context}`,
      })
      messages.push({
        role: 'assistant',
        content: '已理解上下文，请继续提问。',
      })
    }

    // Load recent chat history for this session to provide continuity
    if (sessionId) {
      const recentMessages = await db.chatMessage.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      })
      // Reverse to get chronological order and add to messages
      const historyMessages = recentMessages.reverse().map((msg) => ({
        role: (msg.role === 'assistant' ? 'assistant' : 'user') as 'assistant' | 'user',
        content: msg.content,
      }))
      // Insert history after system prompt but before the new message
      messages.push(...historyMessages)
    }

    messages.push({
      role: 'user',
      content: message,
    })

    const completion = await zai.chat.completions.create({
      messages,
      thinking: { type: 'disabled' },
    })

    const aiResponse = completion.choices[0]?.message?.content

    if (!aiResponse) {
      return NextResponse.json({ error: 'Empty AI response' }, { status: 500 })
    }

    // Save user message to database
    await db.chatMessage.create({
      data: {
        role: 'user',
        content: message,
        sessionId: sessionId || null,
        module: 'cognitive',
        metadata: context ? JSON.stringify({ context }) : null,
      },
    })

    // Save assistant response to database
    await db.chatMessage.create({
      data: {
        role: 'assistant',
        content: aiResponse,
        sessionId: sessionId || null,
        module: 'cognitive',
        modelUsed: 'z-ai-web-dev-sdk',
        metadata: JSON.stringify({ soulInjected: !!soulContent }),
      },
    })

    // Create memory entry for significant conversations
    // Only create memory for messages that seem strategically important
    const isSignificant = message.length > 50 || 
      message.includes('决策') || 
      message.includes('战略') || 
      message.includes('风险') ||
      message.includes('分析') ||
      message.includes('评估')

    if (isSignificant) {
      await db.memoryEntry.create({
        data: {
          sourceType: 'chat',
          content: `对话: Q=${message.substring(0, 80)}... A=${aiResponse.substring(0, 80)}...`,
          tags: '对话,创始人助手',
          relevanceScore: 0.7,
        },
      })
    }

    // Create audit log for the chat interaction
    await db.auditLog.create({
      data: {
        action: 'chat',
        module: 'cognitive',
        entityType: 'chatMessage',
        details: JSON.stringify({
          sessionId: sessionId || 'anonymous',
          soulInjected: !!soulContent,
          isSignificant,
        }),
        performedBy: 'system',
      },
    })

    return NextResponse.json({
      success: true,
      response: aiResponse,
      metadata: {
        soulInjected: !!soulContent,
        sessionId: sessionId || null,
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to get AI response' },
      { status: 500 }
    )
  }
}

// GET /api/chat - Retrieve chat history for a session
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('sessionId')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 })
    }

    const messages = await db.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      take: limit,
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Failed to fetch chat history:', error)
    return NextResponse.json({ error: 'Failed to fetch chat history' }, { status: 500 })
  }
}
