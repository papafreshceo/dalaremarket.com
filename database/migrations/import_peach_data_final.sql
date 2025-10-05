-- ============================================
-- 복숭아 옵션상품 데이터 임포트 (FINAL)
-- 실제 DB 구조에 맞춤
-- 작성일: 2025-10-05
-- ============================================

-- ============================================
-- 1. 벤더사(거래처) 데이터 삽입
-- ============================================
INSERT INTO partners (code, name, phone, address, is_active) VALUES
('SUP0100', '청도농협공판장', '010-1111-2222', '경상북도 청도군 청도읍 구미길 22', true),
('VEND0001', '달래마켓', '010-1111-2222', '경상북도 청도군 청도읍 구미길 22', true)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  address = EXCLUDED.address;

-- ============================================
-- 2. 원물 데이터 삽입 (딱딱이 복숭아)
-- ============================================
INSERT INTO raw_materials (
  material_code, material_name,
  category_1, category_2, category_3,
  standard_unit, latest_price, unit_quantity, last_trade_date,
  season, season_start_date, season_peak_date, season_end_date,
  supply_status,
  main_supplier_id
) VALUES
('hp4k12', '딱딱이(12과)', '농산물', '과일', '복숭아', '4kg', 20000, 4, '2025-08-24', '여름', '2025-06-20', '2025-07-15', '2025-08-25', 'SEASON_END', (SELECT id FROM partners WHERE code = 'SUP0100')),
('hp4k14', '딱딱이(14과)', '농산물', '과일', '복숭아', '4kg', 18000, 4, '2025-08-24', '여름', '2025-06-20', '2025-07-15', '2025-08-25', 'SEASON_END', (SELECT id FROM partners WHERE code = 'SUP0100')),
('hp4k16', '딱딱이(16과)', '농산물', '과일', '복숭아', '4kg', 16000, 4, '2025-08-24', '여름', '2025-06-20', '2025-07-15', '2025-08-25', 'SEASON_END', (SELECT id FROM partners WHERE code = 'SUP0100')),
('hp4k18', '딱딱이(18과)', '농산물', '과일', '복숭아', '4kg', 15000, 4, '2025-08-24', '여름', '2025-06-20', '2025-07-15', '2025-08-25', 'SEASON_END', (SELECT id FROM partners WHERE code = 'SUP0100')),
('hp4k20', '딱딱이(20과)', '농산물', '과일', '복숭아', '4kg', 14500, 4, '2025-08-24', '여름', '2025-06-20', '2025-07-15', '2025-08-25', 'SEASON_END', (SELECT id FROM partners WHERE code = 'SUP0100')),
('hp4k22', '딱딱이(22과)', '농산물', '과일', '복숭아', '4kg', 13000, 4, '2025-08-24', '여름', '2025-06-20', '2025-07-15', '2025-08-25', 'SEASON_END', (SELECT id FROM partners WHERE code = 'SUP0100')),
('hp4k24', '딱딱이(24과)', '농산물', '과일', '복숭아', '4kg', 12000, 4, '2025-08-24', '여름', '2025-06-20', '2025-07-15', '2025-08-25', 'SEASON_END', (SELECT id FROM partners WHERE code = 'SUP0100'))
ON CONFLICT (material_code) DO UPDATE SET
  latest_price = EXCLUDED.latest_price,
  last_trade_date = EXCLUDED.last_trade_date,
  supply_status = EXCLUDED.supply_status,
  main_supplier_id = EXCLUDED.main_supplier_id;

-- ============================================
-- 3. 옵션상품 데이터 삽입 (option_products)
-- ============================================

