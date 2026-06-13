import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ReflectionOutputSchema } from '@/lib/reflection-schemas'
import type { ReflectionOutput, MentalModelUpdate, KnowledgeNode, ExpressionDNA } from '@/lib/reflection-schemas'

// Safe DB operation wrapper
async function safeDbOp<T>(op: () => Promise<T>): Promise<T | null> {
  try {
    return await op()
  } catch {
    return null
  }
}

/**
 * Format ExpressionDNA updates into a markdown section to append to SOUL.md
 */
function formatExpressionDNAUpdates(dna: ExpressionDNA, timestamp: string): string {
  const lines: string[] = []

  if (dna.new_slangs.length > 0 || dna.forbidden_phrases.length > 0 || dna.tone_adjustments) {
    lines.push(`\n## 表达DNA更新 (${timestamp})\n`)

    if (dna.new_slangs.length > 0) {
      lines.push('### 新口语/俚语')
      for (const slang of dna.new_slangs) {
        lines.push(`- ${slang}`)
      }
      lines.push('')
    }

    if (dna.forbidden_phrases.length > 0) {
      lines.push('### 禁用表达')
      for (const phrase of dna.forbidden_phrases) {
        lines.push(`- ${phrase}`)
      }
      lines.push('')
    }

    if (dna.tone_adjustments) {
      lines.push(`### 语气调整\n${dna.tone_adjustments}\n`)
    }
  }

  return lines.join('\n')
}

/**
 * Format MentalModelUpdates into a markdown section
 */
function formatMentalModelUpdates(models: MentalModelUpdate[], timestamp: string): string {
  if (models.length === 0) return ''

  const lines: string[] = []
  lines.push(`\n## 思维模型更新 (${timestamp})\n`)

  for (let i = 0; i < models.length; i++) {
    const m = models[i]
    lines.push(`### 模型${i + 1}: ${m.heuristics} [${m.domain}]`)
    lines.push(`**置信度**: ${(m.confidence * 100).toFixed(0)}%\n`)
    if (m.decision_rules.length > 0) {
      lines.push('**决策规则**:')
      for (const rule of m.decision_rules) {
        lines.push(`${m.decision_rules.indexOf(rule) + 1}. ${rule}`)
      }
      lines.push('')
    }
  }

  return lines.join('\n')
}

/**
 * Format KnowledgeNodes into a markdown section
 */
function formatKnowledgeNodes(nodes: KnowledgeNode[], timestamp: string): string {
  if (nodes.length === 0) return ''

  const lines: string[] = []
  lines.push(`\n## 知识图谱更新 (${timestamp})\n`)

  for (const node of nodes) {
    lines.push(`- **${node.entity}** → ${node.relation}`)
    if (node.notes) {
      lines.push(`  > ${node.notes}`)
    }
  }

  lines.push('')
  return lines.join('\n')
}

/**
 * Format a reflection summary footer
 */
function formatReflectionFooter(output: ReflectionOutput, timestamp: string): string {
  const lines: string[] = []
  lines.push('\n---\n')
  lines.push(`<!-- REFLECTION_META: shadow_score=${output.shadow_score} mood="${output.mood_summary}" timestamp="${timestamp}" -->`)
  lines.push('')
  return lines.join('\n')
}

// POST /api/reflection/update-soul
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { updates } = body as {
      updates?: ReflectionOutput
    }

    if (!updates) {
      return NextResponse.json(
        { error: 'updates is required and must be a valid ReflectionOutput' },
        { status: 400 }
      )
    }

    // Validate the updates
    const validationResult = ReflectionOutputSchema.safeParse(updates)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid ReflectionOutput schema',
          validation_errors: validationResult.error.issues,
        },
        { status: 422 }
      )
    }

    const reflection = validationResult.data
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19)

    // Read current active SOUL.md from DB
    const currentSoul = await db.soulConfig.findFirst({
      where: { isActive: true },
      orderBy: { version: 'desc' },
    })

    if (!currentSoul) {
      return NextResponse.json(
        { error: 'No active SOUL.md configuration found' },
        { status: 404 }
      )
    }

    const currentContent = currentSoul.content || ''
    const updatedFields: string[] = []

    // Build append sections
    let appendContent = ''

    // 1. Expression DNA updates
    const dnaSection = formatExpressionDNAUpdates(reflection.expression_dna_updates, timestamp)
    if (dnaSection) {
      appendContent += dnaSection
      updatedFields.push('expression_dna_updates')
    }

    // 2. Mental model updates
    const mentalSection = formatMentalModelUpdates(reflection.mental_model_updates, timestamp)
    if (mentalSection) {
      appendContent += mentalSection
      updatedFields.push('mental_model_updates')
    }

    // 3. Knowledge nodes
    const knowledgeSection = formatKnowledgeNodes(reflection.knowledge_nodes, timestamp)
    if (knowledgeSection) {
      appendContent += knowledgeSection
      updatedFields.push('knowledge_nodes')
    }

    // 4. Reflection meta footer
    appendContent += formatReflectionFooter(reflection, timestamp)
    if (reflection.mood_summary) {
      updatedFields.push('mood_summary')
    }
    updatedFields.push('shadow_score')

    // If nothing to update, return early
    if (!dnaSection && !mentalSection && !knowledgeSection) {
      return NextResponse.json({
        success: true,
        updated_fields: ['shadow_score'],
        message: 'No substantive updates to apply — only shadow score was recorded',
      })
    }

    // Append to existing content
    const newContent = currentContent + '\n' + appendContent

    // Deactivate current config
    await db.soulConfig.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    })

    // Create new version
    const newVersion = (currentSoul.version || 0) + 1
    const soulConfig = await db.soulConfig.create({
      data: {
        name: `piaoshu-soul-v${newVersion}`,
        content: newContent,
        isActive: true,
        version: newVersion,
        description: `Reflection update at ${timestamp} — updated: ${updatedFields.join(', ')}`,
      },
    })

    // Audit log
    await safeDbOp(() =>
      db.auditLog.create({
        data: {
          action: 'update',
          module: 'cognitive',
          entityType: 'SoulConfig',
          entityId: soulConfig.id,
          details: JSON.stringify({
            version: newVersion,
            updated_fields: updatedFields,
            shadow_score: reflection.shadow_score,
            knowledge_nodes: reflection.knowledge_nodes.length,
            mental_models: reflection.mental_model_updates.length,
            previous_version: currentSoul.version,
          }),
          performedBy: 'reflection-engine',
        },
      })
    )

    return NextResponse.json({
      success: true,
      updated_fields: updatedFields,
      new_version: newVersion,
      previous_version: currentSoul.version,
      message: `SOUL.md updated to v${newVersion}`,
    })
  } catch (error) {
    console.error('Reflection update-soul API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
