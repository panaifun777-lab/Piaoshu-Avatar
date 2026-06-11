// Memory Loader — L0/L1/L2/L3 progressive memory loading (MemPalace-inspired)
// Startup cost: L0+L1 = ~170-900 tokens vs naive millions

import { db } from '@/lib/db'

export interface MemoryLayer {
  layer: 'L0' | 'L1' | 'L2' | 'L3'
  tokens: number
  content: string
  sourceCount: number
}

export interface WakeUpResult {
  identity: MemoryLayer
  essential: MemoryLayer
  combined: string
  totalTokens: number
  wingsLoaded: number
  drawersScanned: number
}

// Token budget limits per layer
const L0_TOKEN_BUDGET = 100
const L1_TOKEN_BUDGET = 800
const L2_TOKEN_BUDGET = 500
const L3_MAX_RESULTS = 10

function estimateTokens(text: string): number {
  const chineseCount = (text.match(/[\u4e00-\u9fff]/g) || []).length
  const remaining = text.length - chineseCount
  return Math.ceil(remaining / 4 + chineseCount / 1.5)
}

function truncateToBudget(text: string, budget: number): string {
  const tokens = estimateTokens(text)
  if (tokens <= budget) return text

  // Rough truncation: estimate chars from token budget
  const chineseRatio = (text.match(/[\u4e00-\u9fff]/g) || []).length / text.length
  const avgCharsPerToken = chineseRatio * 1.5 + (1 - chineseRatio) * 4
  const maxChars = Math.floor(budget * avgCharsPerToken)
  return text.substring(0, maxChars) + '…'
}

/**
 * L0: Identity layer — always loaded (~50-100 tokens)
 * Who is this AI? Core persona + name
 */
export async function loadL0(cloneId: string): Promise<MemoryLayer> {
  const clone = await db.avatarClone.findUnique({
    where: { id: cloneId },
  })

  if (!clone) {
    return { layer: 'L0', tokens: 0, content: '', sourceCount: 0 }
  }

  // Build identity from clone persona (first 200 chars for L0)
  const identityParts: string[] = [
    `我是${clone.name}`,
    clone.persona ? clone.persona.substring(0, 200) : '',
    `等级:${clone.level} 经验:${clone.experience} 周期:${clone.totalCycles}`,
  ].filter(Boolean)

  const content = `[IDENTITY]\n${identityParts.join('\n')}`
  const truncated = truncateToBudget(content, L0_TOKEN_BUDGET)

  return {
    layer: 'L0',
    tokens: estimateTokens(truncated),
    content: truncated,
    sourceCount: 1,
  }
}

/**
 * L1: Essential facts layer — always loaded (~500-800 tokens)
 * High-priority wings (≥7) + high-importance drawers (≥4) + valid facts only
 * Uses AAAK summaries when available
 */
export async function loadL1(cloneId: string): Promise<MemoryLayer> {
  // Get high-priority wings
  const wings = await db.memoryWing.findMany({
    where: {
      cloneId,
      priority: { gte: 7 },
    },
    include: {
      rooms: {
        include: {
          drawers: {
            where: {
              importance: { gte: 3.5 },
              validTo: null, // Only currently valid facts
            },
            orderBy: { importance: 'desc' },
            take: 5, // Top 5 per room
            include: { tags: true },
          },
        },
      },
    },
    orderBy: { priority: 'desc' },
  })

  const summaries: string[] = []
  let drawersScanned = 0

  for (const wing of wings) {
    const wingHeader = `[${wing.name}]`
    const wingParts: string[] = [wingHeader]

    for (const room of wing.rooms) {
      for (const drawer of room.drawers) {
        drawersScanned++
        // Prefer AAAK summary (30x smaller), fall back to content snippet
        const text = drawer.aaaakSummary || drawer.content.substring(0, 200)
        wingParts.push(`  ${room.name}/${drawer.sourceType}: ${text}`)
      }
    }

    if (wingParts.length > 1) {
      summaries.push(wingParts.join('\n'))
    }
  }

  const content = `[ESSENTIAL]\n${summaries.join('\n\n')}`
  const truncated = truncateToBudget(content, L1_TOKEN_BUDGET)

  return {
    layer: 'L1',
    tokens: estimateTokens(truncated),
    content: truncated,
    sourceCount: drawersScanned,
  }
}

