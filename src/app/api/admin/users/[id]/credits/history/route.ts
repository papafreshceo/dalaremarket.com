import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { canReadServer } from '@/lib/permissions-server';

/**
 * GET /api/admin/users/[id]/credits/history
 * 회원의 크레딧 지급/회수 내역 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const hasPermission = await canReadServer(adminUser.id, '/admin/members');

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: '회원 관리 조회 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    const { id: userId } = await params;

    // 크레딧 내역 조회 (최근 순으로)
    const { data: history, error } = await supabase
      .from('organization_credits_history')
      .select(`
        *,
        admin:admin_id(email)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('크레딧 내역 조회 오류:', error);
      return NextResponse.json(
        { success: false, error: `크레딧 내역 조회에 실패했습니다: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      history: history || []
    });

  } catch (error: any) {
    console.error('GET /api/admin/users/[id]/credits/history 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
