-- up
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS shipping_address TEXT,
ADD COLUMN IF NOT EXISTS status_v2 TEXT DEFAULT 'pending' CHECK (status_v2 IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'failed'));

-- Copy data from total to total_amount if needed
UPDATE orders SET total_amount = total WHERE total_amount IS NULL;

-- Make total_amount NOT NULL after copying data
ALTER TABLE orders ALTER COLUMN total_amount SET NOT NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session_id ON orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status_v2 ON orders(status_v2);

-- Update order_items table to include product_name for better tracking
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS product_name TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now();
