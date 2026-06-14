import { describe, it, expect } from 'vitest'

describe('Leaderboard API', () => {
  describe('POST /api/leaderboard', () => {
    it('should accept a valid score submission', async () => {
      const { POST } = await import('@/app/api/leaderboard/route')

      const body = JSON.stringify({ username: 'test_user_42', score: 1500 })
      const req = new Request('http://localhost/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      })

      const response = await POST(req as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.username).toBe('test_user_42')
      expect(data.score).toBe(1500)
    })

    it('should reject missing username', async () => {
      const { POST } = await import('@/app/api/leaderboard/route')

      const req = new Request('http://localhost/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: 100 }),
      })

      const response = await POST(req as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('username')
    })

    it('should reject missing score', async () => {
      const { POST } = await import('@/app/api/leaderboard/route')

      const req = new Request('http://localhost/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'test' }),
      })

      const response = await POST(req as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('score')
    })

    it('should reject empty username string', async () => {
      const { POST } = await import('@/app/api/leaderboard/route')

      const req = new Request('http://localhost/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: '   ', score: 50 }),
      })

      const response = await POST(req as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })
  })

  describe('GET /api/leaderboard after POST', () => {
    it('should return ranked list after submitting scores', async () => {
      const { GET, POST } = await import('@/app/api/leaderboard/route')

      // Submit a few scores
      const scores = [
        { username: 'alpha_test', score: 100 },
        { username: 'beta_test', score: 200 },
        { username: 'gamma_test', score: 150 },
      ]

      for (const s of scores) {
        const req = new Request('http://localhost/api/leaderboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(s),
        })
        const res = await POST(req as any)
        expect((await res.json()).success).toBe(true)
      }

      // Now GET the leaderboard
      const getReq = new Request('http://localhost/api/leaderboard')
      const response = await GET(getReq as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(Array.isArray(data.leaderboard)).toBe(true)
      expect(data.leaderboard.length).toBeGreaterThan(0)

      // Entries should be sorted by rank
      for (let i = 1; i < data.leaderboard.length; i++) {
        expect(data.leaderboard[i].rank).toBeGreaterThan(data.leaderboard[i - 1].rank)
      }

      // Verify user query works
      const userReq = new Request('http://localhost/api/leaderboard?user=beta_test')
      const userRes = await GET(userReq as any)
      const userData = await userRes.json()

      expect(userData).toHaveProperty('user')
      expect(userData.user).toHaveProperty('score')
    })
  })
})
