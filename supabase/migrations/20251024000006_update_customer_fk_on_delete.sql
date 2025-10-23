-- integrated_orders의 customer_id 외래 키를 ON DELETE SET NULL로 변경
-- 고객 삭제 시 주문은 유지되고 customer_id만 NULL로 설정

-- 1. 기존 외래 키 제약 조건 확인 및 삭제
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- customer_id 외래 키 제약 조건 이름 찾기
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'integrated_orders'::regclass
      AND contype = 'f'
      AND conkey = (SELECT array_agg(attnum) FROM pg_attribute
                    WHERE attrelid = 'integrated_orders'::regclass
                      AND attname = 'customer_id');

    -- 제약 조건이 있으면 삭제
    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE integrated_orders DROP CONSTRAINT %I', constraint_name);
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END IF;
END $$;

-- 2. 새로운 외래 키 추가 (ON DELETE SET NULL)
ALTER TABLE integrated_orders
ADD CONSTRAINT integrated_orders_customer_id_fkey
FOREIGN KEY (customer_id)
REFERENCES customers(id)
ON DELETE SET NULL;

COMMENT ON CONSTRAINT integrated_orders_customer_id_fkey ON integrated_orders IS '고객 삭제 시 주문의 customer_id를 NULL로 설정';
