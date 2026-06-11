import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { sessionId } = body

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Look up payment session
    const session = await db.paymentSession.findUnique({
      where: { sessionId },
    })

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      )
    }

    // Simulate payment verification
    // In production this would call Stripe API to check session status
    // For simulation: mark as paid with 85% probability
    const isPaid = Math.random() > 0.15

    if (isPaid && session.status === 'pending') {
      // Update session to paid
      await db.paymentSession.update({
        where: { sessionId },
        data: { status: 'paid' },
      })

      // If this has a userId and planId, create/upgrade subscription
      if (session.userId && session.planId) {
        const existingSub = await db.userSubscription.findFirst({
          where: { userId: session.userId },
        })

        if (existingSub) {
          await db.userSubscription.update({
            where: { id: existingSub.id },
            data: {
              planId: session.planId,
              status: 'active',
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              paymentMethod: session.paymentMethod === 'stripe_link' ? 'stripe_link' : session.paymentMethod === 'crypto' ? 'afc_base' : 'credit_card',
            },
          })
        } else {
          await db.userSubscription.create({
            data: {
              userId: session.userId,
              planId: session.planId,
              status: 'active',
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              paymentMethod: session.paymentMethod === 'stripe_link' ? 'stripe_link' : session.paymentMethod === 'crypto' ? 'afc_base' : 'credit_card',
            },
          })
        }

        // Create AFC transaction record
        await db.aFCTransaction.create({
          data: {
            userId: session.userId,
            type: 'subscription_payment',
            amount: -Math.round(session.amount * 10), // Convert USD to AFC (1 AFC = 0.1 USD)
            status: 'confirmed',
            description: `订阅付款 - Session ${sessionId.slice(0, 16)}...`,
            metadata: JSON.stringify({
              sessionId,
              paymentMethod: session.paymentMethod,
              amountUSD: session.amount,
            }),
          },
        })
      }

      // Create audit log
      await db.auditLog.create({
        data: {
          action: 'verify',
          module: 'payments',
          entityType: 'PaymentSession',
          entityId: session.id,
          details: JSON.stringify({ sessionId, status: 'paid', amount: session.amount }),
          performedBy: session.userId || 'system',
        },
      })

      return NextResponse.json({
        success: true,
        data: {
          sessionId,
          status: 'paid',
          amount: session.amount,
          currency: session.currency,
          paymentMethod: session.paymentMethod,
          paidAt: new Date().toISOString(),
        },
      })
    }

    if (!isPaid && session.status === 'pending') {
      // Random: 10% chance of failed, 5% still pending
      const failChance = Math.random()
      const newStatus = failChance < 0.67 ? 'failed' : 'pending'

      if (newStatus === 'failed') {
        await db.paymentSession.update({
          where: { sessionId },
          data: { status: 'failed' },
        })

        await db.auditLog.create({
          data: {
            action: 'verify',
            module: 'payments',
            entityType: 'PaymentSession',
            entityId: session.id,
            details: JSON.stringify({ sessionId, status: 'failed' }),
            performedBy: session.userId || 'system',
          },
        })
      }

      return NextResponse.json({
        success: true,
        data: {
          sessionId,
          status: newStatus,
          amount: session.amount,
          currency: session.currency,
          paymentMethod: session.paymentMethod,
        },
      })
    }

    // Session already has a final status
    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        status: session.status,
        amount: session.amount,
        currency: session.currency,
        paymentMethod: session.paymentMethod,
      },
    })
  } catch (error) {
    console.error('Verify session error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to verify payment session' },
      { status: 500 }
    )
  }
}
