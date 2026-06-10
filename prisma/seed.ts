import { db } from '@/lib/db'

async function seed() {
  console.log('🌱 Seeding piaoshu founder system...')

  // Create founder
  const founder = await db.founder.upsert({
    where: { email: 'founder@piaoshu.ai' },
    update: {},
    create: {
      name: 'Piaoshu Founder',
      email: 'founder@piaoshu.ai',
      bio: '飘数创始人 - Web4.0 AI原生创业操作系统',
    },
  })
  console.log('✅ Founder created:', founder.name)

  // Create cognitive shards
  const shard1 = await db.cognitiveShard.create({
    data: {
      name: '战略决策分身',
      description: '基于创始人战略直觉训练的数字分身，擅长蓝方防御分析',
      modelBase: 'qwen-72b',
      loraAdapter: '/models/lora/strategic-v1',
      status: 'active',
      confidence: 0.87,
      shardType: 'blue',
      lastTrained: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
  })

  const shard2 = await db.cognitiveShard.create({
    data: {
      name: '风险扫描分身',
      description: '红方攻击分身，专注识别致命漏洞和风险',
      modelBase: 'llama-3-70b',
      loraAdapter: '/models/lora/risk-v1',
      status: 'active',
      confidence: 0.72,
      shardType: 'red',
      lastTrained: new Date(Date.now() - 5 * 60 * 60 * 1000),
    },
  })

  const shard3 = await db.cognitiveShard.create({
    data: {
      name: '产品直觉分身',
      description: '产品方向感知分身，训练中',
      modelBase: 'qwen-14b',
      status: 'training',
      confidence: 0.65,
      shardType: 'neutral',
    },
  })
  console.log('✅ Cognitive shards created:', shard1.name, shard2.name, shard3.name)

  // Create decision logs
  const decisions = [
    { title: '切入垂直SaaS市场', category: 'strategic', confidence: 0.92, outcome: '已执行，初期增长符合预期' },
    { title: '推迟C轮融资', category: 'strategic', confidence: 0.78, outcome: '现金流充裕，观望市场' },
    { title: '引入CTO联合创始人', category: 'hiring', confidence: 0.85, outcome: '进行中' },
    { title: '转向AI-first产品架构', category: 'technical', confidence: 0.71, outcome: '架构设计阶段' },
    { title: '暂停海外扩张', category: 'strategic', confidence: 0.88, outcome: '已执行，聚焦国内' },
  ]

  for (const d of decisions) {
    await db.decisionLog.create({
      data: {
        founderId: founder.id,
        title: d.title,
        category: d.category,
        confidence: d.confidence,
        outcome: d.outcome,
        content: `决策记录：${d.title}。置信度：${d.confidence}。`,
      },
    })
  }
  console.log('✅ Decision logs created:', decisions.length)

  // Create evidence items
  const evidenceItems = [
    { title: '用户访谈#23 - 支付痛点验证', type: 'interview', status: 'verified' },
    { title: 'A/B测试 - 首页转化率', type: 'ab_test', status: 'onchain' },
    { title: '决策日志 - 定价策略调整', type: 'decision_log', status: 'signed' },
    { title: '核心指标 - 月活增长率', type: 'metric', status: 'verified' },
    { title: '用户访谈#24 - 功能优先级', type: 'interview', status: 'draft' },
    { title: 'A/B测试 - 注册流程优化', type: 'ab_test', status: 'signed' },
    { title: '决策日志 - 技术栈迁移', type: 'decision_log', status: 'onchain' },
    { title: '核心指标 - 用户留存率', type: 'metric', status: 'verified' },
  ]

  for (const e of evidenceItems) {
    const hash = '0x' + Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('')
    await db.evidenceItem.create({
      data: {
        title: e.title,
        evidenceType: e.type,
        contentHash: hash,
        status: e.status,
      },
    })
  }
  console.log('✅ Evidence items created:', evidenceItems.length)

  // Create collaboration tasks
  const tasks = [
    { title: '实现VC签名SDK', complexity: 'medium', category: 'code', reward: 200, status: 'open' },
    { title: '用户调研问卷设计', complexity: 'low', category: 'research', reward: 80, status: 'open' },
    { title: 'Logo与VI设计', complexity: 'medium', category: 'design', reward: 300, status: 'open' },
    { title: '智能合约审计', complexity: 'critical', category: 'code', reward: 500, status: 'in_progress' },
    { title: '竞品分析报告', complexity: 'medium', category: 'research', reward: 150, status: 'in_progress' },
    { title: '前端原型开发', complexity: 'high', category: 'code', reward: 350, status: 'review' },
  ]

  for (const t of tasks) {
    await db.collaborationTask.create({
      data: {
        title: t.title,
        complexity: t.complexity,
        category: t.category,
        reward: t.reward,
        rewardToken: 'USDT',
        status: t.status,
        creatorId: founder.id,
        assigneeType: 'auto',
      },
    })
  }
  console.log('✅ Collaboration tasks created:', tasks.length)

  // Create sandbox projects
  const projects = [
    { name: 'SpaceUI-v2', type: '3d_prototype', status: 'interactive', xdp: true, version: 3 },
    { name: 'Dashboard-AR', type: 'spatial_ui', status: 'building', xdp: true, version: 1 },
    { name: 'ProductWalkthrough', type: '3d_prototype', status: 'published', xdp: false, version: 5 },
    { name: 'InvestorPitch3D', type: '3d_prototype', status: 'interactive', xdp: true, version: 2 },
    { name: 'DataViz-Spatial', type: 'ar_scene', status: 'draft', xdp: false, version: 1 },
  ]

  for (const p of projects) {
    const project = await db.sandboxProject.create({
      data: {
        name: p.name,
        projectType: p.type,
        status: p.status,
        xdpEnabled: p.xdp,
        version: p.version,
      },
    })

    // Add default interactions for interactive projects
    if (p.status === 'interactive' || p.status === 'published') {
      await db.sandboxInteraction.create({
        data: {
          projectId: project.id,
          name: '点击交互',
          triggerType: 'click',
          actionType: 'navigate',
          config: JSON.stringify({ target: 'detail-view', animation: 'fade-in' }),
        },
      })
    }
  }
  console.log('✅ Sandbox projects created:', projects.length)

  // Create roadmap phases
  const phase1 = await db.roadmapPhase.create({
    data: {
      phase: 1,
      name: '基建与协议验证',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-30'),
      status: 'active',
    },
  })

  const phase2 = await db.roadmapPhase.create({
    data: {
      phase: 2,
      name: '认知分身MVP',
      startDate: new Date('2025-01-31'),
      endDate: new Date('2025-03-01'),
      status: 'pending',
    },
  })

  const phase3 = await db.roadmapPhase.create({
    data: {
      phase: 3,
      name: '流体协作闭环',
      startDate: new Date('2025-03-02'),
      endDate: new Date('2025-03-31'),
      status: 'pending',
    },
  })

  // Phase 1 milestones
  const p1Milestones = [
    { title: '搭建 Qdrant 向量库', status: 'completed', order: 1 },
    { title: '接入 W3C VC 签发模块', status: 'completed', order: 2 },
    { title: '定义证据数据模型', status: 'completed', order: 3 },
    { title: '实现访谈记录→假设提取管道', status: 'in_progress', order: 4 },
    { title: '凭证生成性能优化', status: 'pending', order: 5 },
    { title: '链上查询延迟测试', status: 'pending', order: 6 },
    { title: 'Benchmark 验收', status: 'pending', order: 7 },
  ]

  for (const m of p1Milestones) {
    await db.milestone.create({
      data: {
        phaseId: phase1.id,
        title: m.title,
        status: m.status,
        order: m.order,
        targetDate: new Date('2025-01-30'),
      },
    })
  }

  // Phase 2 milestones
  const p2Milestones = [
    { title: '导入创始人过去3年决策日志', order: 1 },
    { title: '导入Code Review记录和项目文档', order: 2 },
    { title: '训练首个LoRA适配器', order: 3 },
    { title: '实现红蓝对抗交互界面', order: 4 },
    { title: '人工复核准确率测试', order: 5 },
    { title: '基座模型评估与切换', order: 6 },
  ]

  for (const m of p2Milestones) {
    await db.milestone.create({
      data: {
        phaseId: phase2.id,
        title: m.title,
        status: 'pending',
        order: m.order,
        targetDate: new Date('2025-03-01'),
      },
    })
  }

  // Phase 3 milestones
  const p3Milestones = [
    { title: '接入外部开发者节点', order: 1 },
    { title: '发布首个基于微支付的开源任务', order: 2 },
    { title: '实现自动化CI/CD管道', order: 3 },
    { title: '安全扫描集成', order: 4 },
    { title: '微支付结算网关上线', order: 5 },
    { title: '10次协作全链路验收测试', order: 6 },
  ]

  for (const m of p3Milestones) {
    await db.milestone.create({
      data: {
        phaseId: phase3.id,
        title: m.title,
        status: 'pending',
        order: m.order,
        targetDate: new Date('2025-03-31'),
      },
    })
  }
  console.log('✅ Roadmap phases and milestones created')

  console.log('🎉 Seeding complete!')
}

seed()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
