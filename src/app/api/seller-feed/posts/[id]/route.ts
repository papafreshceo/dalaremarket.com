import { NextRequest, NextResponse } from 'next/server';
import { createClientForRouteHandler } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClientForRouteHandler();
    const postId = params.id;

    // 게시글 조회
    const { data: post, error } = await supabase
      .from('seller_feed_posts')
      .select(`
        *,
        users!seller_feed_posts_user_id_fkey (
          id,
          email,
          nickname
        ),
        seller_feed_tags (
          tag
        )
      `)
      .eq('id', postId)
      .eq('is_deleted', false)
      .single();

    if (error || !post) {
      return NextResponse.json(
        { success: false, error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 좋아요 수
    const { count: likesCount } = await supabase
      .from('seller_feed_post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post.id);

    // 댓글 수
    const { count: commentsCount } = await supabase
      .from('seller_feed_comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post.id)
      .eq('is_deleted', false);

    // 현재 사용자의 좋아요 여부
    const { data: { user } } = await supabase.auth.getUser();
    let isLiked = false;
    if (user) {
      const { data: likeData } = await supabase
        .from('seller_feed_post_likes')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .single();
      isLiked = !!likeData;
    }

    return NextResponse.json({
      success: true,
      post: {
        ...post,
        likes: likesCount || 0,
        commentsCount: commentsCount || 0,
        isLiked,
        tags: post.seller_feed_tags?.map((t: any) => t.tag) || [],
        author: post.display_nickname || post.users?.nickname || post.users?.email?.split('@')[0] || '익명',
        display_nickname: post.display_nickname || null,
      },
    });

  } catch (error: any) {
    console.error('게시글 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    const body = await request.json();
    const { title, content, category, tags, image_url, display_nickname } = body;

    // 게시글 소유자 확인
    const { data: existingPost, error: fetchError } = await supabase
      .from('seller_feed_posts')
      .select('user_id')
      .eq('id', postId)
      .eq('is_deleted', false)
      .single();

    if (fetchError || !existingPost) {
      return NextResponse.json(
        { success: false, error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (existingPost.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: '수정 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 게시글 수정
    const updateData: any = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (category) updateData.category = category;
    if (image_url !== undefined) updateData.image_url = image_url;
    if (display_nickname !== undefined) updateData.display_nickname = display_nickname;

    const { data: updatedPost, error: updateError } = await supabase
      .from('seller_feed_posts')
      .update(updateData)
      .eq('id', postId)
      .select()
      .single();

    if (updateError) {
      console.error('게시글 수정 오류:', updateError);
      return NextResponse.json(
        { success: false, error: '게시글 수정에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 태그 업데이트
    if (tags !== undefined) {
      // 기존 태그 삭제
      await supabase
        .from('seller_feed_tags')
        .delete()
        .eq('post_id', postId);

      // 새 태그 추가
      if (tags.length > 0) {
        const tagInserts = tags.map((tag: string) => ({
          post_id: parseInt(postId),
          tag: tag.trim(),
        }));

        await supabase
          .from('seller_feed_tags')
          .insert(tagInserts);
      }
    }

    return NextResponse.json({
      success: true,
      post: updatedPost,
    });

  } catch (error: any) {
    console.error('게시글 수정 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // 게시글 소유자 확인
    const { data: existingPost, error: fetchError } = await supabase
      .from('seller_feed_posts')
      .select('user_id')
      .eq('id', postId)
      .eq('is_deleted', false)
      .single();

    if (fetchError || !existingPost) {
      return NextResponse.json(
        { success: false, error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (existingPost.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: '삭제 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 소프트 삭제
    const { error: deleteError } = await supabase
      .from('seller_feed_posts')
      .update({ is_deleted: true })
      .eq('id', postId);

    if (deleteError) {
      console.error('게시글 삭제 오류:', deleteError);
      return NextResponse.json(
        { success: false, error: '게시글 삭제에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '게시글이 삭제되었습니다.',
    });

  } catch (error: any) {
    console.error('게시글 삭제 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  }
}
