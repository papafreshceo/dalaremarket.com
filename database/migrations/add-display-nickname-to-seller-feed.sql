-- seller_feed_posts 테이블에 display_nickname 컬럼 추가
ALTER TABLE seller_feed_posts
ADD COLUMN IF NOT EXISTS display_nickname VARCHAR(20);

-- seller_feed_comments 테이블에 display_nickname 컬럼 추가
ALTER TABLE seller_feed_comments
ADD COLUMN IF NOT EXISTS display_nickname VARCHAR(20);

-- 코멘트
COMMENT ON COLUMN seller_feed_posts.display_nickname IS '표시될 닉네임 (관리자가 직접 입력하거나 선택)';
COMMENT ON COLUMN seller_feed_comments.display_nickname IS '표시될 닉네임 (관리자가 직접 입력하거나 선택)';
