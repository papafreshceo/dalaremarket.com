import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 현재 사용자 정보를 한 번만 조회
    const { data: { user } } = await supabase.auth.getUser();

    let query = supabase
      .from('seller_feed_posts')
      .select(`
        *,
        users!seller_feed_posts_user_id_fkey (
          id,
          email,
          profile_name
        ),
        seller_feed_tags (
          tag
        )
      `)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    // 검색어가 있으면 제목 또는 내용으로 검색
    if (search && search.trim()) {
      const searchTerm = search.trim();

      // 태그로 검색된 게시글 ID 가져오기
      const { data: tagPosts } = await supabase
        .from('seller_feed_tags')
        .select('post_id')
        .ilike('tag', `%${searchTerm}%`);

      const tagPostIds = tagPosts?.map(t => t.post_id) || [];

      // 제목, 내용 또는 태그로 검색
      if (tagPostIds.length > 0) {
        query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%,id.in.(${tagPostIds.join(',')})`);
      } else {
        query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
      }
    }

    const { data: posts, error } = await query;

    if (error) {
      console.error('게시글 조회 오류:', error);
      return NextResponse.json(
        { success: false, error: '게시글을 불러올 수 없습니다.', details: error.message, code: error.code },
        { status: 500 }
      );
    }

    if (!posts || posts.length === 0) {
      return NextResponse.json({
        success: true,
        posts: [],
      });
    }

    // 모든 게시글 ID 수집
    const postIds = posts.map(p => p.id);

    // 병렬로 모든 통계 데이터 한 번에 조회
    const [likesData, commentsData, userLikesData] = await Promise.all([
      // 모든 게시글의 좋아요 수 한 번에 조회
      supabase
        .from('seller_feed_post_likes')
        .select('post_id')
        .in('post_id', postIds),

      // 모든 게시글의 댓글 수 한 번에 조회
      supabase
        .from('seller_feed_comments')
        .select('post_id')
        .in('post_id', postIds)
        .eq('is_deleted', false),

      // 현재 사용자가 좋아요한 게시글 한 번에 조회 (로그인한 경우만)
      user ? supabase
        .from('seller_feed_post_likes')
        .select('post_id')
        .in('post_id', postIds)
        .eq('user_id', user.id) : Promise.resolve({ data: [] })
    ]);

    // 좋아요 수를 post_id별로 그룹화
    const likesCountMap = new Map<number, number>();
    (likesData.data || []).forEach(like => {
      likesCountMap.set(like.post_id, (likesCountMap.get(like.post_id) || 0) + 1);
    });

    // 댓글 수를 post_id별로 그룹화
    const commentsCountMap = new Map<number, number>();
    (commentsData.data || []).forEach(comment => {
      commentsCountMap.set(comment.post_id, (commentsCountMap.get(comment.post_id) || 0) + 1);
    });

    // 사용자가 좋아요한 게시글 Set으로 변환
    const userLikedPostIds = new Set((userLikesData.data || []).map(like => like.post_id));

    // 통계 데이터를 각 게시글에 매핑
    const postsWithStats = posts.map(post => ({
      ...post,
      likes: likesCountMap.get(post.id) || 0,
      commentsCount: commentsCountMap.get(post.id) || 0,
      isLiked: userLikedPostIds.has(post.id),
      tags: post.seller_feed_tags?.map((t: any) => t.tag) || [],
      author: post.display_nickname || post.users?.profile_name || post.users?.email?.split('@')[0] || '익명',
      display_nickname: post.display_nickname || null,
    }));

    return NextResponse.json({
      success: true,
      posts: postsWithStats,
    });

  } catch (error: any) {
    console.error('게시글 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, content, category, tags, image_url, display_nickname } = body;

    // 유효성 검사
    if (!title || !content || !category) {
      return NextResponse.json(
        { success: false, error: '제목, 내용, 카테고리는 필수입니다.' },
        { status: 400 }
      );
    }

    if (!['discussion', 'info', 'qna', 'suggestion'].includes(category)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 카테고리입니다.' },
        { status: 400 }
      );
    }

    // 게시글 생성
    const { data: post, error: postError } = await supabase
      .from('seller_feed_posts')
      .insert({
        user_id: user.id,
        title,
        content,
        category,
        image_url: image_url || null,
        display_nickname: display_nickname || null,
      })
      .select()
      .single();

    if (postError) {
      console.error('게시글 생성 오류:', postError);
      return NextResponse.json(
        { success: false, error: '게시글 작성에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 태그 추가
    if (tags && tags.length > 0) {
      const tagInserts = tags.map((tag: string) => ({
        post_id: post.id,
        tag: tag.trim(),
      }));

      const { error: tagsError } = await supabase
        .from('seller_feed_tags')
        .insert(tagInserts);

      if (tagsError) {
        console.error('태그 생성 오류:', tagsError);
      }
    }

    return NextResponse.json({
      success: true,
      post: {
        ...post,
        tags: tags || [],
        likes: 0,
        commentsCount: 0,
        isLiked: false,
      },
    });

  } catch (error: any) {
    console.error('게시글 생성 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  }
}
