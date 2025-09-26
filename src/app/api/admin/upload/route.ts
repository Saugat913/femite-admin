import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
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

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const fileName = `${timestamp}-${Math.random().toString(36).substring(2)}.${fileExtension}`
    
    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filePath = join(uploadDir, fileName)
    
    await writeFile(filePath, buffer)

    // Return the URL path for the uploaded file
    const fileUrl = `/uploads/${fileName}`

    return NextResponse.json({
      success: true,
      data: {
        url: fileUrl,
        filename: fileName,
        size: file.size,
        type: file.type
      },
      message: 'File uploaded successfully'
    })

  } catch (error) {
    console.error('POST /api/admin/upload error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

// Handle multiple file uploads
export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files uploaded' },
        { status: 400 }
      )
    }

    const uploadedFiles = []
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const maxSize = 5 * 1024 * 1024 // 5MB

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    for (const file of files) {
      // Validate each file
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { success: false, error: `Invalid file type for ${file.name}. Only JPEG, PNG, and WebP are allowed` },
          { status: 400 }
        )
      }

      if (file.size > maxSize) {
        return NextResponse.json(
          { success: false, error: `File ${file.name} is too large. Maximum 5MB allowed` },
          { status: 400 }
        )
      }

      // Generate unique filename
      const timestamp = Date.now()
      const fileExtension = file.name.split('.').pop()
      const fileName = `${timestamp}-${Math.random().toString(36).substring(2)}.${fileExtension}`
      
      // Save file
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const filePath = join(uploadDir, fileName)
      
      await writeFile(filePath, buffer)

      uploadedFiles.push({
        url: `/uploads/${fileName}`,
        filename: fileName,
        originalName: file.name,
        size: file.size,
        type: file.type
      })
    }

    return NextResponse.json({
      success: true,
      data: uploadedFiles,
      message: `${uploadedFiles.length} file(s) uploaded successfully`
    })

  } catch (error) {
    console.error('PUT /api/admin/upload error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload files' },
      { status: 500 }
    )
  }
}