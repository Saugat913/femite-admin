import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { emailService } from '@/lib/email-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, source = 'website' } = body

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Valid email is required' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingResult = await query(
      'SELECT id, active FROM newsletter_subscriptions WHERE email = $1',
      [email]
    )

    if (existingResult?.rows && existingResult.rows.length > 0) {
      const existing = existingResult.rows[0]
      if (existing.active) {
        return NextResponse.json(
          { success: false, error: 'Email is already subscribed to our newsletter' },
          { status: 400 }
        )
      } else {
        // Reactivate existing subscription
        await query(
          `UPDATE newsletter_subscriptions 
           SET active = true, subscribed_at = NOW(), unsubscribed_at = NULL, source = $1
           WHERE email = $2`,
          [source, email]
        )

        // Send welcome email
        try {
          await emailService.sendNewsletterWelcome(email)
        } catch (error) {
          console.error('Failed to send welcome email:', error)
          // Don't fail the subscription if email fails
        }

        return NextResponse.json({
          success: true,
          message: 'Successfully resubscribed to newsletter'
        })
      }
    }

    // Create new subscription
    await query(
      `INSERT INTO newsletter_subscriptions (id, email, active, subscribed_at, source)
       VALUES (gen_random_uuid(), $1, true, NOW(), $2)`,
      [email, source]
    )

    // Send welcome email
    try {
      await emailService.sendNewsletterWelcome(email)
    } catch (error) {
      console.error('Failed to send welcome email:', error)
      // Don't fail the subscription if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed to newsletter'
    })

  } catch (error) {
    console.error('POST /api/newsletter/subscribe error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to subscribe to newsletter' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email parameter is required' },
        { status: 400 }
      )
    }

    // Unsubscribe email
    const result = await query(
      `UPDATE newsletter_subscriptions 
       SET active = false, unsubscribed_at = NOW()
       WHERE email = $1 AND active = true`,
      [email]
    )

    if (!result || result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Email not found or already unsubscribed' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed from newsletter'
    })

  } catch (error) {
    console.error('DELETE /api/newsletter/subscribe error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to unsubscribe from newsletter' },
      { status: 500 }
    )
  }
}