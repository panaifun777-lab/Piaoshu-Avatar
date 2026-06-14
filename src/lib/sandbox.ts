/**
 * E2B Sandbox + Local Fallback for Real Code Execution
 *
 * - Uses E2B cloud sandbox when E2B_API_KEY is set (v2 API)
 * - Falls back to local bun.spawn sandbox when no API key (dev/testing)
 * - Auto-destroys sandboxes after 5 minutes of idle
 */

import { Sandbox } from 'e2b'
import { spawn, type Subprocess } from 'bun'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SandboxLanguage = 'python' | 'javascript' | 'bash'

export interface SandboxExecuteResult {
  success: boolean
  stdout: string
  stderr: string
  executionTime: number
  artifacts?: SandboxArtifact[]
}

export interface SandboxArtifact {
  name: string
  type: 'file' | 'image' | 'data'
  path?: string
  content?: string
}

export interface SandboxStatus {
  provider: 'e2b' | 'local'
  connected: boolean
  activeSandboxes: number
  uptime: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const IDLE_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes
const DEFAULT_EXECUTION_TIMEOUT_MS = 30_000 // 30 seconds
const SANDBOX_TIMEOUT_MS = 10 * 60 * 1000 // 10 minutes sandbox lifetime

// ---------------------------------------------------------------------------
// E2B Sandbox Manager (v2 API)
// ---------------------------------------------------------------------------

class E2BSandboxManager {
  private sandbox: Sandbox | null = null
  private idleTimer: ReturnType<typeof setTimeout> | null = null
  private createdAt: number = 0
  private isDestroyed = false

  /** Get or create an E2B sandbox instance */
  async getSandbox(): Promise<Sandbox> {
    if (this.isDestroyed) {
      throw new Error('Sandbox has been destroyed')
    }

    if (this.sandbox) {
      this.resetIdleTimer()
      return this.sandbox
    }

    // E2B v2 reads E2B_API_KEY from env automatically
    this.sandbox = await Sandbox.create({
      timeoutMs: SANDBOX_TIMEOUT_MS,
    })
    this.createdAt = Date.now()
    this.resetIdleTimer()

    console.log('[E2B] Sandbox created:', this.sandbox.sandboxId)
    return this.sandbox
  }

  /** Reset idle timer — auto-destroy after IDLE_TIMEOUT_MS */
  private resetIdleTimer(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer)
    this.idleTimer = setTimeout(() => {
      this.destroy().catch((err) =>
        console.error('[E2B] Error auto-destroying sandbox:', err)
      )
    }, IDLE_TIMEOUT_MS)
  }

  /** Execute code in the E2B sandbox */
  async execute(
    code: string,
    language: SandboxLanguage,
    timeoutMs: number = DEFAULT_EXECUTION_TIMEOUT_MS
  ): Promise<SandboxExecuteResult> {
    const startTime = Date.now()
    const sb = await this.getSandbox()

    let cmd: string
    switch (language) {
      case 'python':
        cmd = `python3 -c ${JSON.stringify(code)}`
        break
      case 'javascript':
        // Escape quotes for shell
        cmd = `node -e ${JSON.stringify(code)}`
        break
      case 'bash':
        cmd = code
        break
      default:
        throw new Error(`Unsupported language: ${language}`)
    }

    const result = await sb.commands.run(cmd, {
      timeoutMs: Math.floor(timeoutMs / 1000) * 1000,
      onStdout: undefined,
      onStderr: undefined,
    })

    this.resetIdleTimer()

    return {
      success: result.exitCode === 0,
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      executionTime: Date.now() - startTime,
    }
  }

  /** Destroy the sandbox */
  async destroy(): Promise<void> {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer)
      this.idleTimer = null
    }
    if (this.sandbox) {
      try {
        await this.sandbox.kill()
      } catch (err) {
        console.error('[E2B] Error killing sandbox:', err)
      }
      this.sandbox = null
    }
    this.isDestroyed = true
    console.log('[E2B] Sandbox destroyed')
  }

  getUptime(): number {
    return this.createdAt ? Date.now() - this.createdAt : 0
  }

  isActive(): boolean {
    return this.sandbox !== null && !this.isDestroyed
  }
}

