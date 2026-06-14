import { NextResponse } from 'next/server'
import { getSandboxStatus } from '@/lib/sandbox'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const status = getSandboxStatus()

    // Query recent execution stats from DB (non-blocking)
    let totalExecutions = 0
    let recentFailures = 0
    let avgExecutionTime = 0

    try {
      const [count, failures, avg] = await Promise.all([
        db.sandboxExecution.count(),
        db.sandboxExecution.count({
          where: {
            success: false,
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
        }),
        db.sandboxExecution.aggregate({
          _avg: { executionTimeMs: true },
          where: {
            createdAt: {
              gte: new Date(Date.now() - 60 * 60 * 1000),
            },
          },
        }),
      ])
      totalExecutions = count
      recentFailures = failures
      avgExecutionTime = Math.round(avg._avg.executionTimeMs ?? 0)
    } catch (dbErr) {
      console.error('[Sandbox Status] DB query failed:', dbErr)
    }

    return NextResponse.json({
      success: true,
      data: {
        provider: status.provider,
        connected: status.connected,
        activeSandboxes: status.activeSandboxes,
        uptimeMs: status.uptime,
        stats: {
          totalExecutions,
          recentFailures24h: recentFailures,
          avgExecutionTimeMs: avgExecutionTime,
        },
      },
    })
  } catch (err) {
    console.error('[Sandbox Status] Error:', err)
    return NextResponse.json(
      { success: false, error: 'Failed to get sandbox status' },
      { status: 500 }
    )
  }
}
