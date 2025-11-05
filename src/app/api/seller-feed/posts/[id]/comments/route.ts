import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const postId = params.id;

    // 댓글 조회
    const { data: comments, error } = await supabase
      .from('seller_feed_comments')
      .select(`
        *,
        users!seller_feed_comments_user_id_fkey (
          id,
          email,
          nickname
        )
      `)
      .eq('post_id', postId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('댓글 조회 오류:', error);
      return NextResponse.json(
        { success: false, error: '댓글을 불러올 수 없습니다.' },
        { status: 500 }
      );
    }

    // 각 댓글의 좋아요 수 조회
    const commentsWithStats = await Promise.all(
      (comments || []).map(async (comment) => {
        const { count: likesCount } = await supabase
          .from('seller_feed_comment_likes')
          .select('*', { count: 'exact', head: true })
          .eq('comment_id', comment.id);

        // 현재 사용자의 좋아요 여부
        const { data: { user } } = await supabase.auth.getUser();
        let isLiked = false;
        if (user) {
          const { data: likeData } = await supabase
            .from('seller_feed_comment_likes')
            .select('id')
            .eq('comment_id', comment.id)
            .eq('user_id', user.id)
            .single();
          isLiked = !!likeData;
        }

        return {
          ...comment,
          likes: likesCount || 0,
          isLiked,
          author: comment.display_nickname || comment.users?.nickname || comment.users?.email?.split('@')[0] || '익명',
        };
      })
    );

    return NextResponse.json({
      success: true,
      comments: commentsWithStats,
    });

  } catch (error: any) {
    console.error('댓글 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  }
}

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

    const postId = params.id;
    const body = await request.json();
    const { content, parent_comment_id } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { success: false, error: '댓글 내용을 입력해주세요.' },
        { status: 400 }
      );
    }

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

    // 댓글 생성
    const { data: comment, error: commentError } = await supabase
      .from('seller_feed_comments')
      .insert({
        post_id: parseInt(postId),
        user_id: user.id,
        content: content.trim(),
        parent_comment_id: parent_comment_id || null,
      })
      .select(`
        *,
        users!seller_feed_comments_user_id_fkey (
          id,
          email,
          nickname
        )
      `)
      .single();

    if (commentError) {
      console.error('댓글 생성 오류:', commentError);
      return NextResponse.json(
        { success: false, error: '댓글 작성에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      comment: {
        ...comment,
        likes: 0,
        isLiked: false,
        author: comment.display_nickname || comment.users?.nickname || comment.users?.email?.split('@')[0] || '익명',
      },
    });

  } catch (error: any) {
    console.error('댓글 생성 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  }
}
