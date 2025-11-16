import { createClientForRouteHandler } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireStaff } from '@/lib/api-security';

/**
 * POST /api/settlements/upsert
 * 정산 레코드 생성/업데이트 (입금확인 시 자동 호출)
 * Security: 직원 이상 권한 필요
 */
export async function POST(request: NextRequest) {
  try {
    // 🔒 보안: 직원 이상 접근 가능
    const auth = await requireStaff(request);
    if (!auth.authorized) return auth.error;

    const supabase = await createClientForRouteHandler();
    const { organizationId, settlementDate } = await request.json();

    if (!organizationId || !settlementDate) {
      return NextResponse.json(
        { success: false, error: 'organizationId와 settlementDate가 필요합니다.' },
        { status: 400 }
      );
    }

    // PostgreSQL 함수 호출: upsert_settlement
    const { data, error } = await supabase.rpc('upsert_settlement', {
      p_organization_id: organizationId,
      p_settlement_date: settlementDate,
      p_confirmed_by: auth.user.id
    });

    if (error) {
      logger.error('정산 레코드 생성 실패:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      settlementId: data,
      message: '정산 레코드가 생성/업데이트되었습니다.'
    });
  } catch (error: any) {
    logger.error('POST /api/settlements/upsert 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
