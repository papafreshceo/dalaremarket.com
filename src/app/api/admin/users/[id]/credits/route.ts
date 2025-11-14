import { createClientForRouteHandler } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { canUpdateServer } from '@/lib/permissions-server';

/**
 * POST /api/admin/users/[id]/credits
 * 관리자가 회원에게 크레딧을 지급
 */
export async function POST(
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
    const { credits, description } = await request.json();

    // 크레딧 값 검증
    if (!credits || typeof credits !== 'number' || credits <= 0) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 크레딧 값입니다.' },
        { status: 400 }
      );
    }

    // 크레딧 지급 함수 호출
    const { data: result, error } = await supabase.rpc('grant_credits', {
      p_user_id: userId,
      p_credits: credits,
      p_admin_id: adminUser.id,
      p_description: description || '관리자 지급'
    });

    if (error) {
      console.error('크레딧 지급 오류:', error);

      // 함수가 존재하지 않는 경우
      if (error.message?.includes('function') && error.message?.includes('does not exist')) {
        return NextResponse.json(
          { success: false, error: '데이터베이스 마이그레이션이 필요합니다. add_credit_grant_function.sql을 실행해주세요.' },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { success: false, error: `크레딧 지급에 실패했습니다: ${error.message}` },
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
      message: `${credits} 크레딧이 지급되었습니다.`,
      data: result
    });

  } catch (error: any) {
    console.error('POST /api/admin/users/[id]/credits 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
