import { NextRequest, NextResponse } from 'next/server';
import { createClientForRouteHandler } from '@/lib/supabase/server';
import logger from '@/lib/logger';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClientForRouteHandler();
    const { id } = await params;

    // 관리자 권한 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { nickname, description, is_active } = body;

    const updateData: any = {};
    if (nickname !== undefined) updateData.nickname = nickname.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (is_active !== undefined) updateData.is_active = is_active;

    // 닉네임 변경 시 중복 체크
    if (nickname) {
      const { data: existingNickname } = await supabase
        .from('admin_nicknames')
        .select('id')
        .eq('nickname', nickname.trim())
        .neq('id', id)
        .single();

      if (existingNickname) {
        return NextResponse.json(
          { success: false, error: '이미 사용 중인 닉네임입니다.' },
          { status: 400 }
        );
      }
    }

    const { data: updatedNickname, error } = await supabase
      .from('admin_nicknames')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('관리자 닉네임 수정 오류:', error);
      return NextResponse.json(
        { success: false, error: '수정에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      nickname: updatedNickname,
    });

  } catch (error: any) {
    logger.error('관리자 닉네임 수정 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClientForRouteHandler();
    const { id } = await params;

    // 관리자 권한 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { error } = await supabase
      .from('admin_nicknames')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('관리자 닉네임 삭제 오류:', error);
      return NextResponse.json(
        { success: false, error: '삭제에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '관리자 닉네임이 삭제되었습니다.',
    });

  } catch (error: any) {
    logger.error('관리자 닉네임 삭제 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  }
}