INSERT INTO option_products (
  option_code, option_name, item_type, variety,
  specification_1, specification_2, specification_3,
  weight, weight_unit,
  packaging_box_price, pack_price, bag_vinyl_price, cushioning_price, sticker_price, ice_pack_price, other_material_price,
  raw_material_cost,
  vendor_id, shipping_type, shipping_address, shipping_contact, shipping_deadline,
  shipping_fee, additional_quantity,
  supply_status,
  season, season_start_date, season_peak_date, season_end_date,
  labor_cost, target_margin_rate, seller_margin_rate,
  seller_supply_price_mode, seller_supply_auto_price, seller_supply_manual_price, seller_supply_price,
  naver_price_mode,
  naver_paid_shipping_auto, naver_free_shipping_auto,
  naver_paid_shipping_manual, naver_free_shipping_manual,
  naver_paid_shipping_price, naver_free_shipping_price,
  coupang_price_mode,
  coupang_paid_shipping_auto, coupang_free_shipping_auto,
  coupang_paid_shipping_manual, coupang_free_shipping_manual,
  coupang_paid_shipping_price, coupang_free_shipping_price,
  thumbnail_url, has_detail_page, has_images
) VALUES
('hp4k22-013', '딱딱이1.3kg (8과)', '복숭아', '딱딱이', '1.3kg', '소과', '8과',
 1.3, 'kg', 800, 0, 0, 100, 0, 0, 0, 4225,
 (SELECT id FROM partners WHERE code = 'VEND0001'), '직접발송', '경상북도 청도군 청도읍 구미길 22', '010-1111-2222', 1,
 3000, 0, 'SEASON_END', '여름', '2025-06-20', '2025-07-15', '2025-08-25',
 1000, 20, 10, '수동', 10140, 13500, 13500, '자동',
 7300, 10500, 12000, 15200, 12000, 15200, '자동',
 7800, 14400, 20000, 23400, 20000, 23400,
 'https://res.cloudinary.com/dde1hpbrp/image/upload/01_detail_pages/peach004_hard/thumbnail_hardpeach/08.jpg', true, true),

('hp4k20-013', '딱딱이1.3kg (7과)', '복숭아', '딱딱이', '1.3kg', '중소과', '7과',
 1.3, 'kg', 800, 0, 0, 100, 0, 0, 0, 4713,
 (SELECT id FROM partners WHERE code = 'VEND0001'), '직접발송', '경상북도 청도군 청도읍 구미길 21', '010-1111-2223', 1,
 3000, 0, 'SEASON_END', '여름', '2025-06-20', '2025-07-15', '2025-08-25',
 1000, 20, 10, '수동', 10680, 14000, 14000, '자동',
 7900, 11100, 0, 0, 7900, 11100, '자동',
 8500, 15100, 0, 0, 8500, 15100,
 'https://res.cloudinary.com/dde1hpbrp/image/upload/01_detail_pages/peach004_hard/thumbnail_hardpeach/08.jpg', true, true),

('hp4k18-013', '딱딱이1.3kg (6과)', '복숭아', '딱딱이', '1.3kg', '중과', '6과',
 1.3, 'kg', 800, 0, 0, 100, 0, 0, 0, 4875,
 (SELECT id FROM partners WHERE code = 'VEND0001'), '직접발송', '경상북도 청도군 청도읍 구미길 20', '010-1111-2224', 1,
 3000, 0, 'SEASON_END', '여름', '2025-06-20', '2025-07-15', '2025-08-25',
 1000, 20, 10, '수동', 10860, 14500, 14500, '자동',
 8100, 11300, 0, 0, 8100, 11300, '자동',
 8700, 15300, 0, 0, 8700, 15300,
 'https://res.cloudinary.com/dde1hpbrp/image/upload/01_detail_pages/peach004_hard/thumbnail_hardpeach/08.jpg', true, true),

('hp4k14-013', '딱딱이1.3kg (5과)', '복숭아', '딱딱이', '1.3kg', '대과', '5과',
 1.3, 'kg', 800, 0, 0, 100, 0, 0, 0, 5525,
 (SELECT id FROM partners WHERE code = 'VEND0001'), '직접발송', '경상북도 청도군 청도읍 구미길 19', '010-1111-2225', 1,
 3000, 0, 'SEASON_END', '여름', '2025-06-20', '2025-07-15', '2025-08-25',
 1000, 20, 10, '수동', 11580, 15000, 15000, '자동',
 8900, 12100, 0, 0, 8900, 12100, '자동',
 9500, 16200, 0, 0, 9500, 16200,
 'https://res.cloudinary.com/dde1hpbrp/image/upload/01_detail_pages/peach004_hard/thumbnail_hardpeach/08.jpg', true, true),

('hp4k12-013', '딱딱이1.3kg (4과)', '복숭아', '딱딱이', '1.3kg', '특대과', '4과',
 1.3, 'kg', 800, 0, 0, 100, 0, 0, 0, 6500,
 (SELECT id FROM partners WHERE code = 'VEND0001'), '직접발송', '경상북도 청도군 청도읍 구미길 18', '010-1111-2226', 1,
 3000, 0, 'SEASON_END', '여름', '2025-06-20', '2025-07-15', '2025-08-25',
 1000, 20, 10, '수동', 12670, 15500, 15500, '자동',
 10000, 13200, 0, 0, 10000, 13200, '자동',
 10800, 17700, 0, 0, 10800, 17700,
 'https://res.cloudinary.com/dde1hpbrp/image/upload/01_detail_pages/peach004_hard/thumbnail_hardpeach/08.jpg', true, true),

