import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { executeSandboxCode } from '@/lib/sandbox'
import type { SandboxLanguage } from '@/lib/sandbox'

const MAX_TIMEOUT_MS = 120_000 // 2 minutes max
const DEFAULT_TIMEOUT_MS = 30_000

interface ExecuteRequest {
  code: string
  language: 'python' | 'javascript' | 'bash'
  timeout?: number
}

export async function POST(req: Request) {
  try {
    const body: ExecuteRequest = await req.json()

    // Validate
    if (!body.code || typeof body.code !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Code is required' },
        { status: 400 }
      )
    }

    if (!body.language || !['python', 'javascript', 'bash'].includes(body.language)) {
      return NextResponse.json(
        { success: false, error: 'Language must be python, javascript, or bash' },
        { status: 400 }
      )
    }

    if (body.code.length > 50_000) {
      return NextResponse.json(
        { success: false, error: 'Code must be less than 50,000 characters' },
        { status: 400 }
      )
    }

    const timeout = Math.min(
      body.timeout ?? DEFAULT_TIMEOUT_MS,
      MAX_TIMEOUT_MS
    )

    // Execute in sandbox
    const result = await executeSandboxCode(
      body.code,
      body.language as SandboxLanguage,
      timeout
    )

    // Log execution to database (non-blocking)
    db.sandboxExecution
      .create({
        data: {
          code: body.code.slice(0, 10000),
          language: body.language,
          success: result.success,
          stdout: result.stdout.slice(0, 5000),
          stderr: result.stderr.slice(0, 5000),
          executionTimeMs: result.executionTime,
          sandboxProvider: process.env.E2B_API_KEY ? 'e2b' : 'local',
        },
      })
      .catch((err) => {
        console.error('[Sandbox] Failed to log execution:', err)
      })

    return NextResponse.json({
      success: true,
      execution: {
        success: result.success,
        stdout: result.stdout,
        stderr: result.stderr,
        executionTime: result.executionTime,
        artifacts: result.artifacts ?? [],
      },
    })
  } catch (err) {
    console.error('[Sandbox Execute] Error:', err)
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Internal execution error',
      },
      { status: 500 }
    )
  }
}
