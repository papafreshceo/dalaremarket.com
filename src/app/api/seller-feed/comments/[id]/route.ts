import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(
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
    const body = await request.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { success: false, error: '댓글 내용을 입력해주세요.' },
        { status: 400 }
      );
    }

    // 댓글 소유자 확인
    const { data: existingComment, error: fetchError } = await supabase
      .from('seller_feed_comments')
      .select('user_id')
      .eq('id', commentId)
      .eq('is_deleted', false)
      .single();

    if (fetchError || !existingComment) {
      return NextResponse.json(
        { success: false, error: '댓글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (existingComment.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: '수정 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 댓글 수정
    const { data: updatedComment, error: updateError } = await supabase
      .from('seller_feed_comments')
      .update({ content: content.trim() })
      .eq('id', commentId)
      .select()
      .single();

    if (updateError) {
      console.error('댓글 수정 오류:', updateError);
      return NextResponse.json(
        { success: false, error: '댓글 수정에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      comment: updatedComment,
    });

  } catch (error: any) {
    console.error('댓글 수정 오류:', error);
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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const commentId = params.id;

    // 댓글 소유자 확인
    const { data: existingComment, error: fetchError } = await supabase
      .from('seller_feed_comments')
      .select('user_id')
      .eq('id', commentId)
      .eq('is_deleted', false)
      .single();

    if (fetchError || !existingComment) {
      return NextResponse.json(
        { success: false, error: '댓글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (existingComment.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: '삭제 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 소프트 삭제
    const { error: deleteError } = await supabase
      .from('seller_feed_comments')
      .update({ is_deleted: true })
      .eq('id', commentId);

    if (deleteError) {
      console.error('댓글 삭제 오류:', deleteError);
      return NextResponse.json(
        { success: false, error: '댓글 삭제에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '댓글이 삭제되었습니다.',
    });

  } catch (error: any) {
    console.error('댓글 삭제 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  }
}
