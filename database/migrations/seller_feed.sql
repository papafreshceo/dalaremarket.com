-- 셀러피드 게시글 테이블
CREATE TABLE IF NOT EXISTS seller_feed_posts (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(20) NOT NULL CHECK (category IN ('discussion', 'info', 'qna', 'suggestion')),
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  views INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 셀러피드 게시글 태그 테이블
CREATE TABLE IF NOT EXISTS seller_feed_tags (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES seller_feed_posts(id) ON DELETE CASCADE,
  tag VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 셀러피드 댓글 테이블
CREATE TABLE IF NOT EXISTS seller_feed_comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES seller_feed_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_comment_id INTEGER REFERENCES seller_feed_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 셀러피드 게시글 좋아요 테이블
CREATE TABLE IF NOT EXISTS seller_feed_post_likes (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES seller_feed_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- 셀러피드 댓글 좋아요 테이블
CREATE TABLE IF NOT EXISTS seller_feed_comment_likes (
  id SERIAL PRIMARY KEY,
  comment_id INTEGER NOT NULL REFERENCES seller_feed_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_seller_feed_posts_user_id ON seller_feed_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_feed_posts_category ON seller_feed_posts(category);
CREATE INDEX IF NOT EXISTS idx_seller_feed_posts_created_at ON seller_feed_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_seller_feed_tags_post_id ON seller_feed_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_seller_feed_tags_tag ON seller_feed_tags(tag);
CREATE INDEX IF NOT EXISTS idx_seller_feed_comments_post_id ON seller_feed_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_seller_feed_comments_user_id ON seller_feed_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_feed_comments_parent_id ON seller_feed_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_seller_feed_post_likes_post_id ON seller_feed_post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_seller_feed_post_likes_user_id ON seller_feed_post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_feed_comment_likes_comment_id ON seller_feed_comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_seller_feed_comment_likes_user_id ON seller_feed_comment_likes(user_id);

-- 조회수 증가 함수
CREATE OR REPLACE FUNCTION increment_post_views(p_post_id INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE seller_feed_posts
  SET views = views + 1
  WHERE id = p_post_id;
END;
$$ LANGUAGE plpgsql;

-- 게시글 좋아요 수 조회 함수
CREATE OR REPLACE FUNCTION get_post_likes_count(p_post_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM seller_feed_post_likes
  WHERE post_id = p_post_id;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- 댓글 좋아요 수 조회 함수
CREATE OR REPLACE FUNCTION get_comment_likes_count(p_comment_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM seller_feed_comment_likes
  WHERE comment_id = p_comment_id;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- 게시글별 댓글 수 조회 함수
CREATE OR REPLACE FUNCTION get_post_comments_count(p_post_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM seller_feed_comments
  WHERE post_id = p_post_id AND is_deleted = FALSE;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_seller_feed_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_seller_feed_posts_updated_at
  BEFORE UPDATE ON seller_feed_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_seller_feed_updated_at();

CREATE TRIGGER trigger_seller_feed_comments_updated_at
  BEFORE UPDATE ON seller_feed_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_seller_feed_updated_at();

-- 샘플 데이터 삽입 (테스트용)
-- 주의: 실제 user_id는 users 테이블의 실제 UUID로 교체해야 함
/*
INSERT INTO seller_feed_posts (user_id, category, title, content, views) VALUES
(
  (SELECT id FROM users LIMIT 1),
  'discussion',
  '새로운 판매 채널 추천 부탁드립니다',
  '스마트스토어 외에 다른 판매 채널을 알아보고 있는데, 어디가 좋을까요? 경험 공유 부탁드립니다!',
  234
),
(
  (SELECT id FROM users LIMIT 1),
  'info',
  '상품 사진 잘 찍는 꿀팁',
  '자연광을 활용하고 배경을 깔끔하게 하면 상품 사진이 훨씬 예쁘게 나옵니다. 제가 사용하는 방법을 공유합니다.',
  567
),
(
  (SELECT id FROM users LIMIT 1),
  'qna',
  '정산 주기가 어떻게 되나요?',
  '이번에 처음 입점했는데 정산이 언제 되는지 궁금합니다. 자세한 설명 부탁드려요!',
  423
),
(
  (SELECT id FROM users LIMIT 1),
  'suggestion',
  '배송비 정책 개선 건의',
  '무료배송 기준을 조금 낮춰주시면 좋을 것 같습니다. 다른 분들 의견은 어떠신가요?',
  892
);

-- 태그 삽입
INSERT INTO seller_feed_tags (post_id, tag) VALUES
(1, '판매채널'),
(1, '마케팅'),
(1, '경험공유'),
(2, '상품사진'),
(2, '촬영팁'),
(2, '노하우'),
(3, '정산'),
(3, '입점'),
(3, '질문'),
(4, '배송비'),
(4, '정책'),
(4, '건의');
*/