// ---------------------------------------------------------------------------
// Local Sandbox Manager (bun.spawn fallback)
// ---------------------------------------------------------------------------

class LocalSandboxManager {
  private activeCount = 0
  private createdAt: number = Date.now()
  private isDestroyed = false

  async execute(
    code: string,
    language: SandboxLanguage,
    timeoutMs: number = DEFAULT_EXECUTION_TIMEOUT_MS
  ): Promise<SandboxExecuteResult> {
    if (this.isDestroyed) {
      throw new Error('Local sandbox has been destroyed')
    }

    const startTime = Date.now()
    this.activeCount++

    try {
      let cmd: string[]
      switch (language) {
        case 'python':
          cmd = ['python3', '-c', code]
          break
        case 'javascript':
          cmd = ['node', '-e', code]
          break
        case 'bash':
          cmd = ['bash', '-c', code]
          break
        default:
          throw new Error(`Unsupported language: ${language}`)
      }

      const proc: Subprocess = spawn({
        cmd,
        stdout: 'pipe',
        stderr: 'pipe',
        stdin: 'null',
      })

      // Timeout logic
      const timeout = setTimeout(() => {
        if (!proc.killed) {
          proc.kill()
        }
      }, timeoutMs)

      const stdout = await new Response(proc.stdout).text()
      const stderr = await new Response(proc.stderr).text()
      const exitCode = await proc.exited

      clearTimeout(timeout)

      return {
        success: exitCode === 0,
        stdout: stdout.trimEnd(),
        stderr: stderr.trimEnd(),
        executionTime: Date.now() - startTime,
      }
    } catch (err) {
      return {
        success: false,
        stdout: '',
        stderr: err instanceof Error ? err.message : String(err),
        executionTime: Date.now() - startTime,
      }
    } finally {
      this.activeCount--
    }
  }

  async destroy(): Promise<void> {
    this.isDestroyed = true
  }

  getActiveCount(): number {
    return this.activeCount
  }

  getUptime(): number {
    return Date.now() - this.createdAt
  }

  isActive(): boolean {
    return !this.isDestroyed
  }
}

// ---------------------------------------------------------------------------
// Unified Sandbox Interface
// ---------------------------------------------------------------------------

let e2bManager: E2BSandboxManager | null = null
let localManager: LocalSandboxManager | null = null

function getProvider(): 'e2b' | 'local' {
  return process.env.E2B_API_KEY ? 'e2b' : 'local'
}

async function getE2BManager(): Promise<E2BSandboxManager> {
  if (!e2bManager || !e2bManager.isActive()) {
    e2bManager = new E2BSandboxManager()
  }
  return e2bManager
}

function getLocalManager(): LocalSandboxManager {
  if (!localManager || !localManager.isActive()) {
    localManager = new LocalSandboxManager()
  }
  return localManager
}

/**
 * Execute code in a sandbox (E2B cloud or local fallback).
 */
export async function executeSandboxCode(
  code: string,
  language: SandboxLanguage,
  timeoutMs?: number
): Promise<SandboxExecuteResult> {
  const provider = getProvider()

  if (provider === 'e2b') {
    const mgr = await getE2BManager()
    return mgr.execute(code, language, timeoutMs)
  }

  return getLocalManager().execute(code, language, timeoutMs)
}

/**
 * Get current sandbox status.
 */
export function getSandboxStatus(): SandboxStatus {
  const provider = getProvider()
  const activeCount =
    provider === 'e2b' ? (e2bManager?.isActive() ? 1 : 0) : localManager?.getActiveCount() ?? 0
  const uptime =
    provider === 'e2b'
      ? e2bManager?.getUptime() ?? 0
      : localManager?.getUptime() ?? 0
  const connected =
    provider === 'e2b' ? (e2bManager?.isActive() ?? false) : (localManager?.isActive() ?? false)

  return {
    provider,
    connected,
    activeSandboxes: activeCount,
    uptime,
  }
}

/**
 * Destroy all active sandboxes (useful for cleanup on server shutdown).
 */
export async function destroyAllSandboxes(): Promise<void> {
  if (e2bManager) {
    await e2bManager.destroy()
    e2bManager = null
  }
  if (localManager) {
    await localManager.destroy()
    localManager = null
  }
}