('hp4k20-02', '딱딱이2kg (10과)', '복숭아', '딱딱이', '2kg', '소과', '10과',
 2, 'kg', 550, 0, 0, 100, 0, 0, 0, 7250,
 (SELECT id FROM partners WHERE code = 'VEND0001'), '직접발송', '경상북도 청도군 청도읍 구미길 17', '010-1111-2227', 1,
 3000, 0, 'SEASON_END', '여름', '2025-06-20', '2025-07-15', '2025-08-25',
 1000, 20, 10, '수동', 13220, 16000, 16000, '자동',
 10600, 13800, 0, 0, 10600, 13800, '자동',
 11500, 18400, 0, 0, 11500, 18400,
 'https://res.cloudinary.com/dde1hpbrp/image/upload/01_detail_pages/peach004_hard/thumbnail_hardpeach/08.jpg', true, true),

('hp4k18-02', '딱딱이2kg (9과)', '복숭아', '딱딱이', '2kg', '중소과', '9과',
 2, 'kg', 550, 0, 0, 100, 0, 0, 0, 7500,
 (SELECT id FROM partners WHERE code = 'VEND0001'), '직접발송', '경상북도 청도군 청도읍 구미길 16', '010-1111-2228', 1,
 3000, 0, 'SEASON_END', '여름', '2025-06-20', '2025-07-15', '2025-08-25',
 1000, 20, 10, '수동', 13500, 16500, 16500, '자동',
 10900, 14100, 0, 0, 10900, 14100, '자동',
 11800, 18800, 0, 0, 11800, 18800,
 'https://res.cloudinary.com/dde1hpbrp/image/upload/01_detail_pages/peach004_hard/thumbnail_hardpeach/08.jpg', true, true),

('hp4k16-02', '딱딱이2kg (8과)', '복숭아', '딱딱이', '2kg', '중과', '8과',
 2, 'kg', 550, 0, 0, 100, 0, 0, 0, 8000,
 (SELECT id FROM partners WHERE code = 'VEND0001'), '직접발송', '경상북도 청도군 청도읍 구미길 15', '010-1111-2229', 1,
 3000, 0, 'SEASON_END', '여름', '2025-06-20', '2025-07-15', '2025-08-25',
 1000, 20, 10, '수동', 14060, 17000, 17000, '자동',
 11500, 14700, 0, 0, 11500, 14700, '자동',
 12400, 19500, 0, 0, 12400, 19500,
 'https://res.cloudinary.com/dde1hpbrp/image/upload/01_detail_pages/peach004_hard/thumbnail_hardpeach/08.jpg', true, true),

('hp4k14-02', '딱딱이2kg (7과)', '복숭아', '딱딱이', '2kg', '대과', '7과',
 2, 'kg', 550, 0, 0, 100, 0, 0, 0, 9000,
 (SELECT id FROM partners WHERE code = 'VEND0001'), '직접발송', '경상북도 청도군 청도읍 구미길 14', '010-1111-2230', 1,
 3000, 0, 'SUPPLYING', '여름', '2025-06-20', '2025-07-15', '2025-08-25',
 1000, 20, 10, '수동', 15170, 17500, 17500, '자동',
 12700, 15900, 0, 0, 12700, 15900, '자동',
 13700, 20900, 0, 0, 13700, 20900,
 'https://res.cloudinary.com/dde1hpbrp/image/upload/01_detail_pages/peach004_hard/thumbnail_hardpeach/08.jpg', true, true),

('hp4k12-02', '딱딱이2kg (6과)', '복숭아', '딱딱이', '2kg', '특대과', '6과',
 2, 'kg', 550, 0, 0, 100, 0, 0, 0, 10000,
 (SELECT id FROM partners WHERE code = 'VEND0001'), '직접발송', '경상북도 청도군 청도읍 구미길 13', '010-1111-2231', 1,
 3000, 0, 'SEASON_END', '여름', '2025-06-20', '2025-07-15', '2025-08-25',
 1000, 20, 10, '수동', 16280, 18000, 18000, '자동',
 14000, 17200, 0, 0, 14000, 17200, '자동',
 15100, 22400, 0, 0, 15100, 22400,
 'https://res.cloudinary.com/dde1hpbrp/image/upload/01_detail_pages/peach004_hard/thumbnail_hardpeach/08.jpg', true, true),

