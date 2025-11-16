import { NextRequest, NextResponse } from 'next/server';
import { createClientForRouteHandler } from '@/lib/supabase/server';
import logger from '@/lib/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClientForRouteHandler();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const postId = params.id;

    // 게시글 존재 확인
    const { data: post, error: postError } = await supabase
      .from('seller_feed_posts')
      .select('id')
      .eq('id', postId)
      .eq('is_deleted', false)
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { success: false, error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 이미 좋아요 했는지 확인
    const { data: existingLike } = await supabase
      .from('seller_feed_post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single();

    if (existingLike) {
      // 좋아요 취소
      const { error: deleteError } = await supabase
        .from('seller_feed_post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      if (deleteError) {
        logger.error('좋아요 취소 오류:', deleteError);
        return NextResponse.json(
          { success: false, error: '좋아요 취소에 실패했습니다.' },
          { status: 500 }
        );
      }

      // 현재 좋아요 수 조회
      const { count: likesCount } = await supabase
        .from('seller_feed_post_likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

      return NextResponse.json({
        success: true,
        isLiked: false,
        likes: likesCount || 0,
      });
    } else {
      // 좋아요 추가
      const { error: insertError } = await supabase
        .from('seller_feed_post_likes')
        .insert({
          post_id: parseInt(postId),
          user_id: user.id,
        });

      if (insertError) {
        logger.error('좋아요 추가 오류:', insertError);
        return NextResponse.json(
          { success: false, error: '좋아요에 실패했습니다.' },
          { status: 500 }
        );
      }

      // 현재 좋아요 수 조회
      const { count: likesCount } = await supabase
        .from('seller_feed_post_likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

      return NextResponse.json({
        success: true,
        isLiked: true,
        likes: likesCount || 0,
      });
    }

  } catch (error: any) {
    logger.error('좋아요 처리 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  }
}
