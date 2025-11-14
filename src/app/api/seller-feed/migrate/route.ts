import { NextRequest, NextResponse } from 'next/server';
import { createClientForRouteHandler } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClientForRouteHandler();

    // 관리자 권한 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // seller_feed_posts 테이블 생성
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS seller_feed_posts (
          id SERIAL PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          category VARCHAR(20) NOT NULL CHECK (category IN ('question', 'tip', 'market', 'discussion')),
          title VARCHAR(200) NOT NULL,
          content TEXT NOT NULL,
          image_url TEXT,
          views INTEGER DEFAULT 0,
          is_deleted BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `
    });

    // seller_feed_tags 테이블 생성
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS seller_feed_tags (
          id SERIAL PRIMARY KEY,
          post_id INTEGER NOT NULL REFERENCES seller_feed_posts(id) ON DELETE CASCADE,
          tag VARCHAR(50) NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `
    });

    // seller_feed_comments 테이블 생성
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS seller_feed_comments (
          id SERIAL PRIMARY KEY,
          post_id INTEGER NOT NULL REFERENCES seller_feed_posts(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          parent_comment_id INTEGER REFERENCES seller_feed_comments(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          is_deleted BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `
    });

    // seller_feed_post_likes 테이블 생성
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS seller_feed_post_likes (
          id SERIAL PRIMARY KEY,
          post_id INTEGER NOT NULL REFERENCES seller_feed_posts(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(post_id, user_id)
        );
      `
    });

    // seller_feed_comment_likes 테이블 생성
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS seller_feed_comment_likes (
          id SERIAL PRIMARY KEY,
          comment_id INTEGER NOT NULL REFERENCES seller_feed_comments(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(comment_id, user_id)
        );
      `
    });

    // 인덱스 생성
    await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });

    return NextResponse.json({
      success: true,
      message: '셀러피드 테이블이 성공적으로 생성되었습니다.',
      tables: [
        'seller_feed_posts',
        'seller_feed_tags',
        'seller_feed_comments',
        'seller_feed_post_likes',
        'seller_feed_comment_likes'
      ]
    });

  } catch (error: any) {
    console.error('셀러피드 마이그레이션 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '마이그레이션 중 오류가 발생했습니다.',
        details: error.message
      },
      { status: 500 }
    );
  }
}
