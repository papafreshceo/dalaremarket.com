import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { canUpdateServer } from '@/lib/permissions-server';

/**
 * POST /api/admin/users/credits/revoke
 * 관리자가 크레딧 지급을 회수
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

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

    const { historyId } = await request.json();

    // 내역 ID 검증
    if (!historyId) {
      return NextResponse.json(
        { success: false, error: '내역 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 크레딧 회수 함수 호출
    const { data: result, error } = await supabase.rpc('revoke_credits', {
      p_history_id: historyId,
      p_admin_id: adminUser.id
    });

    if (error) {
      console.error('크레딧 회수 오류:', error);

      // 함수가 존재하지 않는 경우
      if (error.message?.includes('function') && error.message?.includes('does not exist')) {
        return NextResponse.json(
          { success: false, error: '데이터베이스 마이그레이션이 필요합니다. add_credits_grant_function.sql을 실행해주세요.' },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { success: false, error: `크레딧 회수에 실패했습니다: ${error.message}` },
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
      message: `${result.credits_revoked.toLocaleString()}원이 회수되었습니다.`,
      data: result
    });

  } catch (error: any) {
    console.error('POST /api/admin/users/credits/revoke 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
