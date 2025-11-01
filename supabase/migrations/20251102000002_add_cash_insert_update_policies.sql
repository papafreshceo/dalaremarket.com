-- Add INSERT and UPDATE RLS policies for cash system
-- This fixes the "new row violates row-level security policy" errors

-- INSERT policies
CREATE POLICY "Users can insert their own cash records"
  ON user_cash FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
  ON user_cash_transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily rewards"
  ON user_daily_rewards FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE policies
CREATE POLICY "Users can update their own cash balance"
  ON user_cash FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily rewards"
  ON user_daily_rewards FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow admins to update cash settings
CREATE POLICY "Admins can update cash settings"
  ON cash_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
