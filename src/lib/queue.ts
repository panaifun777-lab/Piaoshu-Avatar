/**
 * BullMQ Queue — task scheduling, retries, and job lifecycle management.
 *
 * Queues:
 *   - avatar:task — long-running avatar agent tasks
 *   - avatar:cycle — daily agent cycle execution
 *   - swarm:distribute — swarm task distribution
 *   - swarm:insight — knowledge mesh insight processing
 */
import { Queue, Worker, QueueScheduler } from 'bullmq'
import { redis, isRedisAvailable } from './redis'
import type { ConnectionOptions } from 'bullmq'

// ─── Redis connection for BullMQ ────────────────────────────────

const connection: ConnectionOptions = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT) || 6379,
}

// ─── Queue definitions ───────────────────────────────────────────

export const taskQueue = new Queue('avatar:task', { connection })
export const cycleQueue = new Queue('avatar:cycle', { connection })
export const distributeQueue = new Queue('swarm:distribute', { connection })
export const insightQueue = new Queue('swarm:insight', { connection })

// ─── Default job options ─────────────────────────────────────────

const defaultJobOpts = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 5000, // 5s → 25s → 125s
  },
  removeOnComplete: { age: 3600 * 24 }, // keep 24h
  removeOnFail: { age: 3600 * 24 * 7 }, // keep 7 days
}

// ─── Task Scheduler API ──────────────────────────────────────────

export interface ScheduleTaskInput {
  type: 'agent:cycle' | 'agent:task' | 'swarm:distribute' | 'swarm:insight'
  avatarId?: string
  agentId?: string
  payload: Record<string, unknown>
  priority?: number // 1=highest, 10=lowest
  delay?: number    // ms
}

/** Schedule a new task on the appropriate queue */
export async function scheduleTask(input: ScheduleTaskInput) {
  const queueMap: Record<string, Queue> = {
    'agent:cycle': cycleQueue,
    'agent:task': taskQueue,
    'swarm:distribute': distributeQueue,
    'swarm:insight': insightQueue,
  }

  const queue = queueMap[input.type]
  if (!queue) throw new Error(`Unknown task type: ${input.type}`)

  const job = await queue.add(input.type, input.payload, {
    ...defaultJobOpts,
    priority: input.priority || 5,
    delay: input.delay || 0,
  })

  return { jobId: job.id, queueName: queue.name }
}

/** Get queue statistics for the dashboard */
export async function getQueueStats() {
  const queues = [
    { name: 'avatar:task', queue: taskQueue },
    { name: 'avatar:cycle', queue: cycleQueue },
    { name: 'swarm:distribute', queue: distributeQueue },
    { name: 'swarm:insight', queue: insightQueue },
  ]

  const stats: Record<string, Record<string, number>> = {}
  for (const { name, queue } of queues) {
    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
        queue.getDelayedCount(),
      ])
      stats[name] = { waiting, active, completed, failed, delayed }
    } catch {
      stats[name] = { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 }
    }
  }
  return stats
}

/** Check if queue system is healthy */
export async function isQueueHealthy(): Promise<boolean> {
  try {
    const redisOk = await isRedisAvailable()
    if (!redisOk) return false
    // Try pinging a queue
    await taskQueue.getJobCounts()
    return true
  } catch {
    return false
  }
}

// ─── Worker starter (called from a separate worker process) ─────

interface WorkerConfig {
  queue: Queue
  name: string
  handler: (payload: Record<string, unknown>) => Promise<unknown>
  concurrency?: number
}

export function startWorker(config: WorkerConfig) {
  const worker = new Worker(config.queue.name, async (job) => {
    console.log(`[worker:${config.name}] processing job ${job.id}`)
    try {
      const result = await config.handler(job.data)
      await job.updateProgress(100)
      return result
    } catch (err) {
      console.error(`[worker:${config.name}] job ${job.id} failed:`, err)
      throw err
    }
  }, {
    connection,
    concurrency: config.concurrency || 4,
    autorun: true,
  })

  worker.on('completed', (job) => {
    console.log(`[worker:${config.name}] job ${job.id} completed`)
  })

  worker.on('failed', (job, err) => {
    console.error(`[worker:${config.name}] job ${job?.id} failed:`, err.message)
  })

  return worker
}
