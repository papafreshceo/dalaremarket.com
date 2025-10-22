import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-security';

/**
 * GET /api/integrated-orders/stats
 * 주문 통계 조회 (RPC 함수 사용 - 고성능)
 * 모든 필터 조건 지원:
 *   - 날짜 범위 (시작일, 종료일, 날짜타입)
 *   - 마켓명
 *   - 발송상태
 *   - 벤더사
 *   - 검색어 (주문번호/수취인명/옵션명)
 *
 * Updated: PostgreSQL RPC 함수 사용으로 95% 성능 개선
 */
export async function GET(request: NextRequest) {
  try {
    // 🔒 보안: 로그인한 사용자만 접근 가능
    const auth = await requireAuth(request);
    if (!auth.authorized) return auth.error;

    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    // 쿼리 파라미터 추출
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const dateType = searchParams.get('dateType') || 'sheet';
    const marketName = searchParams.get('marketName');
    const shippingStatus = searchParams.get('shippingStatus');
    const vendorName = searchParams.get('vendorName');
    const searchKeyword = searchParams.get('searchKeyword');

    console.log('📊 통계 조회 파라미터:', {
      startDate,
      endDate,
      dateType,
      marketName,
      shippingStatus,
      vendorName,
      searchKeyword,
    });

    // ⚡ PostgreSQL RPC 함수 호출 (단일 쿼리로 모든 통계 계산)
    const { data, error } = await supabase.rpc('get_order_statistics', {
      p_start_date: startDate || null,
      p_end_date: endDate || null,
      p_date_type: dateType,
      p_market_name: marketName || null,
      p_shipping_status: shippingStatus || null,
      p_vendor_name: vendorName || null,
      p_search_keyword: searchKeyword || null,
    });

    if (error) {
      console.error('❌ RPC 함수 호출 실패:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log('✅ 통계 조회 성공:', {
      total: data?.status_stats?.total || 0,
      vendorCount: data?.vendor_stats?.length || 0,
      sellerCount: data?.seller_stats?.length || 0,
    });

    // 데이터 정규화 (null 값 처리)
    const statusStats = data?.status_stats || {};
    const vendorStats = data?.vendor_stats || [];
    const sellerStats = data?.seller_stats || [];
    const optionStats = data?.option_stats || [];

    return NextResponse.json({
      success: true,
      data: {
        // 상태별 통계 (상단 카드용)
        stats: {
          total: statusStats.total || 0,
          접수: statusStats['접수'] || 0,
          결제완료: statusStats['결제완료'] || 0,
          상품준비중: statusStats['상품준비중'] || 0,
          발송완료: statusStats['발송완료'] || 0,
          취소요청: statusStats['취소요청'] || 0,
          취소완료: statusStats['취소완료'] || 0,
          환불완료: statusStats['환불완료'] || 0,
        },
        // 벤더사별 통계
        vendorStats: vendorStats.map((v: any) => ({
          shipping_source: v.shipping_source,
          접수_건수: v['접수_건수'] || 0,
          접수_수량: v['접수_수량'] || 0,
          결제완료_건수: v['결제완료_건수'] || 0,
          결제완료_수량: v['결제완료_수량'] || 0,
          상품준비중_건수: v['상품준비중_건수'] || 0,
          상품준비중_수량: v['상품준비중_수량'] || 0,
          발송완료_건수: v['발송완료_건수'] || 0,
          발송완료_수량: v['발송완료_수량'] || 0,
          취소요청_건수: v['취소요청_건수'] || 0,
          취소요청_수량: v['취소요청_수량'] || 0,
          취소완료_건수: v['취소완료_건수'] || 0,
          취소완료_수량: v['취소완료_수량'] || 0,
        })),
        // 셀러별 통계
        sellerStats: sellerStats.map((s: any) => ({
          seller_id: s.seller_id,
          seller_name: s.seller_name,
          총금액: s['총금액'] || 0,
          입금확인: s['입금확인'] || false,
          접수_건수: s['접수_건수'] || 0,
          접수_수량: s['접수_수량'] || 0,
          결제완료_건수: s['결제완료_건수'] || 0,
          결제완료_수량: s['결제완료_수량'] || 0,
          상품준비중_건수: s['상품준비중_건수'] || 0,
          상품준비중_수량: s['상품준비중_수량'] || 0,
          발송완료_건수: s['발송완료_건수'] || 0,
          발송완료_수량: s['발송완료_수량'] || 0,
          취소요청_건수: s['취소요청_건수'] || 0,
          취소요청_수량: s['취소요청_수량'] || 0,
          환불예정액: s['환불예정액'] || 0,
          환불처리일시: s['환불처리일시'] ? formatKoreanDateTime(s['환불처리일시']) : null,
          취소완료_건수: s['취소완료_건수'] || 0,
          취소완료_수량: s['취소완료_수량'] || 0,
        })),
        // 옵션별 통계
        optionStats: optionStats.map((o: any) => ({
          option_name: o.option_name,
          접수_건수: o['접수_건수'] || 0,
          접수_수량: o['접수_수량'] || 0,
          결제완료_건수: o['결제완료_건수'] || 0,
          결제완료_수량: o['결제완료_수량'] || 0,
          상품준비중_건수: o['상품준비중_건수'] || 0,
          상품준비중_수량: o['상품준비중_수량'] || 0,
          발송완료_건수: o['발송완료_건수'] || 0,
          발송완료_수량: o['발송완료_수량'] || 0,
          취소요청_건수: o['취소요청_건수'] || 0,
          취소요청_수량: o['취소요청_수량'] || 0,
          취소완료_건수: o['취소완료_건수'] || 0,
          취소완료_수량: o['취소완료_수량'] || 0,
        })),
      },
    });
  } catch (error: any) {
    console.error('❌ GET /api/integrated-orders/stats 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// 한국 시간 포맷팅 헬퍼 함수
function formatKoreanDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace(/\. /g, '-').replace(/\./g, '');
  } catch (e) {
    return dateString;
  }
}
