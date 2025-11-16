import { createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-security';

/**
 * GET /api/admin/organizations/[id]/cash/history
 * 조직의 캐시 지급/회수 내역 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 관리자 권한 확인
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.error;

    const { id: organizationId } = await params;
    const adminClient = createAdminClient();

    // 캐시 히스토리 조회 (최신순)
    const { data: history, error } = await adminClient
      .from('organization_cash_history')
      .select(`
        *,
        admin:users!admin_id(name, email)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      logger.error('캐시 히스토리 조회 오류:', error);
      return NextResponse.json(
        { success: false, error: '히스토리 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      history: history || []
    });

  } catch (error: any) {
    logger.error('GET /api/admin/organizations/[id]/cash/history 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
