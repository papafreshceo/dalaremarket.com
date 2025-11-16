-- notification_broadcasts 테이블에 image_url 컬럼 추가
ALTER TABLE notification_broadcasts
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 인덱스 추가 (이미지가 있는 공지 조회 시 성능 향상)
CREATE INDEX IF NOT EXISTS idx_notification_broadcasts_image_url
ON notification_broadcasts(image_url)
WHERE image_url IS NOT NULL;

-- 기존 데이터 확인용 코멘트 추가
COMMENT ON COLUMN notification_broadcasts.image_url IS '푸시 알림에 포함되는 썸네일 이미지 URL (선택)';
