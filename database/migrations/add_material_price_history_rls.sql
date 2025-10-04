-- Enable RLS on material_price_history table
ALTER TABLE material_price_history ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read all price history
CREATE POLICY "Allow authenticated users to read price history"
ON material_price_history
FOR SELECT
TO authenticated
USING (true);

-- Policy: Allow authenticated users to insert price history
CREATE POLICY "Allow authenticated users to insert price history"
ON material_price_history
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Allow users to update their own price records
CREATE POLICY "Allow users to update own price records"
ON material_price_history
FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Policy: Allow users to delete their own price records
CREATE POLICY "Allow users to delete own price records"
ON material_price_history
FOR DELETE
TO authenticated
USING (created_by = auth.uid());
