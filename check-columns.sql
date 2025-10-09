-- Check if shipping_status column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'integrated_orders'
AND column_name IN ('shipping_status', 'cs_status', 'memo')
ORDER BY column_name;
