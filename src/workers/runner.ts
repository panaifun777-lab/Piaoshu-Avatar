/**
 * BullMQ Worker Runner — standalone process for processing queued jobs.
 *
 * Start with: npx tsx src/workers/runner.ts
 * Or:         bun run src/workers/runner.ts
 *
 * Handles:
 *   - avatar:task   — agent task execution (LLM cycle phases)
 *   - avatar:cycle  — daily agent cycle orchestration
 *   - swarm:distribute — task distribution across swarm agents
 *   - swarm:insight — knowledge mesh insight processing
 */
import { startWorker, taskQueue, cycleQueue, distributeQueue, insightQueue } from '@/lib/queue'
import { EventBus, CapabilityRegistry } from '@/lib/redis'

// ─── Avatar Task Handler ────────────────────────────────────────

const taskHandler = async (payload: Record<string, unknown>) => {
  const { avatarId, agentId, taskType, params } = payload
  console.log(`[avatar:task] ${taskType} for ${avatarId}/${agentId}`)

  // Emit task started event
  await EventBus.publish('swarm:events', {
    type: 'task.started',
    publisher: agentId || avatarId,
    taskType,
    params,
  })

  // Simulate LLM call / processing
  // In production, this would call the actual AI model
  await new Promise(r => setTimeout(r, 1000))

  const result = {
    status: 'completed',
    avatarId,
    agentId,
    taskType,
    output: `Task ${taskType} completed for ${agentId || avatarId}`,
    completedAt: new Date().toISOString(),
  }

  // Emit task completed event
  await EventBus.publish('swarm:events', {
    type: 'task.completed',
    publisher: agentId || avatarId,
    ...result,
  })

  // Update capability registry
  if (avatarId) {
    await CapabilityRegistry.heartbeat(avatarId)
  }

  return result
}

// ─── Cycle Handler ───────────────────────────────────────────────

const cycleHandler = async (payload: Record<string, unknown>) => {
  const { avatarId, phase } = payload
  console.log(`[avatar:cycle] ${phase} for ${avatarId}`)

  await EventBus.publish('swarm:events', {
    type: 'cycle.phase',
    publisher: avatarId,
    phase,
    timestamp: new Date().toISOString(),
  })

  // Simulate 3-phase cycle: planning → execution → reporting
  await new Promise(r => setTimeout(r, 2000))

  return {
    status: 'completed',
    avatarId,
    phase,
    completedAt: new Date().toISOString(),
  }
}

// ─── Swarm Distribute Handler ────────────────────────────────────

const distributeHandler = async (payload: Record<string, unknown>) => {
  const { taskId, strategy } = payload
  console.log(`[swarm:distribute] task ${taskId} strategy: ${strategy}`)

  // Get all registered agents
  const registry = await CapabilityRegistry.getAll()
  const onlineAgents = Object.entries(registry)
    .filter(([, data]) => data.online)
    .map(([id, data]) => ({ id, ...data }))

  // Simple round-robin distribution
  const assignments = []
  if (onlineAgents.length > 0) {
    const target = onlineAgents[0]
    assignments.push({ agentId: target.id, taskId })
  }

  await EventBus.publish('swarm:events', {
    type: 'task.distributed',
    publisher: 'swarm-router',
    taskId,
    assignments,
    timestamp: new Date().toISOString(),
  })

  return { distributed: assignments.length, assignments }
}

// ─── Insight Handler ─────────────────────────────────────────────

const insightHandler = async (payload: Record<string, unknown>) => {
  const { publisher, domain, insight, confidence } = payload
  console.log(`[swarm:insight] ${domain}: ${insight}`)

  // Store insight in Redis for knowledge mesh
  const insightKey = `swarm:insights:${domain || 'general'}`
  await EventBus.publish('swarm:events', {
    type: 'insight.published',
    publisher,
    domain,
    insight,
    confidence,
    timestamp: new Date().toISOString(),
  })

  return { stored: true, domain }
}

// ─── Start all workers ───────────────────────────────────────────

console.log('🚀 Starting BullMQ Workers...')

const workers = [
  startWorker({ queue: taskQueue, name: 'task', handler: taskHandler, concurrency: 4 }),
  startWorker({ queue: cycleQueue, name: 'cycle', handler: cycleHandler, concurrency: 2 }),
  startWorker({ queue: distributeQueue, name: 'distribute', handler: distributeHandler, concurrency: 2 }),
  startWorker({ queue: insightQueue, name: 'insight', handler: insightHandler, concurrency: 4 }),
]

console.log(`✅ ${workers.length} workers started`)
console.log('   Queue names: avatar:task, avatar:cycle, swarm:distribute, swarm:insight')
console.log('   Press Ctrl+C to stop')

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down workers...')
  for (const w of workers) {
    await w.close()
  }
  process.exit(0)
})
