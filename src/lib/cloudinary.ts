import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export interface CloudinaryUploadResult {
  public_id: string
  secure_url: string
  url: string
  width: number
  height: number
  format: string
  bytes: number
  created_at: string
  resource_type: string
  type: string
}

export interface UploadOptions {
  folder?: string
  transformation?: object
  public_id?: string
  overwrite?: boolean
  resource_type?: 'image' | 'video' | 'raw' | 'auto'
}

/**
 * Upload a file buffer to Cloudinary
 */
export async function uploadToCloudinary(
  fileBuffer: Buffer,
  options: UploadOptions = {}
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: options.folder || 'hemp-admin/products',
      resource_type: options.resource_type || 'image',
      transformation: options.transformation || {
        quality: 'auto',
        fetch_format: 'auto',
      },
      overwrite: options.overwrite ?? false,
      ...options,
    }

    cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error)
          reject(error)
        } else if (result) {
          resolve(result as CloudinaryUploadResult)
        } else {
          reject(new Error('Upload failed with no result'))
        }
      }
    ).end(fileBuffer)
  })
}

/**
 * Upload a file from a URL to Cloudinary
 */
export async function uploadFromUrl(
  url: string,
  options: UploadOptions = {}
): Promise<CloudinaryUploadResult> {
  const uploadOptions = {
    folder: options.folder || 'hemp-admin/products',
    resource_type: options.resource_type || 'image',
    transformation: options.transformation || {
      quality: 'auto',
      fetch_format: 'auto',
    },
    overwrite: options.overwrite ?? false,
    ...options,
  }

  return cloudinary.uploader.upload(url, uploadOptions) as Promise<CloudinaryUploadResult>
}

/**
 * Delete an image from Cloudinary
 */
export async function deleteFromCloudinary(publicId: string): Promise<any> {
  return cloudinary.uploader.destroy(publicId)
}

/**
 * Generate a transformation URL for an image
 */
export function getTransformedUrl(
  publicId: string,
  transformations: object = {}
): string {
  return cloudinary.url(publicId, {
    secure: true,
    ...transformations,
  })
}

/**
 * Generate different sizes of an image
 */
export function generateImageSizes(publicId: string) {
  const baseTransform = { quality: 'auto', fetch_format: 'auto' }
  
  return {
    thumbnail: getTransformedUrl(publicId, {
      ...baseTransform,
      width: 150,
      height: 150,
      crop: 'fill',
    }),
    small: getTransformedUrl(publicId, {
      ...baseTransform,
      width: 300,
      height: 300,
      crop: 'fit',
    }),
    medium: getTransformedUrl(publicId, {
      ...baseTransform,
      width: 600,
      height: 600,
      crop: 'fit',
    }),
    large: getTransformedUrl(publicId, {
      ...baseTransform,
      width: 1200,
      height: 1200,
      crop: 'fit',
    }),
    original: getTransformedUrl(publicId, baseTransform),
  }
}

/**
 * Extract public_id from Cloudinary URL
 */
export function extractPublicId(cloudinaryUrl: string): string | null {
  try {
    // Match Cloudinary URL pattern and extract public_id
    const match = cloudinaryUrl.match(/\/([^\/]+)\/([^\/]+)\/v\d+\/(.+)\.[^.]+$/)
    if (match && match[3]) {
      return match[3]
    }
    
    // Alternative pattern for URLs without version
    const altMatch = cloudinaryUrl.match(/\/([^\/]+)\/([^\/]+)\/(.+)\.[^.]+$/)
    if (altMatch && altMatch[3]) {
      return altMatch[3]
    }
    
    return null
  } catch (error) {
    console.error('Error extracting public_id from URL:', error)
    return null
  }
}

export default cloudinary