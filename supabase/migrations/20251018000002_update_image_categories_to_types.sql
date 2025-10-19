-- 기존 카테고리를 이미지 유형으로 변경
-- '카테고리'라는 용어가 품목 카테고리와 혼동되므로 '이미지 유형'으로 명확히 구분

-- 기존 데이터 삭제
DELETE FROM image_categories;

-- 이미지 유형 데이터 삽입 (아이콘 없이 텍스트만 저장)
INSERT INTO image_categories (name, description, icon, display_order) VALUES
  ('품목이미지', '품목 관련 이미지', '', 1),
  ('옵션이미지', '옵션상품 관련 이미지', '', 2),
  ('라벨/스티커', '라벨, 스티커, 태그 이미지', '', 3),
  ('배너/로고', '배너, 로고, 브랜딩 이미지', '', 4),
  ('상세페이지', '상세페이지 구성 이미지', '', 5),
  ('공지사항', '공지사항용 이미지', '', 6),
  ('기타', '기타 이미지', '', 7)
ON CONFLICT (name) DO NOTHING;

-- 테이블 주석 업데이트
COMMENT ON TABLE image_categories IS '이미지 유형 분류 (상품/패키징/배너 등 용도별 분류)';
COMMENT ON COLUMN image_categories.name IS '이미지 유형명 (예: 상품 메인 이미지, 배너/로고)';
