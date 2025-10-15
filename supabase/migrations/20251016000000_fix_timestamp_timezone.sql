-- Fix timestamp columns to use timestamptz (timestamp with time zone)
-- This ensures UTC timezone information is preserved

ALTER TABLE integrated_orders
  ALTER COLUMN cancel_requested_at TYPE timestamptz USING cancel_requested_at AT TIME ZONE 'UTC';

ALTER TABLE integrated_orders
  ALTER COLUMN canceled_at TYPE timestamptz USING canceled_at AT TIME ZONE 'UTC';

COMMENT ON COLUMN integrated_orders.cancel_requested_at IS 'UTC timestamp when cancellation was requested';
COMMENT ON COLUMN integrated_orders.canceled_at IS 'UTC timestamp when order was cancelled';
