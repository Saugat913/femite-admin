-- up
-- Create user addresses table
CREATE TABLE IF NOT EXISTS user_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'shipping' CHECK (type IN ('shipping', 'billing', 'both')),
  name TEXT NOT NULL,
  company TEXT,
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'US',
  phone TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_addresses_default ON user_addresses(user_id, is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_user_addresses_type ON user_addresses(user_id, type);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_addresses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_addresses_updated_at ON user_addresses;
CREATE TRIGGER trigger_user_addresses_updated_at
    BEFORE UPDATE ON user_addresses
    FOR EACH ROW
    EXECUTE FUNCTION update_user_addresses_updated_at();

-- Create function to ensure only one default address per user per type
CREATE OR REPLACE FUNCTION ensure_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = true THEN
        -- Unset all other default addresses for this user and type
        UPDATE user_addresses 
        SET is_default = false 
        WHERE user_id = NEW.user_id 
        AND type = NEW.type 
        AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ensure_single_default_address ON user_addresses;
CREATE TRIGGER trigger_ensure_single_default_address
    BEFORE INSERT OR UPDATE ON user_addresses
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_default_address();
