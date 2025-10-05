-- purchases 테이블의 supplier_id 외래키를 partners 테이블로 변경

-- 기존 외래키 제약 삭제
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%purchases_supplier_id%'
        AND table_name = 'purchases'
    ) THEN
        ALTER TABLE purchases DROP CONSTRAINT IF EXISTS purchases_supplier_id_fkey;
    END IF;
END $$;

-- 새로운 외래키 추가 (partners 테이블 참조)
ALTER TABLE purchases 
ADD CONSTRAINT purchases_supplier_id_fkey 
FOREIGN KEY (supplier_id) REFERENCES partners(id);
