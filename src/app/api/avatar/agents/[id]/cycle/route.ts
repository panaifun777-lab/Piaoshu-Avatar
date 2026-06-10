import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create()
  }
  return zaiInstance
}

async function getClonePersona(cloneId: string): Promise<string> {
  try {
    const clone = await db.avatarClone.findUnique({ where: { id: cloneId } })
    return clone?.persona || ''
  } catch {
    return ''
  }
}

// POST /api/avatar/agents/[id]/cycle - Trigger agent cycle (3-phase LLM execution)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const agent = await db.cloneAgent.findUnique({
      where: { id },
      include: { clone: true },
    })
    if (!agent) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      )
    }

    // Set agent to working
    await db.cloneAgent.update({
      where: { id },
      data: { status: 'working' },
    })

    const zai = await getZAI()
    const clonePersona = await getClonePersona(agent.cloneId)
    const personalityContext = clonePersona
      ? `\n\n你的分身核心人格：\n${clonePersona.substring(0, 1500)}`
      : ''

    // Create a new cycle
    const cycle = await db.agentCycle.create({
      data: {
        agentId: id,
        phase: 'planning',
      },
    })

    // === Phase 1: Planning ===
    const planPrompt = `你是${agent.name}代理，角色类型: ${agent.role}。
你的人格描述: ${agent.persona}${personalityContext}

作为Polsia自主代理，请基于你的角色制定本周期工作计划。你需要：
1. 评估当前状态和优先事项
2. 制定3-5个可执行的行动项
3. 为每个行动项设定预期成果和输出类型
4. 评估风险和依赖

输出格式（严格JSON）：
{
  "priority_level": "高|中|低",
  "actions": [
    {"action": "具体行动描述", "expected_outcome": "预期成果", "output_type": "code|email|deployment|analysis|design|task", "priority": 1-5}
  ],
  "focus_area": "聚焦领域",
  "risk_assessment": "风险评估",
  "dependencies": ["依赖项列表"]
}`

    const planCompletion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: planPrompt },
        { role: 'user', content: `作为${agent.name}代理，请制定本周期工作计划。你已累计完成${agent.cycleCount}个周期。当前日期: ${new Date().toISOString().split('T')[0]}` },
      ],
      thinking: { type: 'disabled' },
    })

    const planOutput = planCompletion.choices[0]?.message?.content || ''

    // Update cycle with plan
    await db.agentCycle.update({
      where: { id: cycle.id },
      data: { phase: 'executing', plan: planOutput },
    })

    // === Phase 2: Executing ===
    const execPrompt = `你是${agent.name}代理，角色类型: ${agent.role}。
你的人格描述: ${agent.persona}${personalityContext}

基于刚才制定的计划，模拟执行过程。你需要：
1. 对每个行动项模拟执行结果
2. 生成具体的输出内容（代码片段、邮件草稿、分析报告等）
3. 标记完成状态
4. 给出量化指标

输出格式（严格JSON）：
{
  "results": [
    {"action": "行动描述", "status": "completed|blocked|partial", "output_type": "code|email|deployment|analysis|design|task", "output_title": "输出标题", "output_content": "具体输出内容", "metrics": "相关指标"}
  ],
  "overall_progress": "0-100%",
  "blockers": ["阻碍项"],
  "learnings": ["学到的要点"],
  "quantitative_metrics": {"key": "value"}
}`

    const execCompletion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: execPrompt },
        { role: 'user', content: `基于以下计划执行：\n${planOutput.substring(0, 1500)}` },
      ],
      thinking: { type: 'disabled' },
    })

    const execOutput = execCompletion.choices[0]?.message?.content || ''

    // Update cycle with execution
    await db.agentCycle.update({
      where: { id: cycle.id },
      data: { phase: 'reporting', execution: execOutput },
    })

    // === Phase 3: Reporting ===
    const reportPrompt = `你是${agent.name}代理，角色类型: ${agent.role}。
你的人格描述: ${agent.persona}${personalityContext}

基于计划和执行结果，生成本周期报告。要求：
1. 一句话总结本周期成果
2. 关键数据点和指标
3. 下周期建议
4. 需要用户关注的事项

用简洁的中文输出，保持你的角色风格。`

    const reportCompletion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: reportPrompt },
        { role: 'user', content: `计划：${planOutput.substring(0, 800)}\n\n执行：${execOutput.substring(0, 800)}` },
      ],
      thinking: { type: 'disabled' },
    })

    const reportOutput = reportCompletion.choices[0]?.message?.content || ''

    // Complete the cycle
    const completedCycle = await db.agentCycle.update({
      where: { id: cycle.id },
      data: {
        phase: 'completed',
        report: reportOutput,
        metrics: execOutput.substring(0, 2000),
        completedAt: new Date(),
      },
    })

    // Parse execution results to create AgentOutput entries
    let outputsCreated = 0
    try {
      const execJson = JSON.parse(execOutput)
      if (execJson.results && Array.isArray(execJson.results)) {
        for (const result of execJson.results) {
          if (result.output_title && result.output_content) {
            await db.agentOutput.create({
              data: {
                agentId: id,
                cycleId: cycle.id,
                outputType: result.output_type || 'analysis',
                title: result.output_title,
                content: result.output_content,
                metadata: JSON.stringify({
                  action: result.action,
                  status: result.status,
                  metrics: result.metrics,
                }),
                status: result.status === 'completed' ? 'submitted' : 'draft',
              },
            })
            outputsCreated++
          }
        }
      }
    } catch {
      // If JSON parsing fails, create a single output entry
      await db.agentOutput.create({
        data: {
          agentId: id,
          cycleId: cycle.id,
          outputType: 'analysis',
          title: `${agent.name}周期执行结果`,
          content: execOutput.substring(0, 3000),
          status: 'submitted',
        },
      })
      outputsCreated = 1
    }

    // Update agent status
    await db.cloneAgent.update({
      where: { id },
      data: {
        status: 'idle',
        lastCycleAt: new Date(),
        cycleCount: { increment: 1 },
        experience: { increment: 10 },
      },
    })

    // Update clone stats
    await db.avatarClone.update({
      where: { id: agent.cloneId },
      data: {
        totalCycles: { increment: 1 },
        lastActiveAt: new Date(),
        experience: { increment: 5 },
      },
    })

    // Create activity
    await db.cloneActivity.create({
      data: {
        cloneId: agent.cloneId,
        agentId: id,
        activityType: 'cycle_completed',
        title: `${agent.name}完成周期#${agent.cycleCount + 1}`,
        description: reportOutput.substring(0, 200),
        metadata: JSON.stringify({ cycleId: cycle.id, outputsCreated }),
      },
    })

    // Create memory entry
    await db.memoryEntry.create({
      data: {
        sourceType: 'agent_cycle',
        sourceId: cycle.id,
        content: `[${agent.name}代理] 周期#${agent.cycleCount + 1}完成: ${reportOutput.substring(0, 200)}`,
        tags: `代理周期,${agent.name},${agent.role},Polsia`,
        relevanceScore: 0.85,
      },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'cycle',
        module: 'avatar',
        entityType: 'AgentCycle',
        entityId: cycle.id,
        details: JSON.stringify({
          agentName: agent.name,
          cycleCount: agent.cycleCount + 1,
          outputsCreated,
        }),
        performedBy: agent.name,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        cycle: completedCycle,
        outputsCreated,
        report: reportOutput,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to run cycle:', error)
    // Reset agent status on error
    try {
      const { id } = await params
      await db.cloneAgent.update({
        where: { id },
        data: { status: 'error' },
      })
    } catch {
      // Ignore cleanup errors
    }
    return NextResponse.json(
      { success: false, error: 'Failed to run cycle' },
      { status: 500 }
    )
  }
}

// GET /api/avatar/agents/[id]/cycle - Get cycle history
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const cycles = await db.agentCycle.findMany({
      where: { agentId: id },
      orderBy: { startedAt: 'desc' },
      take: 20,
      include: {
        outputs: true,
      },
    })

    return NextResponse.json({ success: true, data: cycles })
  } catch (error) {
    console.error('Failed to fetch cycles:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cycles' },
      { status: 500 }
    )
  }
}
