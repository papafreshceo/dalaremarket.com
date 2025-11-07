-- notices 테이블을 현재 시스템에 맞게 업데이트

-- 1. 필요한 컬럼 추가
ALTER TABLE public.notices
  ADD COLUMN IF NOT EXISTS is_popup BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT true;

-- 2. 기존 데이터 마이그레이션
-- is_important가 true인 것을 is_popup으로 복사
UPDATE public.notices
SET is_popup = is_important
WHERE is_important = true;

-- is_public을 published로 복사
UPDATE public.notices
SET published = is_public;

-- 3. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_notices_is_popup ON public.notices(is_popup) WHERE is_popup = true;
CREATE INDEX IF NOT EXISTS idx_notices_published ON public.notices(published) WHERE published = true;

-- 4. 기존 컬럼은 유지 (호환성을 위해)
-- is_important, is_public 컬럼은 삭제하지 않음

COMMENT ON COLUMN public.notices.is_popup IS '팝업으로 표시할 공지사항 여부';
COMMENT ON COLUMN public.notices.published IS '공개 여부';