/**
 * L2: Room-specific recall — on-demand (~200-500 tokens)
 * Load all valid drawers for a specific room
 */
export async function loadRoom(roomId: string): Promise<MemoryLayer> {
  const room = await db.memoryRoom.findUnique({
    where: { id: roomId },
    include: {
      wing: true,
      drawers: {
        where: { validTo: null },
        orderBy: { importance: 'desc' },
        take: 15,
        include: { tags: true },
      },
    },
  })

  if (!room) {
    return { layer: 'L2', tokens: 0, content: '', sourceCount: 0 }
  }

  const parts: string[] = [
    `[ROOM: ${room.wing.name}/${room.name} (${room.hallType})]`,
  ]

  for (const drawer of room.drawers) {
    const text = drawer.aaaakSummary || drawer.content.substring(0, 300)
    parts.push(`- [${drawer.sourceType}] ${text}`)
  }

  const content = parts.join('\n')
  const truncated = truncateToBudget(content, L2_TOKEN_BUDGET)

  return {
    layer: 'L2',
    tokens: estimateTokens(truncated),
    content: truncated,
    sourceCount: room.drawers.length,
  }
}

/**
 * L3: Deep search — on-demand, unlimited tokens
 * Search across all drawers by query keywords
 */
export async function deepSearch(
  cloneId: string,
  query: string,
  wingId?: string
): Promise<MemoryLayer> {
  const queryWords = query.toLowerCase().split(/[\s,，]+/).filter(Boolean)

  // Get all valid drawers for this clone, optionally scoped to wing
  const whereClause: Record<string, unknown> = {
    validTo: null,
    room: {
      wing: {
        cloneId,
        ...(wingId ? { id: wingId } : {}),
      },
    },
  }

  const drawers = await db.memoryDrawer.findMany({
    where: whereClause,
    orderBy: { importance: 'desc' },
    take: 100,
    include: {
      room: { include: { wing: true } },
      tags: true,
    },
  })

  // Score drawers by keyword relevance
  const scored = drawers
    .map(drawer => {
      const text = `${drawer.content} ${drawer.aaaakSummary || ''} ${drawer.tags.map(t => t.tag).join(' ')}`.toLowerCase()
      let score = 0
      for (const word of queryWords) {
        if (text.includes(word)) score += 1
      }
      score += drawer.importance * 0.1
      return { drawer, score }
    })
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, L3_MAX_RESULTS)

  const parts: string[] = [`[DEEP SEARCH: "${query}"]`]

  for (const { drawer } of scored) {
    const wingName = (drawer.room as { wing: { name: string } }).wing.name
    const roomName = (drawer.room as { name: string }).name
    const text = drawer.aaaakSummary || drawer.content.substring(0, 500)
    parts.push(`[${wingName}/${roomName}] [${drawer.sourceType}] ${text}`)
  }

  return {
    layer: 'L3',
    tokens: estimateTokens(parts.join('\n')),
    content: parts.join('\n'),
    sourceCount: scored.length,
  }
}

/**
 * Wake-up: L0 + L1 combined — used for agent cycle startup
 * Returns ~170-900 tokens for full identity + essential facts
 */
export async function wakeUp(cloneId: string): Promise<WakeUpResult> {
  const [l0, l1] = await Promise.all([
    loadL0(cloneId),
    loadL1(cloneId),
  ])

  const combined = `${l0.content}\n\n${l1.content}`
  const totalTokens = l0.tokens + l1.tokens

  return {
    identity: l0,
    essential: l1,
    combined,
    totalTokens,
    wingsLoaded: (l1.content.match(/\[/g) || []).length,
    drawersScanned: l1.sourceCount,
  }
}
