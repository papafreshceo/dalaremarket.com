import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const commentId = params.id;

    // 댓글 존재 확인
    const { data: comment, error: commentError } = await supabase
      .from('seller_feed_comments')
      .select('id')
      .eq('id', commentId)
      .eq('is_deleted', false)
      .single();

    if (commentError || !comment) {
      return NextResponse.json(
        { success: false, error: '댓글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 이미 좋아요 했는지 확인
    const { data: existingLike } = await supabase
      .from('seller_feed_comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', user.id)
      .single();

    if (existingLike) {
      // 좋아요 취소
      const { error: deleteError } = await supabase
        .from('seller_feed_comment_likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('좋아요 취소 오류:', deleteError);
        return NextResponse.json(
          { success: false, error: '좋아요 취소에 실패했습니다.' },
          { status: 500 }
        );
      }

      // 현재 좋아요 수 조회
      const { count: likesCount } = await supabase
        .from('seller_feed_comment_likes')
        .select('*', { count: 'exact', head: true })
        .eq('comment_id', commentId);

      return NextResponse.json({
        success: true,
        isLiked: false,
        likes: likesCount || 0,
      });
    } else {
      // 좋아요 추가
      const { error: insertError } = await supabase
        .from('seller_feed_comment_likes')
        .insert({
          comment_id: parseInt(commentId),
          user_id: user.id,
        });

      if (insertError) {
        console.error('좋아요 추가 오류:', insertError);
        return NextResponse.json(
          { success: false, error: '좋아요에 실패했습니다.' },
          { status: 500 }
        );
      }

      // 현재 좋아요 수 조회
      const { count: likesCount } = await supabase
        .from('seller_feed_comment_likes')
        .select('*', { count: 'exact', head: true })
        .eq('comment_id', commentId);

      return NextResponse.json({
        success: true,
        isLiked: true,
        likes: likesCount || 0,
      });
    }

  } catch (error: any) {
    console.error('댓글 좋아요 처리 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  }
}
