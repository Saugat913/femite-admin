import { NextRequest, NextResponse } from 'next/server'
import { uploadToCloudinary, generateImageSizes } from '@/lib/cloudinary'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No image uploaded' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed' },
        { status: 400 }
      )
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024 // 5MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size too large. Maximum 5MB allowed' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename for Cloudinary
    const timestamp = Date.now()
    const fileName = `product-${timestamp}-${Math.random().toString(36).substring(2)}`
    
    // Upload to Cloudinary
    const result = await uploadToCloudinary(buffer, {
      folder: 'hemp-admin/products',
      public_id: fileName,
      transformation: {
        quality: 'auto',
        fetch_format: 'auto',
        width: 1200,
        height: 1200,
        crop: 'limit'
      }
    })

    // Generate different image sizes
    const imageSizes = generateImageSizes(result.public_id)

    return NextResponse.json({
      success: true,
      data: {
        url: result.secure_url,
        public_id: result.public_id,
        filename: fileName,
        size: result.bytes,
        width: result.width,
        height: result.height,
        format: result.format,
        mimetype: file.type,
        sizes: imageSizes
      },
      message: 'Image uploaded successfully to Cloudinary'
    })

  } catch (error) {
    console.error('POST /api/admin/upload/image error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload image' },
      { status: 500 }
    )
  }
}