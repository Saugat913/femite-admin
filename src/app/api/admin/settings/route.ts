import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Get all settings from the database
    const result = await query(`
      SELECT key, value, category, type
      FROM settings 
      ORDER BY category, key
    `)

    // Group settings by category
    const settingsByCategory = result.rows.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = {}
      }
      
      // Parse value based on type
      let parsedValue = setting.value
      try {
        if (setting.type === 'json') {
          parsedValue = JSON.parse(setting.value)
        } else if (setting.type === 'boolean') {
          parsedValue = setting.value === 'true'
        } else if (setting.type === 'number') {
          parsedValue = parseFloat(setting.value)
        }
      } catch (error) {
        console.warn(`Failed to parse setting ${setting.key}:`, error)
      }

      acc[setting.category][setting.key] = parsedValue
      return acc
    }, {})

    // Set default values if settings don't exist
    const defaultSettings = {
      store: {
        name: 'Hemp Fashion Store',
        email: 'admin@hempfashion.com',
        phone: '+1 (555) 123-4567',
        address: '123 Hemp Street, Green City, GC 12345',
        currency: 'USD',
        timezone: 'America/New_York',
        tax_rate: 8.5,
        logo_url: '/logo.png',
        ...settingsByCategory.store
      },
      shipping: {
        free_shipping_threshold: 50,
        flat_rate: 9.99,
        express_rate: 19.99,
        overnight_rate: 39.99,
        processing_days: 1,
        standard_days: '5-7',
        express_days: '2-3',
        overnight_days: '1',
        ...settingsByCategory.shipping
      },
      payment: {
        stripe_publishable_key: '',
        stripe_secret_key: '',
        paypal_client_id: '',
        paypal_secret: '',
        enable_stripe: true,
        enable_paypal: false,
        enable_cash_on_delivery: false,
        ...settingsByCategory.payment
      }
    }

    return NextResponse.json({
      success: true,
      data: defaultSettings
    })

  } catch (error) {
    console.error('GET /api/admin/settings error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { category, settings: newSettings } = body

    if (!category || !newSettings) {
      return NextResponse.json(
        { success: false, error: 'Category and settings are required' },
        { status: 400 }
      )
    }

    // Validate category
    const validCategories = ['store', 'shipping', 'payment']
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { success: false, error: 'Invalid category' },
        { status: 400 }
      )
    }

    // Start transaction
    await query('BEGIN')

    try {
      // Update each setting
      for (const [key, value] of Object.entries(newSettings)) {
        let stringValue = String(value)
        let type = 'string'

        // Determine type
        if (typeof value === 'boolean') {
          type = 'boolean'
          stringValue = value ? 'true' : 'false'
        } else if (typeof value === 'number') {
          type = 'number'
        } else if (typeof value === 'object' && value !== null) {
          type = 'json'
          stringValue = JSON.stringify(value)
        }

        // Upsert setting
        await query(`
          INSERT INTO settings (key, value, category, type, updated_at)
          VALUES ($1, $2, $3, $4, NOW())
          ON CONFLICT (key, category) 
          DO UPDATE SET 
            value = EXCLUDED.value,
            type = EXCLUDED.type,
            updated_at = NOW()
        `, [key, stringValue, category, type])
      }

      // Commit transaction
      await query('COMMIT')

      return NextResponse.json({
        success: true,
        message: `${category} settings updated successfully`
      })

    } catch (error) {
      // Rollback on error
      await query('ROLLBACK')
      throw error
    }

  } catch (error) {
    console.error('PUT /api/admin/settings error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}