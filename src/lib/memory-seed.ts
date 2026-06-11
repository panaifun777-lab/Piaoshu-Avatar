import { db } from '@/lib/db'

interface WingDef {
  name: string
  wingType: string
  description: string
  priority: number
  rooms: { name: string; hallType: string }[]
}

const DEFAULT_WINGS: WingDef[] = [
  {
    name: '战略决策',
    wingType: 'topic',
    description: '战略级决策、市场洞察、合作评估',
    priority: 9,
    rooms: [
      { name: '决策记录', hallType: 'facts' },
      { name: '市场洞察', hallType: 'events' },
      { name: '合作评估', hallType: 'advice' },
    ],
  },
  {
    name: '工程架构',
    wingType: 'topic',
    description: '技术选型、架构设计、部署运维',
    priority: 8,
    rooms: [
      { name: '技术选型', hallType: 'facts' },
      { name: '架构设计', hallType: 'discoveries' },
      { name: '部署运维', hallType: 'facts' },
    ],
  },
  {
    name: '增长运营',
    wingType: 'topic',
    description: '用户增长、营销策略、数据分析',
    priority: 7,
    rooms: [
      { name: '用户增长', hallType: 'facts' },
      { name: '营销策略', hallType: 'preferences' },
      { name: '数据分析', hallType: 'events' },
    ],
  },
  {
    name: '人脉关系',
    wingType: 'person',
    description: '合作伙伴、投资人、顾问团队',
    priority: 6,
    rooms: [
      { name: '合作伙伴', hallType: 'facts' },
      { name: '投资人', hallType: 'preferences' },
      { name: '顾问团队', hallType: 'advice' },
    ],
  },
  {
    name: '个人身份',
    wingType: 'topic',
    description: '核心信念、表达风格、矛盾张力',
    priority: 10,
    rooms: [
      { name: '核心信念', hallType: 'facts' },
      { name: '表达风格', hallType: 'preferences' },
      { name: '矛盾张力', hallType: 'discoveries' },
    ],
  },
]

export async function seedDefaultWings(cloneId: string): Promise<void> {
  // Check if wings already exist for this clone
  const existingWings = await db.memoryWing.count({
    where: { cloneId },
  })
  if (existingWings > 0) return

  for (const wingDef of DEFAULT_WINGS) {
    const wing = await db.memoryWing.create({
      data: {
        cloneId,
        name: wingDef.name,
        wingType: wingDef.wingType,
        description: wingDef.description,
        priority: wingDef.priority,
      },
    })

    for (const roomDef of wingDef.rooms) {
      await db.memoryRoom.create({
        data: {
          wingId: wing.id,
          name: roomDef.name,
          hallType: roomDef.hallType,
        },
      })
    }
  }
}
