/**
 * POST /api/reflection/extract — Extract structured insights from user messages
 * Called by tg-bot-service for auto-reflection pipeline.
 * Uses the chat API under the hood with a reflection-specific system prompt.
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { message, chatId, user } = body as {
      message?: string
      chatId?: string
      user?: string
    }

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { success: false, error: 'message is required' },
        { status: 400 }
      )
    }

    // Try to extract structured insights using the chat API
    const reflectionPrompt = `你是一个反思助手。用户（${user || "用户"}）发来了一段思考或对话。请提取其中的关键洞察，用以下格式输出：

1. 【核心情绪】— 一句话概括用户的主要情绪状态
2. 【关键洞察】— 用户表达了什么重要观点或发现
3. 【行动提示】— 基于此反思，可以采取什么行动
4. 【一句话总结】— 用飘叔风格的一句话回应（短句，高断言，不讨好）

如果内容很短或没有深度思考，只输出一句简短回应即可。`

    // Call the existing chat API internally
    const chatUrl = `${req.nextUrl.origin}/api/chat`
    const chatRes = await fetch(chatUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `用户说：${message}`,
        systemPrompt: reflectionPrompt,
        provider: 'deepseek',
      }),
    })

    if (!chatRes.ok) {
      // Fallback: return simple acknowledgment
      return NextResponse.json({
        success: true,
        insight: `收到你的思考了，${user || "本尊"}。`,
        summary: null,
      })
    }

    const chatData = await chatRes.json()

    if (chatData?.success && chatData?.response) {
      return NextResponse.json({
        success: true,
        insight: chatData.response,
        summary: chatData.response,
        provider: chatData.provider,
      })
    }

    // Fallback
    return NextResponse.json({
      success: true,
      insight: `收到，${user || "本尊"}。我已经记下了。`,
      summary: null,
    })
  } catch (error) {
    console.error('[Reflection Extract] Error:', error)
    // Always return success to the bot — don't break the user flow
    return NextResponse.json({
      success: true,
      insight: "收到你的思考。Hermes正在后台消化中。",
      summary: null,
      degraded: true,
    })
  }
}
