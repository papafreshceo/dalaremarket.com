import { createClientForRouteHandler } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { canUpdateServer } from '@/lib/permissions-server';

/**
 * PUT /api/admin/users/[id]/tier
 * 관리자가 사용자 등급을 수동으로 설정
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClientForRouteHandler();

    // 관리자 권한 확인
    const { data: { user: adminUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !adminUser) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 권한 시스템을 통한 권한 체크
    const hasPermission = await canUpdateServer(adminUser.id, '/admin/members');

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: '회원 관리 수정 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    const { id: userId } = await params;
    const { tier } = await request.json();

    // tier 값 검증 (대문자로 통일)
    const validTiers = ['LIGHT', 'STANDARD', 'ADVANCE', 'ELITE', 'LEGEND', null];
    const upperTier = tier ? tier.toUpperCase() : null;

    if (!validTiers.includes(upperTier)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 등급입니다.' },
        { status: 400 }
      );
    }

    // 수동 등급 설정 함수 호출
    const { data: result, error } = await supabase.rpc('set_manual_tier', {
      p_user_id: userId,
      p_tier: upperTier,
      p_admin_id: adminUser.id
    });

    if (error) {
      console.error('수동 등급 설정 오류:', error);

      // 함수가 존재하지 않는 경우
      if (error.message?.includes('function') && error.message?.includes('does not exist')) {
        return NextResponse.json(
          { success: false, error: '데이터베이스 마이그레이션이 필요합니다. add_manual_tier_management.sql을 실행해주세요.' },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { success: false, error: `등급 설정에 실패했습니다: ${error.message}` },
        { status: 500 }
      );
    }

    if (result && !result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: upperTier ? '등급이 수동으로 설정되었습니다.' : '자동 등급 계산으로 전환되었습니다.',
      data: result
    });

  } catch (error: any) {
    console.error('PUT /api/admin/users/[id]/tier 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[id]/tier
 * 수동 등급 해제 (자동 계산으로 복귀)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClientForRouteHandler();

    // 관리자 권한 확인
    const { data: { user: adminUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !adminUser) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 권한 시스템을 통한 권한 체크
    const hasPermission = await canUpdateServer(adminUser.id, '/admin/members');

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: '회원 관리 수정 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    const { id: userId } = await params;

    // 수동 등급 해제 함수 호출
    const { data: result, error } = await supabase.rpc('remove_manual_tier', {
      p_user_id: userId
    });

    if (error) {
      console.error('수동 등급 해제 오류:', error);
      return NextResponse.json(
        { success: false, error: '등급 해제에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '자동 등급 계산으로 전환되었습니다.',
      data: result
    });

  } catch (error: any) {
    console.error('DELETE /api/admin/users/[id]/tier 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
