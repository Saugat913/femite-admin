-- Create settings table for admin panel configuration
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) NOT NULL,
    value TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'general',
    type VARCHAR(20) NOT NULL DEFAULT 'string', -- string, number, boolean, json
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create unique index for key-category combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_settings_key_category ON settings (key, category);

-- Create index for category lookups
CREATE INDEX IF NOT EXISTS idx_settings_category ON settings (category);

-- Insert default settings
INSERT INTO settings (key, value, category, type, description) VALUES
-- Store settings
('name', 'Hemp Fashion Store', 'store', 'string', 'Store name'),
('email', 'admin@hempfashion.com', 'store', 'string', 'Store contact email'),
('phone', '+1 (555) 123-4567', 'store', 'string', 'Store contact phone'),
('address', '123 Hemp Street, Green City, GC 12345', 'store', 'string', 'Store physical address'),
('currency', 'USD', 'store', 'string', 'Default currency'),
('timezone', 'America/New_York', 'store', 'string', 'Store timezone'),
('tax_rate', '8.5', 'store', 'number', 'Default tax rate percentage'),
('logo_url', '/logo.png', 'store', 'string', 'Store logo URL'),

-- Shipping settings
('free_shipping_threshold', '50', 'shipping', 'number', 'Free shipping minimum amount'),
('flat_rate', '9.99', 'shipping', 'number', 'Standard shipping rate'),
('express_rate', '19.99', 'shipping', 'number', 'Express shipping rate'),
('overnight_rate', '39.99', 'shipping', 'number', 'Overnight shipping rate'),
('processing_days', '1', 'shipping', 'number', 'Order processing days'),
('standard_days', '5-7', 'shipping', 'string', 'Standard delivery timeframe'),
('express_days', '2-3', 'shipping', 'string', 'Express delivery timeframe'),
('overnight_days', '1', 'shipping', 'string', 'Overnight delivery timeframe'),

-- Payment settings
('stripe_publishable_key', '', 'payment', 'string', 'Stripe publishable key'),
('stripe_secret_key', '', 'payment', 'string', 'Stripe secret key'),
('paypal_client_id', '', 'payment', 'string', 'PayPal client ID'),
('paypal_secret', '', 'payment', 'string', 'PayPal secret'),
('enable_stripe', 'true', 'payment', 'boolean', 'Enable Stripe payments'),
('enable_paypal', 'false', 'payment', 'boolean', 'Enable PayPal payments'),
('enable_cash_on_delivery', 'false', 'payment', 'boolean', 'Enable cash on delivery')

ON CONFLICT (key, category) DO NOTHING;

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update the updated_at field
DROP TRIGGER IF EXISTS trigger_update_settings_updated_at ON settings;
CREATE TRIGGER trigger_update_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_settings_updated_at();