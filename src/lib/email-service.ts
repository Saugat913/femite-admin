import nodemailer from 'nodemailer'

// Create reusable transporter object using SMTP
const createTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('Email service not configured. Please set SMTP environment variables.')
    return null
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
  })
}

// Email service interface
export interface EmailOptions {
  to: string
  subject: string
  text?: string
  html?: string
}

export class EmailService {
  private transporter: nodemailer.Transporter | null

  constructor() {
    this.transporter = createTransporter()
  }

  private async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      console.error('Email transporter not configured')
      return false
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"${process.env.NEXT_PUBLIC_APP_NAME || 'Femite Hemp Fashion'}" <${process.env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html
      })

      console.log('Email sent successfully:', info.messageId)
      return true
    } catch (error) {
      console.error('Failed to send email:', error)
      return false
    }
  }

  // Send email verification
  async sendVerificationEmail(email: string, verificationToken: string): Promise<boolean> {
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`
    
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Verify Your Email</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              line-height: 1.6; 
              color: #2d3436; 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px;
            }
            .header { 
              background: linear-gradient(135deg, #4a7c59 0%, #689f73 100%); 
              color: white; 
              padding: 30px 20px; 
              border-radius: 12px 12px 0 0; 
              text-align: center; 
            }
            .content { 
              background: white; 
              padding: 30px 20px; 
              border: 1px solid #e9ecef; 
              border-top: none; 
            }
            .footer { 
              background: #f8f9fa; 
              padding: 20px; 
              border: 1px solid #e9ecef; 
              border-top: none; 
              border-radius: 0 0 12px 12px; 
              text-align: center; 
              font-size: 14px; 
              color: #6c757d; 
            }
            .btn { 
              display: inline-block; 
              padding: 14px 28px; 
              background: #4a7c59; 
              color: white; 
              text-decoration: none; 
              border-radius: 8px; 
              font-weight: 600; 
              margin: 20px 0; 
            }
            .btn:hover { background: #3d6b4a; }
            .highlight { color: #4a7c59; font-weight: 600; }
            .small { font-size: 14px; color: #6c757d; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">Welcome to Femite Hemp Fashion!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Sustainable. Comfortable. Revolutionary.</p>
          </div>
          
          <div class="content">
            <h2 style="color: #4a7c59; margin-top: 0;">Verify Your Email Address</h2>
            
            <p>Thank you for joining our sustainable fashion community! To complete your registration and start exploring our revolutionary hemp clothing collection, please verify your email address.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" class="btn">Verify Email Address</a>
            </div>
            
            <p class="small">
              <strong>Why verify?</strong><br>
              • Access your account and order history<br>
              • Receive exclusive offers and new arrivals<br>
              • Get personalized recommendations<br>
              • Stay updated on our sustainability initiatives
            </p>
            
            <hr style="margin: 25px 0; border: none; border-top: 1px solid #e9ecef;">
            
            <p class="small">
              <strong>Can't click the button?</strong><br>
              Copy and paste this link into your browser:<br>
              <span style="word-break: break-all; color: #4a7c59;">${verificationUrl}</span>
            </p>
            
            <p class="small">This verification link will expire in 24 hours for security reasons.</p>
          </div>
          
          <div class="footer">
            <p style="margin: 0;">
              <strong>Femite Hemp Fashion</strong><br>
              Revolutionizing fashion with scientifically superior hemp clothing<br>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color: #4a7c59; text-decoration: none;">Visit our website</a>
            </p>
          </div>
        </body>
      </html>
    `

    const textContent = `
Welcome to Femite Hemp Fashion!

Please verify your email address to complete your registration.

Click here to verify: ${verificationUrl}

Or copy and paste this link into your browser: ${verificationUrl}

This verification link will expire in 24 hours.

Thank you for joining our sustainable fashion community!

---
Femite Hemp Fashion
Revolutionizing fashion with scientifically superior hemp clothing
${process.env.NEXT_PUBLIC_APP_URL}
    `

    return this.sendEmail({
      to: email,
      subject: '🌿 Verify Your Femite Account - Welcome to Sustainable Fashion!',
      text: textContent,
      html: htmlTemplate
    })
  }

  // Send newsletter welcome email
  async sendNewsletterWelcome(email: string): Promise<boolean> {
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Welcome to Femite Newsletter</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              line-height: 1.6; 
              color: #2d3436; 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px;
            }
            .header { 
              background: linear-gradient(135deg, #4a7c59 0%, #689f73 100%); 
              color: white; 
              padding: 30px 20px; 
              border-radius: 12px 12px 0 0; 
              text-align: center; 
            }
            .content { 
              background: white; 
              padding: 30px 20px; 
              border: 1px solid #e9ecef; 
              border-top: none; 
            }
            .footer { 
              background: #f8f9fa; 
              padding: 20px; 
              border: 1px solid #e9ecef; 
              border-top: none; 
              border-radius: 0 0 12px 12px; 
              text-align: center; 
              font-size: 14px; 
              color: #6c757d; 
            }
            .benefits { 
              background: #f8fffe; 
              border-left: 4px solid #4a7c59; 
              padding: 20px; 
              margin: 20px 0; 
            }
            .highlight { color: #4a7c59; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">🌿 Welcome to Our Newsletter!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Your journey to sustainable fashion starts here</p>
          </div>
          
          <div class="content">
            <h2 style="color: #4a7c59; margin-top: 0;">Thank You for Subscribing!</h2>
            
            <p>Welcome to the <span class="highlight">Femite Hemp Fashion</span> community! You've just joined over 50,000+ conscious consumers who are revolutionizing their wardrobe with scientifically superior hemp clothing.</p>
            
            <div class="benefits">
              <h3 style="color: #4a7c59; margin-top: 0;">What to expect in your inbox:</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li><strong>Exclusive early access</strong> to new collections</li>
                <li><strong>Sustainability insights</strong> and hemp fashion education</li>
                <li><strong>Special subscriber discounts</strong> up to 25% off</li>
                <li><strong>Behind-the-scenes</strong> content from our eco-friendly production</li>
                <li><strong>Style guides</strong> and outfit inspiration</li>
              </ul>
            </div>
            
            <h3 style="color: #4a7c59;">Why Hemp? The Science Speaks:</h3>
            <ul>
              <li><strong>3x stronger</strong> than cotton fibers</li>
              <li><strong>Naturally antimicrobial</strong> - stays fresher longer</li>
              <li><strong>UV protective</strong> - natural sun defense</li>
              <li><strong>Biodegradable</strong> - kind to our planet</li>
              <li><strong>Gets softer</strong> with every wash</li>
            </ul>
            
            <p>Ready to explore our collection? <a href="${process.env.NEXT_PUBLIC_APP_URL}/shop" style="color: #4a7c59; text-decoration: none; font-weight: 600;">Start shopping now →</a></p>
          </div>
          
          <div class="footer">
            <p style="margin: 0;">
              <strong>Femite Hemp Fashion</strong><br>
              Revolutionizing fashion with scientifically superior hemp clothing<br>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color: #4a7c59; text-decoration: none;">Visit our website</a>
            </p>
            <p style="margin: 10px 0 0 0; font-size: 12px;">
              You can unsubscribe from these emails at any time by <a href="${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?email=${encodeURIComponent(email)}" style="color: #4a7c59;">clicking here</a>.
            </p>
          </div>
        </body>
      </html>
    `

    const textContent = `
Welcome to Femite Hemp Fashion Newsletter!

Thank you for subscribing to our newsletter. You've joined over 50,000+ conscious consumers revolutionizing their wardrobe with scientifically superior hemp clothing.

What to expect in your inbox:
• Exclusive early access to new collections
• Sustainability insights and hemp fashion education  
• Special subscriber discounts up to 25% off
• Behind-the-scenes content from our eco-friendly production
• Style guides and outfit inspiration

Why Hemp? The Science Speaks:
• 3x stronger than cotton fibers
• Naturally antimicrobial - stays fresher longer
• UV protective - natural sun defense
• Biodegradable - kind to our planet
• Gets softer with every wash

Ready to explore our collection? Visit: ${process.env.NEXT_PUBLIC_APP_URL}/shop

---
Femite Hemp Fashion
Revolutionizing fashion with scientifically superior hemp clothing
${process.env.NEXT_PUBLIC_APP_URL}

You can unsubscribe at any time: ${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?email=${encodeURIComponent(email)}
    `

    return this.sendEmail({
      to: email,
      subject: '🌿 Welcome to Femite - Your Sustainable Fashion Journey Begins!',
      text: textContent,
      html: htmlTemplate
    })
  }

  // Send order confirmation to customer
  async sendOrderConfirmation(email: string, orderData: any): Promise<boolean> {
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Order Confirmation</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              line-height: 1.6; 
              color: #2d3436; 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px;
            }
            .header { 
              background: linear-gradient(135deg, #4a7c59 0%, #689f73 100%); 
              color: white; 
              padding: 30px 20px; 
              border-radius: 12px 12px 0 0; 
              text-align: center; 
            }
            .content { 
              background: white; 
              padding: 30px 20px; 
              border: 1px solid #e9ecef; 
              border-top: none; 
            }
            .footer { 
              background: #f8f9fa; 
              padding: 20px; 
              border: 1px solid #e9ecef; 
              border-top: none; 
              border-radius: 0 0 12px 12px; 
              text-align: center; 
              font-size: 14px; 
              color: #6c757d; 
            }
            .order-details { 
              background: #f8fffe; 
              border: 1px solid #e9ecef; 
              padding: 20px; 
              border-radius: 8px; 
              margin: 20px 0; 
            }
            .items-list { border-collapse: collapse; width: 100%; margin: 20px 0; }
            .items-list th, .items-list td { 
              padding: 12px; 
              text-align: left; 
              border-bottom: 1px solid #e9ecef; 
            }
            .items-list th { background: #f8f9fa; font-weight: 600; }
            .total { 
              background: #4a7c59; 
              color: white; 
              font-weight: 600; 
            }
            .highlight { color: #4a7c59; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">✅ Order Confirmed!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Thank you for choosing sustainable fashion</p>
          </div>
          
          <div class="content">
            <h2 style="color: #4a7c59; margin-top: 0;">Thank you for your order, ${orderData.customerName || 'Valued Customer'}!</h2>
            
            <p>We're excited to prepare your sustainable hemp clothing order. You'll receive shipping updates as your order progresses.</p>
            
            <div class="order-details">
              <h3 style="margin-top: 0;">Order Details</h3>
              <p><strong>Order Number:</strong> <span class="highlight">#${orderData.orderNumber}</span></p>
              <p><strong>Order Date:</strong> ${new Date(orderData.orderDate).toLocaleDateString()}</p>
              <p><strong>Estimated Delivery:</strong> ${orderData.estimatedDelivery || '5-7 business days'}</p>
            </div>
            
            <h3>Items Ordered</h3>
            <table class="items-list">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                ${orderData.items?.map((item: any) => `
                  <tr>
                    <td>${item.name}${item.size ? ` (${item.size})` : ''}</td>
                    <td>${item.quantity}</td>
                    <td>$${item.price.toFixed(2)}</td>
                  </tr>
                `).join('') || ''}
                <tr class="total">
                  <td colspan="2"><strong>Total</strong></td>
                  <td><strong>$${orderData.total?.toFixed(2) || '0.00'}</strong></td>
                </tr>
              </tbody>
            </table>
            
            <h3>Shipping Address</h3>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 6px;">
              ${orderData.shippingAddress || 'Address will be confirmed separately'}
            </div>
            
            <p><strong>Questions about your order?</strong><br>
            Contact our customer support team at <a href="mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@femite.com'}" style="color: #4a7c59;">${process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@femite.com'}</a></p>
          </div>
          
          <div class="footer">
            <p style="margin: 0;">
              <strong>Femite Hemp Fashion</strong><br>
              Thank you for choosing sustainable fashion!<br>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderData.orderId}" style="color: #4a7c59; text-decoration: none;">Track your order</a>
            </p>
          </div>
        </body>
      </html>
    `

    const textContent = `
Order Confirmation - Femite Hemp Fashion

Thank you for your order, ${orderData.customerName || 'Valued Customer'}!

Order Details:
Order Number: #${orderData.orderNumber}
Order Date: ${new Date(orderData.orderDate).toLocaleDateString()}
Estimated Delivery: ${orderData.estimatedDelivery || '5-7 business days'}

Items Ordered:
${orderData.items?.map((item: any) => `• ${item.name}${item.size ? ` (${item.size})` : ''} - Qty: ${item.quantity} - $${item.price.toFixed(2)}`).join('\n') || ''}

Total: $${orderData.total?.toFixed(2) || '0.00'}

Shipping Address:
${orderData.shippingAddress || 'Address will be confirmed separately'}

Track your order: ${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderData.orderId}

Questions? Contact us at: ${process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@femite.com'}

---
Femite Hemp Fashion
Thank you for choosing sustainable fashion!
${process.env.NEXT_PUBLIC_APP_URL}
    `

    return this.sendEmail({
      to: email,
      subject: `🌿 Order Confirmed #${orderData.orderNumber} - Femite Hemp Fashion`,
      text: textContent,
      html: htmlTemplate
    })
  }

  // Send new product announcement to newsletter subscribers
  async sendNewProductAnnouncement(email: string, productData: any): Promise<boolean> {
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>New Product Alert - ${productData.name}</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              line-height: 1.6; 
              color: #2d3436; 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px;
            }
            .header { 
              background: linear-gradient(135deg, #4a7c59 0%, #689f73 100%); 
              color: white; 
              padding: 30px 20px; 
              border-radius: 12px 12px 0 0; 
              text-align: center; 
            }
            .content { 
              background: white; 
              padding: 30px 20px; 
              border: 1px solid #e9ecef; 
              border-top: none; 
            }
            .footer { 
              background: #f8f9fa; 
              padding: 20px; 
              border: 1px solid #e9ecef; 
              border-top: none; 
              border-radius: 0 0 12px 12px; 
              text-align: center; 
              font-size: 14px; 
              color: #6c757d; 
            }
            .product-showcase { 
              background: #f8fffe; 
              border: 1px solid #e9ecef; 
              padding: 25px; 
              border-radius: 12px; 
              margin: 25px 0; 
              text-align: center; 
            }
            .product-image { 
              max-width: 100%; 
              height: auto; 
              border-radius: 8px; 
              box-shadow: 0 4px 12px rgba(0,0,0,0.1); 
              margin-bottom: 20px; 
            }
            .price { 
              font-size: 28px; 
              font-weight: 700; 
              color: #4a7c59; 
              margin: 15px 0; 
            }
            .btn { 
              display: inline-block; 
              padding: 16px 32px; 
              background: #4a7c59; 
              color: white; 
              text-decoration: none; 
              border-radius: 8px; 
              font-weight: 600; 
              margin: 20px 0; 
              font-size: 16px; 
            }
            .btn:hover { background: #3d6b4a; }
            .benefits { 
              background: #f0f8ff; 
              border-left: 4px solid #4a7c59; 
              padding: 20px; 
              margin: 20px 0; 
            }
            .stock-alert { 
              background: #fff3cd; 
              border: 1px solid #ffeaa7; 
              padding: 15px; 
              border-radius: 6px; 
              margin: 20px 0; 
              text-align: center; 
            }
            .categories { 
              display: flex; 
              flex-wrap: wrap; 
              gap: 8px; 
              justify-content: center; 
              margin: 15px 0; 
            }
            .category-tag { 
              background: #e9ecef; 
              padding: 4px 12px; 
              border-radius: 16px; 
              font-size: 14px; 
              color: #495057; 
            }
            .highlight { color: #4a7c59; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0; font-size: 32px;">🌿 New Arrival Alert!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 18px;">Fresh sustainable fashion just landed</p>
          </div>
          
          <div class="content">
            <h2 style="color: #4a7c59; margin-top: 0; text-align: center;">Introducing: ${productData.name}</h2>
            
            <div class="product-showcase">
              ${productData.image_url ? `<img src="${productData.image_url}" alt="${productData.name}" class="product-image" />` : ''}
              
              <h3 style="color: #2d3436; margin: 20px 0 10px 0; font-size: 24px;">${productData.name}</h3>
              
              ${productData.categories && productData.categories.length > 0 ? `
                <div class="categories">
                  ${productData.categories.map((cat: any) => `<span class="category-tag">${cat.name}</span>`).join('')}
                </div>
              ` : ''}
              
              <div class="price">$${parseFloat(productData.price || 0).toFixed(2)}</div>
              
              ${productData.description ? `<p style="color: #495057; font-size: 16px; line-height: 1.6; margin: 20px 0;">${productData.description}</p>` : ''}
              
              ${productData.stock <= 10 ? `
                <div class="stock-alert">
                  <strong>⚡ Limited Stock Alert!</strong><br>
                  Only ${productData.stock} items available. Don't miss out!
                </div>
              ` : ''}
              
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/products/${productData.id}" class="btn">
                Shop Now - Get Yours Today! →
              </a>
            </div>
            
            <div class="benefits">
              <h3 style="color: #4a7c59; margin-top: 0;">🌱 Why You'll Love This Hemp Piece:</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li><strong>3x Stronger</strong> than cotton - built to last years, not months</li>
                <li><strong>Naturally Antimicrobial</strong> - stays fresh longer between washes</li>
                <li><strong>UV Protection</strong> - natural defense against harmful rays</li>
                <li><strong>Gets Softer</strong> with every wash - comfort that improves over time</li>
                <li><strong>100% Biodegradable</strong> - kind to your skin and our planet</li>
              </ul>
            </div>
            
            <p style="text-align: center; margin: 30px 0;">
              <strong>Exclusive for Newsletter Subscribers:</strong><br>
              Use code <span style="background: #4a7c59; color: white; padding: 4px 8px; border-radius: 4px; font-weight: 600;">INSIDER15</span> for 15% off your first purchase!
            </p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e9ecef;">
            
            <p style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/shop" style="color: #4a7c59; text-decoration: none; font-weight: 600;">Explore Our Full Collection</a> | 
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/about" style="color: #4a7c59; text-decoration: none;">Learn About Hemp Fashion</a>
            </p>
          </div>
          
          <div class="footer">
            <p style="margin: 0;">
              <strong>Femite Hemp Fashion</strong><br>
              Revolutionizing fashion with scientifically superior hemp clothing<br>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color: #4a7c59; text-decoration: none;">Visit our website</a>
            </p>
            <p style="margin: 10px 0 0 0; font-size: 12px;">
              You're receiving this because you subscribed to new product alerts. 
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?email=${encodeURIComponent(email)}" style="color: #4a7c59;">Unsubscribe</a> | 
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/newsletter/preferences?email=${encodeURIComponent(email)}" style="color: #4a7c59;">Update Preferences</a>
            </p>
          </div>
        </body>
      </html>
    `

    const textContent = `
🌿 NEW ARRIVAL ALERT - Femite Hemp Fashion

Introducing: ${productData.name}

Price: $${parseFloat(productData.price || 0).toFixed(2)}
${productData.categories && productData.categories.length > 0 ? `Categories: ${productData.categories.map((cat: any) => cat.name).join(', ')}` : ''}

${productData.description || ''}

${productData.stock <= 10 ? `⚡ LIMITED STOCK ALERT! Only ${productData.stock} items available.` : ''}

🌱 Why You'll Love This Hemp Piece:
• 3x Stronger than cotton - built to last years, not months
• Naturally Antimicrobial - stays fresh longer between washes  
• UV Protection - natural defense against harmful rays
• Gets Softer with every wash - comfort that improves over time
• 100% Biodegradable - kind to your skin and our planet

Exclusive Offer: Use code INSIDER15 for 15% off your first purchase!

Shop Now: ${process.env.NEXT_PUBLIC_APP_URL}/products/${productData.id}

Explore Full Collection: ${process.env.NEXT_PUBLIC_APP_URL}/shop

---
Femite Hemp Fashion
Revolutionizing fashion with scientifically superior hemp clothing
${process.env.NEXT_PUBLIC_APP_URL}

Unsubscribe: ${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?email=${encodeURIComponent(email)}
    `

    return this.sendEmail({
      to: email,
      subject: `🌿 New Arrival: ${productData.name} - Exclusive Hemp Fashion Just Dropped!`,
      text: textContent,
      html: htmlTemplate
    })
  }

  // Send bulk new product announcements to all subscribers
  async sendBulkProductAnnouncement(productData: any, subscriberEmails: string[]): Promise<{ sent: number, failed: number }> {
    const results = { sent: 0, failed: 0 }
    
    console.log(`📧 Sending new product announcement for "${productData.name}" to ${subscriberEmails.length} subscribers...`)
    
    // Process in batches to avoid overwhelming email service
    const BATCH_SIZE = 10
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
    
    for (let i = 0; i < subscriberEmails.length; i += BATCH_SIZE) {
      const batch = subscriberEmails.slice(i, i + BATCH_SIZE)
      
      // Send emails in current batch
      const batchPromises = batch.map(email => 
        this.sendNewProductAnnouncement(email, productData)
          .then(success => success ? results.sent++ : results.failed++)
          .catch(() => results.failed++)
      )
      
      await Promise.all(batchPromises)
      
      // Add delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < subscriberEmails.length) {
        console.log(`📧 Processed batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(subscriberEmails.length/BATCH_SIZE)}, waiting before next batch...`)
        await delay(2000) // 2 second delay between batches
      }
    }
    
    console.log(`📧 Product announcement complete: ${results.sent} sent, ${results.failed} failed`)
    return results
  }

  // Send order notification to admin
  async sendAdminOrderNotification(orderData: any): Promise<boolean> {
    const adminEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || process.env.SMTP_USER
    if (!adminEmail) {
      console.warn('Admin email not configured for order notifications')
      return false
    }

    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>New Order Notification</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background: #4a7c59; color: white; padding: 20px; }
            .content { padding: 20px; }
            .urgent { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; }
            table { border-collapse: collapse; width: 100%; margin: 15px 0; }
            th, td { padding: 10px; border: 1px solid #ddd; text-align: left; }
            th { background: #f8f9fa; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🚨 New Order Alert</h1>
          </div>
          <div class="content">
            <div class="urgent">
              <strong>⏰ Action Required:</strong> A new order has been placed and needs processing.
            </div>
            
            <h2>Order Information</h2>
            <table>
              <tr><th>Order Number</th><td>#${orderData.orderNumber}</td></tr>
              <tr><th>Customer</th><td>${orderData.customerName || 'Not provided'} (${orderData.customerEmail})</td></tr>
              <tr><th>Order Date</th><td>${new Date(orderData.orderDate).toLocaleString()}</td></tr>
              <tr><th>Total Amount</th><td><strong>$${orderData.total?.toFixed(2) || '0.00'}</strong></td></tr>
              <tr><th>Payment Status</th><td>${orderData.paymentStatus || 'Pending'}</td></tr>
            </table>
            
            <h3>Items Ordered</h3>
            <table>
              <thead>
                <tr><th>Item</th><th>Quantity</th><th>Price</th><th>Subtotal</th></tr>
              </thead>
              <tbody>
                ${orderData.items?.map((item: any) => `
                  <tr>
                    <td>${item.name}${item.size ? ` (${item.size})` : ''}</td>
                    <td>${item.quantity}</td>
                    <td>$${item.price.toFixed(2)}</td>
                    <td>$${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                `).join('') || ''}
              </tbody>
            </table>
            
            <h3>Shipping Details</h3>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 6px;">
              ${orderData.shippingAddress || 'Address not provided'}
            </div>
            
            <p><strong>Next Steps:</strong></p>
            <ul>
              <li>Verify payment status in Stripe dashboard</li>
              <li>Check inventory for ordered items</li>
              <li>Process and prepare shipment</li>
              <li>Update customer with tracking information</li>
            </ul>
            
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/orders/${orderData.orderId}" style="background: #4a7c59; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View Order in Admin Panel</a></p>
          </div>
        </body>
      </html>
    `

    const textContent = `
🚨 NEW ORDER ALERT - Femite Hemp Fashion

Action Required: A new order has been placed and needs processing.

Order Information:
• Order Number: #${orderData.orderNumber}
• Customer: ${orderData.customerName || 'Not provided'} (${orderData.customerEmail})
• Order Date: ${new Date(orderData.orderDate).toLocaleString()}
• Total Amount: $${orderData.total?.toFixed(2) || '0.00'}
• Payment Status: ${orderData.paymentStatus || 'Pending'}

Items Ordered:
${orderData.items?.map((item: any) => `• ${item.name}${item.size ? ` (${item.size})` : ''} - Qty: ${item.quantity} - $${item.price.toFixed(2)} = $${(item.price * item.quantity).toFixed(2)}`).join('\n') || ''}

Shipping Address:
${orderData.shippingAddress || 'Address not provided'}

Next Steps:
1. Verify payment status in Stripe dashboard
2. Check inventory for ordered items  
3. Process and prepare shipment
4. Update customer with tracking information

View order: ${process.env.NEXT_PUBLIC_APP_URL}/admin/orders/${orderData.orderId}

---
Femite Hemp Fashion Admin System
${process.env.NEXT_PUBLIC_APP_URL}
    `

    return this.sendEmail({
      to: adminEmail,
      subject: `🚨 NEW ORDER #${orderData.orderNumber} - $${orderData.total?.toFixed(2)} - Action Required`,
      text: textContent,
      html: htmlTemplate
    })
  }
}

// Export a singleton instance
export const emailService = new EmailService()