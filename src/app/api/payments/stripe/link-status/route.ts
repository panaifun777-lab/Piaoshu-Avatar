import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // Simulate Stripe Link status check
    // In production this would call the Stripe API to check
    // if the user has Link-enabled payment methods saved
    const hasLink = !!userId && Math.random() > 0.4

    const mockLinkStatus = {
      linkEnabled: hasLink,
      email: userId ? 'user@example.com' : null,
      savedPaymentMethods: hasLink
        ? [
            {
              id: 'pm_mock_card_1',
              type: 'card',
              last4: '4242',
              brand: 'visa',
              isDefault: true,
            },
            {
              id: 'pm_mock_link_1',
              type: 'link',
              last4: '4242',
              email: 'user@example.com',
              isDefault: false,
            },
          ]
        : [],
      phone: hasLink ? '+1 ***-***-1234' : null,
      country: 'US',
    }

    return NextResponse.json({
      success: true,
      data: mockLinkStatus,
    })
  } catch (error) {
    console.error('Link status error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to check Link status' },
      { status: 500 }
    )
  }
}
