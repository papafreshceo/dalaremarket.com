import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/integrated-orders/stats
 * 주문 통계 조회 (발송상태별, 벤더사별, 마켓별)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const dateType = searchParams.get('dateType') || 'sheet';

    // 발송상태별 통계
    let shippingStatusQuery = supabase
      .from('integrated_orders')
      .select('shipping_status', { count: 'exact' });

    if (startDate && endDate) {
      const dateColumn = dateType === 'payment' ? 'payment_date' : 'sheet_date';
      shippingStatusQuery = shippingStatusQuery
        .gte(dateColumn, startDate)
        .lte(dateColumn, endDate);
    }

    const { data: shippingData } = await shippingStatusQuery;

    const shippingStats = shippingData?.reduce((acc: any, row: any) => {
      const status = row.shipping_status || '미발송';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // 벤더사별 통계
    let vendorQuery = supabase
      .from('integrated_orders')
      .select('vendor_name, quantity', { count: 'exact' });

    if (startDate && endDate) {
      const dateColumn = dateType === 'payment' ? 'payment_date' : 'sheet_date';
      vendorQuery = vendorQuery.gte(dateColumn, startDate).lte(dateColumn, endDate);
    }

    const { data: vendorData } = await vendorQuery;

    const vendorStats = vendorData?.reduce((acc: any, row: any) => {
      const vendor = row.vendor_name || '미지정';
      if (!acc[vendor]) {
        acc[vendor] = { count: 0, quantity: 0 };
      }
      acc[vendor].count += 1;
      acc[vendor].quantity += row.quantity || 0;
      return acc;
    }, {});

    // 마켓별 통계
    let marketQuery = supabase
      .from('integrated_orders')
      .select('market_name, seller_supply_price', { count: 'exact' });

    if (startDate && endDate) {
      const dateColumn = dateType === 'payment' ? 'payment_date' : 'sheet_date';
      marketQuery = marketQuery.gte(dateColumn, startDate).lte(dateColumn, endDate);
    }

    const { data: marketData } = await marketQuery;

    const marketStats = marketData?.reduce((acc: any, row: any) => {
      const market = row.market_name;
      if (!acc[market]) {
        acc[market] = { count: 0, totalAmount: 0 };
      }
      acc[market].count += 1;
      acc[market].totalAmount += parseFloat(row.seller_supply_price || 0);
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      stats: {
        byShippingStatus: shippingStats || {},
        byVendor: vendorStats || {},
        byMarket: marketStats || {},
      },
    });
  } catch (error: any) {
    console.error('GET /api/integrated-orders/stats 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
