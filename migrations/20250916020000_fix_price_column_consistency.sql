-- Fix price column consistency across all tables
-- Ensure products table uses price (in decimal) instead of price_cents

-- First, check if we need to convert price_cents to price
DO $$ 
BEGIN 
    -- If price_cents exists but price doesn't, add price column and populate it
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'price_cents'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'price'
    ) THEN
        -- Add price column as decimal
        ALTER TABLE products ADD COLUMN price NUMERIC(10,2) NOT NULL DEFAULT 0.00;
        
        -- Convert price_cents to price (divide by 100)
        UPDATE products SET price = ROUND(price_cents::NUMERIC / 100, 2);
        
        -- Drop the old price_cents column
        ALTER TABLE products DROP COLUMN price_cents;
        
    -- If price exists, ensure it's the right type
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'price'
    ) THEN
        -- Ensure price column is the right type
        ALTER TABLE products ALTER COLUMN price TYPE NUMERIC(10,2);
    END IF;
END $$;

-- Ensure order_items has proper price column
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'price'
    ) THEN
        ALTER TABLE order_items ADD COLUMN price NUMERIC(10,2) NOT NULL DEFAULT 0.00;
    ELSE
        ALTER TABLE order_items ALTER COLUMN price TYPE NUMERIC(10,2);
    END IF;
END $$;

-- Ensure orders table has total column with proper type
DO $$ 
BEGIN 
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'total'
    ) THEN
        ALTER TABLE orders ALTER COLUMN total TYPE NUMERIC(10,2);
    END IF;
    
    -- Also check for total_amount column and standardize to total
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'total_amount'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'total'
    ) THEN
        ALTER TABLE orders RENAME COLUMN total_amount TO total;
    END IF;
END $$;

-- Add default values where missing
UPDATE products SET low_stock_threshold = 10 WHERE low_stock_threshold IS NULL;
UPDATE products SET track_inventory = true WHERE track_inventory IS NULL;

-- Update index to use new column name
DROP INDEX IF EXISTS idx_products_price_cents;
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
