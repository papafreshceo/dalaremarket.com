-- Add expense_type column to category_settings table
ALTER TABLE category_settings
ADD COLUMN expense_type TEXT;

-- Add comment
COMMENT ON COLUMN category_settings.expense_type IS '지출 유형: 사입, 구매, 지출';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_category_settings_expense_type
ON category_settings(expense_type);
