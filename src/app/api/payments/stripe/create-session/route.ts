import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Generate a mock Stripe session ID
function generateSessionId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = 'cs_live_'
  for (let i = 0; i < 24; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { planId, userId, amount, currency = 'usd', paymentMethod = 'stripe' } = body

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount' },
        { status: 400 }
      )
    }

    // Generate mock Stripe Checkout Session
    const sessionId = generateSessionId()

    // Create payment session in database
    const session = await db.paymentSession.create({
      data: {
        sessionId,
        userId: userId || null,
        planId: planId || null,
        amount: Number(amount),
        currency,
        status: 'pending',
        paymentMethod: paymentMethod === 'stripe_link' ? 'stripe_link' : paymentMethod === 'crypto' ? 'crypto' : 'stripe',
        metadata: JSON.stringify({
          planId: planId || null,
          userId: userId || null,
          createdAt: new Date().toISOString(),
          paymentMethodTypes: paymentMethod === 'stripe_link'
            ? ['card', 'link']
            : paymentMethod === 'crypto'
              ? ['crypto']
              : ['card'],
        }),
      },
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'create',
        module: 'payments',
        entityType: 'PaymentSession',
        entityId: session.id,
        details: JSON.stringify({ sessionId, amount, currency, paymentMethod }),
        performedBy: userId || 'anonymous',
      },
    })

    // Mock checkout URL
    const checkoutUrl = `https://checkout.stripe.com/c/pay/${sessionId}#test`

    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        checkoutUrl,
        amount: Number(amount),
        currency,
        paymentMethod,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
      },
    })
  } catch (error) {
    console.error('Create session error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create payment session' },
      { status: 500 }
    )
  }
}
