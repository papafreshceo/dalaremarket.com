-- seller_feed_posts 테이블에 display_nickname 컬럼 추가
ALTER TABLE seller_feed_posts ADD COLUMN IF NOT EXISTS display_nickname VARCHAR(20);

-- 코멘트
COMMENT ON COLUMN seller_feed_posts.display_nickname IS '표시할 닉네임 (관리자가 선택한 닉네임, 우선 표시됨)';

-- seller_feed_comments 테이블에도 동일하게 추가
ALTER TABLE seller_feed_comments ADD COLUMN IF NOT EXISTS display_nickname VARCHAR(20);

COMMENT ON COLUMN seller_feed_comments.display_nickname IS '표시할 닉네임 (관리자가 선택한 닉네임, 우선 표시됨)';
