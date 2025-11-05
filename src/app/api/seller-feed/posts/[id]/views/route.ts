import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const postId = params.id;

    // 게시글 존재 확인
    const { data: post, error: postError } = await supabase
      .from('seller_feed_posts')
      .select('id, views')
      .eq('id', postId)
      .eq('is_deleted', false)
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { success: false, error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 조회수 증가
    const { data: updatedPost, error: updateError } = await supabase
      .from('seller_feed_posts')
      .update({ views: (post.views || 0) + 1 })
      .eq('id', postId)
      .select('views')
      .single();

    if (updateError) {
      console.error('조회수 증가 오류:', updateError);
      return NextResponse.json(
        { success: false, error: '조회수 증가에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      views: updatedPost.views,
    });

  } catch (error: any) {
    console.error('조회수 증가 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  }
}
