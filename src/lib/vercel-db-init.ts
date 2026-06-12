// Vercel DB initialization helper
// Runs prisma db push at runtime to create tables in /tmp on Vercel

let initialized = false

export async function initVercelDb(): Promise<boolean> {
  if (process.env.VERCEL !== '1') return true
  if (initialized) return true

  try {
    // prisma db push creates tables if they don't exist
    const { execSync } = await import('child_process')
    execSync('npx prisma db push --skip-generate --accept-data-loss', {
      env: { ...process.env },
      stdio: 'pipe',
      timeout: 60000,
      cwd: process.cwd(),
    })
    initialized = true
    console.log('[initVercelDb] Database schema pushed successfully')
    return true
  } catch (e: unknown) {
    const err = e as Error & { stderr?: string }
    console.error('[initVercelDb] Failed to init DB:', err.message)
    if (err.stderr) console.error(err.stderr.toString())
    return false
  }
}
