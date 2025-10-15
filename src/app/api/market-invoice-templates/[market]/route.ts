import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/market-invoice-templates/[market]
 * 특정 마켓의 송장 템플릿 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ market: string }> }
) {
  try {
    const supabase = await createClient();
    const { market: marketParam } = await params;
    const market = decodeURIComponent(marketParam);

    const { data, error } = await supabase
      .from('market_invoice_templates')
      .select('*')
      .eq('market_name', market)
      .single();

    if (error) {
      // 템플릿이 없는 경우 빈 데이터 반환
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          success: true,
          data: null,
        });
      }
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('GET /api/market-invoice-templates/[market] 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