('hp4k24-04', '딱딱이4kg (24과)', '복숭아', '딱딱이', '4kg', '소과', '24과',
 4, 'kg', 0, 0, 0, 100, 0, 0, 0, 12000,
 (SELECT id FROM partners WHERE code = 'VEND0001'), '직접발송', '경상북도 청도군 청도읍 구미길 12', '010-1111-2232', 1,
 3000, 0, 'SEASON_END', '여름', '2025-06-20', '2025-07-15', '2025-08-25',
 1000, 20, 10, '수동', 17890, 18500, 18500, '자동',
 15700, 18900, 0, 0, 15700, 18900, '자동',
 16900, 24500, 0, 0, 16900, 24500,
 'https://res.cloudinary.com/dde1hpbrp/image/upload/01_detail_pages/peach004_hard/thumbnail_hardpeach/08.jpg', true, true),

('hp4k22-04', '딱딱이4kg (22과)', '복숭아', '딱딱이', '4kg', '소과', '22과',
 4, 'kg', 0, 0, 0, 100, 0, 0, 0, 13000,
 (SELECT id FROM partners WHERE code = 'VEND0001'), '직접발송', '경상북도 청도군 청도읍 구미길 11', '010-1111-2233', 1,
 3000, 0, 'SEASON_END', '여름', '2025-06-20', '2025-07-15', '2025-08-25',
 1000, 20, 10, '수동', 19000, 19000, 19000, '자동',
 16900, 20100, 0, 0, 16900, 20100, '자동',
 18300, 25900, 0, 0, 18300, 25900,
 'https://res.cloudinary.com/dde1hpbrp/image/upload/01_detail_pages/peach004_hard/thumbnail_hardpeach/08.jpg', true, true),

('hp4k20-04', '딱딱이4kg (20과)', '복숭아', '딱딱이', '4kg', '소과', '20과',
 4, 'kg', 0, 0, 0, 100, 0, 0, 0, 14500,
 (SELECT id FROM partners WHERE code = 'VEND0001'), '직접발송', '경상북도 청도군 청도읍 구미길 10', '010-1111-2234', 1,
 3000, 0, 'SEASON_END', '여름', '2025-06-20', '2025-07-15', '2025-08-25',
 1000, 20, 10, '수동', 20670, 19500, 19500, '자동',
 18700, 21900, 0, 0, 18700, 21900, '자동',
 20200, 28100, 0, 0, 20200, 28100,
 'https://res.cloudinary.com/dde1hpbrp/image/upload/01_detail_pages/peach004_hard/thumbnail_hardpeach/08.jpg', true, true),

('hp4k18-04', '딱딱이4kg (18과)', '복숭아', '딱딱이', '4kg', '중소과', '18과',
 4, 'kg', 0, 0, 0, 100, 0, 0, 0, 15000,
 (SELECT id FROM partners WHERE code = 'VEND0001'), '직접발송', '경상북도 청도군 청도읍 구미길 09', '010-1111-2235', 1,
 3000, 0, 'SEASON_END', '여름', '2025-06-20', '2025-07-15', '2025-08-25',
 1000, 20, 10, '수동', 21220, 20000, 20000, '자동',
 19300, 22500, 0, 0, 19300, 22500, '자동',
 20800, 28800, 0, 0, 20800, 28800,
 'https://res.cloudinary.com/dde1hpbrp/image/upload/01_detail_pages/peach004_hard/thumbnail_hardpeach/08.jpg', true, true)

ON CONFLICT (option_code) DO UPDATE SET
  option_name = EXCLUDED.option_name,
  raw_material_cost = EXCLUDED.raw_material_cost,
  seller_supply_price = EXCLUDED.seller_supply_price,
  supply_status = EXCLUDED.supply_status;

-- ============================================
-- 4. 옵션상품-원물 매핑 삽입 (option_product_materials)
-- ============================================

-- 중복 방지를 위한 삭제 후 삽입
DELETE FROM option_product_materials;

-- 1.3kg 옵션들
INSERT INTO option_product_materials (option_id, material_id, material_order, quantity, unit)
SELECT (SELECT id FROM option_products WHERE option_code = 'hp4k22-013'),
       (SELECT id FROM raw_materials WHERE material_code = 'hp4k22'), 1, 1.3, 'kg';

