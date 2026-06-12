import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email or Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        // Support login by email or username (name field)
        // First try email lookup
        let user = await db.user.findUnique({
          where: { email: credentials.email },
        })

        // If not found by email, try by name (username)
        if (!user) {
          user = await db.user.findFirst({
            where: { name: credentials.email },
          })
        }

        if (!user) return null

        const valid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!valid) return null

        return { id: user.id, email: user.email, name: user.name }
      },
    }),
  ],
  session: {
    strategy: 'jwt' as const,
  },
  pages: {
    signIn: '/?auth=login',
  },
  callbacks: {
    async jwt({ token, user }: { token: Record<string, unknown>; user?: { id: string; email: string; name: string } }) {
      if (user) {
        token.id = user.id
        token.email = user.email
      }
      return token
    },
    async session({ session, token }: { session: Record<string, unknown>; token: Record<string, unknown> }) {
      if (session.user && token) {
        (session.user as Record<string, unknown>).id = token.id
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'piaoshu-founder-os-secret-key-v1',
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
