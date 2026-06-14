import { describe, it, expect } from 'vitest'

describe('Reflection Extract API', () => {
  describe('POST /api/reflection/extract', () => {
    it('should return error when message is missing', async () => {
      const { POST } = await import('@/app/api/reflection/extract/route')

      const req = new Request('http://localhost/api/reflection/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const response = await POST(req as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('message')
    })

    it('should return a success response with valid message', async () => {
      const { POST } = await import('@/app/api/reflection/extract/route')

      const req = new Request('http://localhost/api/reflection/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: '今天重新思考了一下架构选型，觉得用Next.js做全栈是正确的决定',
          user: 'piaoshu',
        }),
      })

      const response = await POST(req as any)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data).toHaveProperty('insight')
      expect(typeof data.insight).toBe('string')
      expect(data.insight.length).toBeGreaterThan(0)
    })

    it('should accept optional chatId and user fields', async () => {
      const { POST } = await import('@/app/api/reflection/extract/route')

      const req = new Request('http://localhost/api/reflection/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: '测试消息',
          chatId: 'test-chat-123',
          user: 'test_user',
        }),
      })

      const response = await POST(req as any)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data).toHaveProperty('insight')
    })

    it('should handle empty message string gracefully', async () => {
      const { POST } = await import('@/app/api/reflection/extract/route')

      const req = new Request('http://localhost/api/reflection/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '   ' }),
      })

      const response = await POST(req as any)
      const data = await response.json()

      // Empty/whitespace message should be rejected
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should always return success even on internal errors', async () => {
      // The reflection extract route has a catch that always returns success: true
      const { POST } = await import('@/app/api/reflection/extract/route')

      // Sending invalid JSON should trigger an error that gets caught
      const req = new Request('http://localhost/api/reflection/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not valid json{{{',
      })

      const response = await POST(req as any)
      const data = await response.json()

      // The route always catches errors and returns success: true
      expect(data.success).toBe(true)
      expect(data).toHaveProperty('insight')
    })
  })
})
