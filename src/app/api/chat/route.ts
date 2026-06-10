import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

// Singleton for ZAI instance
let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create()
  }
  return zaiInstance
}

// POST /api/chat - AI-powered chat for the founder system
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { message, systemPrompt, context } = body

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const zai = await getZAI()

    // Default system prompt for piaoshu founder system
    const defaultSystemPrompt = `你是飘数(Piaoshu)创始人操作系统的AI共生体。你的角色是：
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

    const messages = [
      {
        role: 'assistant' as const,
        content: systemPrompt || defaultSystemPrompt,
      },
    ]

    // Add context if provided
    if (context) {
      messages.push({
        role: 'user' as const,
        content: `[上下文信息]\n${context}`,
      })
      messages.push({
        role: 'assistant' as const,
        content: '已理解上下文，请继续提问。',
      })
    }

    messages.push({
      role: 'user' as const,
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

    return NextResponse.json({
      success: true,
      response: aiResponse,
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to get AI response' },
      { status: 500 }
    )
  }
}
