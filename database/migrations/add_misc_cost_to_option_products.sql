-- Add misc_cost and total_cost columns to option_products table
ALTER TABLE option_products
ADD COLUMN IF NOT EXISTS misc_cost DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10, 2) DEFAULT 0;

COMMENT ON COLUMN option_products.misc_cost IS '기타비용 (예: 기타 잡비)';
COMMENT ON COLUMN option_products.total_cost IS '총원가 (원물비용 + 박스비 + 완충재 + 인건비 + 기타비용 + 배송비)';

-- Create or replace function to auto-calculate total_cost
CREATE OR REPLACE FUNCTION calculate_total_cost()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_cost := COALESCE(NEW.raw_material_cost, 0)
                  + COALESCE(NEW.packaging_box_price, 0)
                  + COALESCE(NEW.cushioning_price, 0)
                  + COALESCE(NEW.labor_cost, 0)
                  + COALESCE(NEW.misc_cost, 0)
                  + COALESCE(NEW.shipping_fee, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-calculate total_cost on insert/update
DROP TRIGGER IF EXISTS trigger_calculate_total_cost ON option_products;
CREATE TRIGGER trigger_calculate_total_cost
  BEFORE INSERT OR UPDATE ON option_products
  FOR EACH ROW
  EXECUTE FUNCTION calculate_total_cost();
