-- Allow public read access to option_products table
-- This enables non-authenticated users to view product options for sample data

-- Enable RLS on option_products if not already enabled
ALTER TABLE option_products ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including non-authenticated users) to read option_products
CREATE POLICY "Anyone can view option products"
  ON option_products FOR SELECT
  TO public
  USING (true);

-- Note: INSERT, UPDATE, DELETE still require authentication
-- These policies can be added separately if needed
