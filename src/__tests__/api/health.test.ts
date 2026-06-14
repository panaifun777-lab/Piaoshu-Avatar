import { describe, it, expect } from 'vitest'

// We test the API route handlers directly by importing them
// and constructing mock requests/responses, rather than spinning up a server.

// Helper to create a mock NextRequest
function createMockRequest(url: string, options?: { method?: string; body?: unknown }) {
  const request = new Request(url, {
    method: options?.method || 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  })
  return request
}

describe('Health API endpoints', () => {
  describe('GET /api/queue/stats', () => {
    it('should return a valid JSON response structure', async () => {
      // Dynamic import to handle module resolution
      const { GET } = await import('@/app/api/queue/stats/route')
      const response = await GET()
      const data = await response.json()

      // Should have success field
      expect(data).toHaveProperty('success')
      // Should indicate redis status
      expect(data).toHaveProperty('redis')
      // Should have stats (may be null if redis unavailable)
      expect(data).toHaveProperty('stats')
    })

    it('should return 200 status when redis is disconnected', async () => {
      const { GET } = await import('@/app/api/queue/stats/route')
      const response = await GET()
      expect(response.status).toBe(200)
      const data = await response.json()
      // When redis is disconnected, these are the expected values
      if (data.redis === 'disconnected') {
        expect(data.queues).toBe('unhealthy')
        expect(data.stats).toBeNull()
      }
    })
  })

  describe('GET /api/leaderboard', () => {
    it('should return leaderboard array with 200 status', async () => {
      const { GET } = await import('@/app/api/leaderboard/route')
      const req = new Request('http://localhost:3000/api/leaderboard')
      const response = await GET(req as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(Array.isArray(data.leaderboard)).toBe(true)

      // Each entry should have rank, username, score
      if (data.leaderboard.length > 0) {
        const entry = data.leaderboard[0]
        expect(entry).toHaveProperty('rank')
        expect(entry).toHaveProperty('username')
        expect(entry).toHaveProperty('score')
      }
    })

    it('should support user query parameter', async () => {
      const { GET } = await import('@/app/api/leaderboard/route')
      const req = new Request('http://localhost:3000/api/leaderboard?user=piaoshu')
      const response = await GET(req as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data).toHaveProperty('user')
      expect(data.user).toHaveProperty('rank')
      expect(data.user).toHaveProperty('score')
    })
  })

  describe('GET /api/swarm/status', () => {
    it('should return valid JSON with ok field', async () => {
      const { GET } = await import('@/app/api/swarm/status/route')
      const response = await GET()
      const data = await response.json()

      // Always has 'ok' property
      expect(data).toHaveProperty('ok')

      // If swarm is up, should have data
      if (data.ok !== false) {
        expect(data).toHaveProperty('data')
        expect(data.data).toHaveProperty('agentCount')
        expect(data.data).toHaveProperty('taskStats')
      } else {
        // If unavailable (503), still has expected shape
        expect(data).toHaveProperty('error')
        expect(data).toHaveProperty('data')
        expect(data.data).toHaveProperty('initialized', false)
      }
    })
  })
})
