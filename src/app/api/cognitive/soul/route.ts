import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const DEFAULT_SOUL_CONTENT = `# 飘叔 · SOUL.md

## 核心人格
你是一位经验丰富的创业导师和技术专家，人称"飘叔"。你兼具商业洞察力和技术深度，擅长从0到1构建产品。

## 说话风格
- 直接、犀利、不废话
- 喜欢用类比和比喻解释复杂概念
- 偶尔带点幽默和自嘲
- 用中文回复，偶尔夹杂英文术语

## 价值观
- 执行力 > 完美主义
- 数据驱动决策
- 先跑起来再优化
- 把AI当作共生体，而非工具

## 知识边界
- 精通：创业方法论、产品设计、技术架构、AI应用
- 了解：金融、法律、市场营销
- 不擅长：医疗、法律专业建议
`

export async function GET() {
  try {
    const soulConfig = await db.soulConfig.findFirst({
      where: { isActive: true },
      orderBy: { version: 'desc' },
    })

    if (!soulConfig) {
      return NextResponse.json({
        success: true,
        data: {
          content: DEFAULT_SOUL_CONTENT,
          name: 'piaoshu-soul-v1',
          version: 0,
          isDefault: true,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        content: soulConfig.content,
        name: soulConfig.name,
        version: soulConfig.version,
        isDefault: false,
        id: soulConfig.id,
        description: soulConfig.description,
        updatedAt: soulConfig.updatedAt,
      },
    })
  } catch (error) {
    console.error('Failed to fetch soul config:', error)
    return NextResponse.json({
      success: true,
      data: {
        content: DEFAULT_SOUL_CONTENT,
        name: 'piaoshu-soul-v1',
        version: 0,
        isDefault: true,
      },
    })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { content, name, description } = body

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Content is required' },
        { status: 400 }
      )
    }

    // Deactivate existing active configs
    await db.soulConfig.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    })

    // Get latest version
    const latestConfig = await db.soulConfig.findFirst({
      orderBy: { version: 'desc' },
    })
    const newVersion = (latestConfig?.version || 0) + 1

    // Create new config
    const soulConfig = await db.soulConfig.create({
      data: {
        name: name || `piaoshu-soul-v${newVersion}`,
        content,
        isActive: true,
        version: newVersion,
        description: description || `飘叔人格配置 v${newVersion}`,
      },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'update',
        module: 'cognitive',
        entityType: 'SoulConfig',
        entityId: soulConfig.id,
        details: JSON.stringify({ version: newVersion, name: soulConfig.name }),
        performedBy: 'system',
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        content: soulConfig.content,
        name: soulConfig.name,
        version: soulConfig.version,
        id: soulConfig.id,
        description: soulConfig.description,
        updatedAt: soulConfig.updatedAt,
      },
    })
  } catch (error) {
    console.error('Failed to save soul config:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save soul config' },
      { status: 500 }
    )
  }
}
