import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Check if running on Vercel with Turso (libsql:// URL)
const isTurso = process.env.DATABASE_URL?.startsWith('libsql://')

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isTurso ? ['error', 'warn'] : ['query'],
    // Turso uses @libsql/client under the hood via Prisma adapter
    // The connection is handled automatically when DATABASE_URL points to Turso
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Helper to check if database is available (for Vercel demo mode)
export async function isDatabaseAvailable(): Promise<boolean> {
  try {
    await db.$connect()
    return true
  } catch {
    return false
  }
}
