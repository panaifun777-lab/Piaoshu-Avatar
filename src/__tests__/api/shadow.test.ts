import { describe, it, expect } from 'vitest'

describe('Shadow API', () => {
  describe('POST /api/shadow', () => {
    it('should return error when scenario is missing', async () => {
      const { POST } = await import('@/app/api/shadow/route')

      const req = new Request('http://localhost/api/shadow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const response = await POST(req as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('scenario')
    })

    it('should return a valid response structure with a scenario', async () => {
      const { POST } = await import('@/app/api/shadow/route')

      const req = new Request('http://localhost/api/shadow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: '如果有人质疑你的技术选型，你会怎么回应？' }),
      })

      const response = await POST(req as any)
      const data = await response.json()

      expect(data.success).toBe(true)
      // Should have a response field (may be a fallback if no AI key is available)
      expect(data).toHaveProperty('response')
      expect(typeof data.response).toBe('string')
      expect(data.response.length).toBeGreaterThan(0)
    })

    it('should accept personality override', async () => {
      const { POST } = await import('@/app/api/shadow/route')

      const req = new Request('http://localhost/api/shadow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: '测试场景',
          personality: '自定义人格：用简洁有力的中文回复',
        }),
      })

      const response = await POST(req as any)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data).toHaveProperty('response')
      expect(data).toHaveProperty('personality_used')
    })

    it('should handle empty scenario gracefully', async () => {
      const { POST } = await import('@/app/api/shadow/route')

      const req = new Request('http://localhost/api/shadow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: '' }),
      })

      const response = await POST(req as any)
      const data = await response.json()

      // Empty string is falsy, should reject
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })
  })
})