INSERT INTO option_product_materials (option_id, material_id, material_order, quantity, unit)
SELECT (SELECT id FROM option_products WHERE option_code = 'hp4k20-013'),
       (SELECT id FROM raw_materials WHERE material_code = 'hp4k20'), 1, 1.3, 'kg';

INSERT INTO option_product_materials (option_id, material_id, material_order, quantity, unit)
SELECT (SELECT id FROM option_products WHERE option_code = 'hp4k18-013'),
       (SELECT id FROM raw_materials WHERE material_code = 'hp4k18'), 1, 1.3, 'kg';

-- hp4k14-013 → 딱딱이(14과) + 딱딱이(16과) 혼합
INSERT INTO option_product_materials (option_id, material_id, material_order, quantity, unit)
SELECT (SELECT id FROM option_products WHERE option_code = 'hp4k14-013'),
       (SELECT id FROM raw_materials WHERE material_code = 'hp4k14'), 1, 0.65, 'kg';

INSERT INTO option_product_materials (option_id, material_id, material_order, quantity, unit)
SELECT (SELECT id FROM option_products WHERE option_code = 'hp4k14-013'),
       (SELECT id FROM raw_materials WHERE material_code = 'hp4k16'), 2, 0.65, 'kg';

INSERT INTO option_product_materials (option_id, material_id, material_order, quantity, unit)
SELECT (SELECT id FROM option_products WHERE option_code = 'hp4k12-013'),
       (SELECT id FROM raw_materials WHERE material_code = 'hp4k12'), 1, 1.3, 'kg';

-- 2kg 옵션들
INSERT INTO option_product_materials (option_id, material_id, material_order, quantity, unit)
SELECT (SELECT id FROM option_products WHERE option_code = 'hp4k20-02'),
       (SELECT id FROM raw_materials WHERE material_code = 'hp4k20'), 1, 2, 'kg';

INSERT INTO option_product_materials (option_id, material_id, material_order, quantity, unit)
SELECT (SELECT id FROM option_products WHERE option_code = 'hp4k18-02'),
       (SELECT id FROM raw_materials WHERE material_code = 'hp4k18'), 1, 2, 'kg';

INSERT INTO option_product_materials (option_id, material_id, material_order, quantity, unit)
SELECT (SELECT id FROM option_products WHERE option_code = 'hp4k16-02'),
       (SELECT id FROM raw_materials WHERE material_code = 'hp4k16'), 1, 2, 'kg';

INSERT INTO option_product_materials (option_id, material_id, material_order, quantity, unit)
SELECT (SELECT id FROM option_products WHERE option_code = 'hp4k14-02'),
       (SELECT id FROM raw_materials WHERE material_code = 'hp4k14'), 1, 2, 'kg';

INSERT INTO option_product_materials (option_id, material_id, material_order, quantity, unit)
SELECT (SELECT id FROM option_products WHERE option_code = 'hp4k12-02'),
       (SELECT id FROM raw_materials WHERE material_code = 'hp4k12'), 1, 2, 'kg';

-- 4kg 옵션들
INSERT INTO option_product_materials (option_id, material_id, material_order, quantity, unit)
SELECT (SELECT id FROM option_products WHERE option_code = 'hp4k24-04'),
       (SELECT id FROM raw_materials WHERE material_code = 'hp4k24'), 1, 4, 'kg';

INSERT INTO option_product_materials (option_id, material_id, material_order, quantity, unit)
SELECT (SELECT id FROM option_products WHERE option_code = 'hp4k22-04'),
       (SELECT id FROM raw_materials WHERE material_code = 'hp4k22'), 1, 4, 'kg';

INSERT INTO option_product_materials (option_id, material_id, material_order, quantity, unit)
SELECT (SELECT id FROM option_products WHERE option_code = 'hp4k20-04'),
       (SELECT id FROM raw_materials WHERE material_code = 'hp4k20'), 1, 4, 'kg';

INSERT INTO option_product_materials (option_id, material_id, material_order, quantity, unit)
SELECT (SELECT id FROM option_products WHERE option_code = 'hp4k18-04'),
       (SELECT id FROM raw_materials WHERE material_code = 'hp4k18'), 1, 4, 'kg';

-- ============================================
-- 완료
-- ============================================
SELECT '복숭아 옵션상품 데이터 임포트 완료' as status;
SELECT COUNT(*) as "옵션상품 수" FROM option_products;
SELECT COUNT(*) as "원물 매핑 수" FROM option_product_materials;
SELECT COUNT(*) as "원물 수" FROM raw_materials WHERE material_code LIKE 'hp4k%';
