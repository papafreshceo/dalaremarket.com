import { createClientForRouteHandler } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-security';
import { getOrganizationDataFilter } from '@/lib/organization-utils';

/**
 * GET /api/settlements
 * 정산 내역 조회 (월별/기간별)
 * Security: 인증 필요, 조직 필터 적용
 */
export async function GET(request: NextRequest) {
  try {
    // 🔒 보안: 로그인한 사용자만 조회 가능
    const auth = await requireAuth(request);
    if (!auth.authorized) return auth.error;

    const supabase = await createClientForRouteHandler();
    const searchParams = request.nextUrl.searchParams;

    // 쿼리 파라미터
    const organizationId = searchParams.get('organizationId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const groupBy = searchParams.get('groupBy') || 'day'; // 'day' | 'month'

    let query = supabase.from('settlements').select('*');

    // 🔒 조직 필터: 관리자가 아니면 자신의 조직만 조회
    if (auth.user.role !== 'super_admin' && auth.user.role !== 'admin' && auth.user.role !== 'employee') {
      const userOrgId = await getOrganizationDataFilter(auth.user.id);
      if (userOrgId) {
        query = query.eq('organization_id', userOrgId);
      } else {
        // 조직이 없으면 빈 결과 반환
        return NextResponse.json({
          success: true,
          data: [],
          summary: null
        });
      }
    } else if (organizationId) {
      // 관리자가 특정 조직 지정
      query = query.eq('organization_id', organizationId);
    }

    // 날짜 필터
    if (startDate && endDate) {
      query = query.gte('settlement_date', startDate).lte('settlement_date', endDate);
    } else if (year && month) {
      query = query.eq('settlement_year', parseInt(year)).eq('settlement_month', parseInt(month));
    } else if (year) {
      query = query.eq('settlement_year', parseInt(year));
    }

    // 정렬
    query = query.order('settlement_date', { ascending: false });

    const { data, error } = await query;

    if (error) {
      logger.error('정산 내역 조회 실패:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // 집계 통계 계산
    const summary = data && data.length > 0 ? {
      totalConfirmedAmount: data.reduce((sum, s) => sum + (parseFloat(s.confirmed_amount as any) || 0), 0),
      totalCancelAmount: data.reduce((sum, s) => sum + (parseFloat(s.cancel_amount as any) || 0), 0),
      totalShippedAmount: data.reduce((sum, s) => sum + (parseFloat(s.shipped_amount as any) || 0), 0),
      totalRefundAmount: data.reduce((sum, s) => sum + (parseFloat(s.refund_amount as any) || 0), 0),
      totalNetAmount: data.reduce((sum, s) => sum + (parseFloat(s.net_amount as any) || 0), 0),
      totalConfirmedCount: data.reduce((sum, s) => sum + (s.confirmed_count || 0), 0),
      totalCancelCount: data.reduce((sum, s) => sum + (s.cancel_count || 0), 0),
      totalShippedCount: data.reduce((sum, s) => sum + (s.shipped_count || 0), 0),
      totalRefundCount: data.reduce((sum, s) => sum + (s.refund_count || 0), 0),
      settlementDays: data.length
    } : null;

    // 월별 그룹핑 (groupBy === 'month')
    if (groupBy === 'month' && data && data.length > 0) {
      const monthlyMap = new Map<string, any>();

      data.forEach(settlement => {
        const key = `${settlement.settlement_year}-${String(settlement.settlement_month).padStart(2, '0')}`;

        if (!monthlyMap.has(key)) {
          monthlyMap.set(key, {
            year: settlement.settlement_year,
            month: settlement.settlement_month,
            yearMonth: key,
            confirmedAmount: 0,
            cancelAmount: 0,
            shippedAmount: 0,
            refundAmount: 0,
            netAmount: 0,
            confirmedCount: 0,
            cancelCount: 0,
            shippedCount: 0,
            refundCount: 0,
            settlementDays: 0,
            dailyData: []
          });
        }

        const monthData = monthlyMap.get(key);
        monthData.confirmedAmount += parseFloat(settlement.confirmed_amount as any) || 0;
        monthData.cancelAmount += parseFloat(settlement.cancel_amount as any) || 0;
        monthData.shippedAmount += parseFloat(settlement.shipped_amount as any) || 0;
        monthData.refundAmount += parseFloat(settlement.refund_amount as any) || 0;
        monthData.netAmount += parseFloat(settlement.net_amount as any) || 0;
        monthData.confirmedCount += settlement.confirmed_count || 0;
        monthData.cancelCount += settlement.cancel_count || 0;
        monthData.shippedCount += settlement.shipped_count || 0;
        monthData.refundCount += settlement.refund_count || 0;
        monthData.settlementDays += 1;
        monthData.dailyData.push(settlement);
      });

      const monthlyData = Array.from(monthlyMap.values()).sort((a, b) => b.yearMonth.localeCompare(a.yearMonth));

      return NextResponse.json({
        success: true,
        data: monthlyData,
        summary
      });
    }

    return NextResponse.json({
      success: true,
      data,
      summary
    });
  } catch (error: any) {
    logger.error('GET /api/settlements 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
