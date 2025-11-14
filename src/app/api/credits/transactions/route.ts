import { NextRequest, NextResponse } from 'next/server';
import { createClientForRouteHandler } from '@/lib/supabase/server';

/**
 * GET /api/credits/transactions
 * 사용자의 크레딧 거래 이력 조회
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClientForRouteHandler();

    // 현재 로그인한 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 사용자의 primary organization 조회
    const { getUserPrimaryOrganization } = await import('@/lib/organization-utils');
    const organization = await getUserPrimaryOrganization(user.id);

    if (!organization) {
      return NextResponse.json(
        { success: false, error: '조직 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // URL 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 거래 이력 조회
    const { data: transactions, error: transactionsError, count } = await supabase
      .from('organization_credit_transactions')
      .select('*', { count: 'exact' })
      .eq('organization_id', organization.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (transactionsError) {
      console.error('[GET /api/credits/transactions] 이력 조회 오류:', transactionsError);
      return NextResponse.json(
        { success: false, error: '거래 이력을 조회할 수 없습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      transactions: transactions || [],
      total: count || 0,
      limit,
      offset
    });

  } catch (error: any) {
    console.error('[GET /api/credits/transactions] 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
