-- Add Cloudinary fields to products table for better image management
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS cloudinary_public_id TEXT,
ADD COLUMN IF NOT EXISTS image_width INTEGER,
ADD COLUMN IF NOT EXISTS image_height INTEGER;

-- Create index on cloudinary_public_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_products_cloudinary_public_id ON products(cloudinary_public_id);

-- Update existing products to have default values
UPDATE products 
SET cloudinary_public_id = NULL, image_width = NULL, image_height = NULL 
WHERE cloudinary_public_id IS NULL;