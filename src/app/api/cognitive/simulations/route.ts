import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/cognitive/simulations - List all simulations
export async function GET() {
  try {
    const simulations = await db.redBlueSimulation.findMany({
      orderBy: { createdAt: 'desc' },
      include: { shard: true },
    })
    return NextResponse.json({ simulations })
  } catch (error) {
    console.error('Failed to fetch simulations:', error)
    return NextResponse.json({ error: 'Failed to fetch simulations' }, { status: 500 })
  }
}

// POST /api/cognitive/simulations - Run a new red-blue simulation
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { shardId, inputIdea } = body

    if (!inputIdea) {
      return NextResponse.json({ error: 'Input idea is required' }, { status: 400 })
    }

    // Simulate red-blue adversarial analysis
    // In production, this would call the actual LLM with the shard's LoRA adapter
    const redOutput = JSON.stringify({
      vulnerabilities: [
        { severity: '致命', description: '市场时机验证不足，缺乏早期用户反馈闭环' },
        { severity: '高危', description: '技术架构存在单点故障风险，核心服务无冗余' },
        { severity: '中危', description: '竞争壁垒不够高，大厂可能3个月内跟进' },
      ]
    })

    const blueOutput = JSON.stringify({
      defenses: [
        { strength: '强', strategy: '建立用户共创机制，将早期用户转化为护城河' },
        { strength: '中', strategy: '采用微服务架构，关键节点实现多活部署' },
      ]
    })

    const confidence = 0.76
    const verdict = confidence >= 0.6 ? '通过压力测试，但需关注中危项目' : '自动触发人工介入'

    const simulation = await db.redBlueSimulation.create({
      data: {
        shardId: shardId || 'default',
        inputIdea,
        redOutput,
        blueOutput,
        verdict,
        confidence,
        status: confidence >= 0.6 ? 'completed' : 'escalated',
      },
    })

    return NextResponse.json({ simulation }, { status: 201 })
  } catch (error) {
    console.error('Failed to run simulation:', error)
    return NextResponse.json({ error: 'Failed to run simulation' }, { status: 500 })
  }
}
