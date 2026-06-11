import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const paymentMethods = [
      {
        id: 'stripe_link',
        name: 'Stripe Link',
        label: '一键支付',
        description: '保存付款信息，下次一键完成',
        icon: 'zap',
        badge: 'Link by Stripe',
        badgeColor: '#635BFF',
        supported: true,
        oneClick: true,
        currencies: ['usd', 'eur', 'gbp', 'jpy', 'cny'],
        processingTime: '< 1s',
      },
      {
        id: 'stripe_card',
        name: 'Stripe Card',
        label: '信用卡支付',
        description: 'Visa/Mastercard/AMEX',
        icon: 'credit-card',
        badge: null,
        badgeColor: null,
        supported: true,
        oneClick: false,
        currencies: ['usd', 'eur', 'gbp', 'jpy', 'cny'],
        processingTime: '1-3s',
      },
      {
        id: 'crypto',
        name: 'Crypto (AFC)',
        label: '链上支付',
        description: 'AFC Token 结算',
        icon: 'wallet',
        badge: 'Base Sepolia',
        badgeColor: '#10b981',
        supported: true,
        oneClick: false,
        currencies: ['afc'],
        processingTime: '~15s',
      },
    ]

    return NextResponse.json({
      success: true,
      data: {
        methods: paymentMethods,
        defaultMethod: 'stripe_link',
      },
    })
  } catch (error) {
    console.error('Payment methods error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to list payment methods' },
      { status: 500 }
    )
  }
}
