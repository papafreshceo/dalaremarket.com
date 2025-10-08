import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/cs-records/stats
 * CS 통계 조회 (해결방법별 집계)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = supabase.from('cs_records').select('resolution_method, cs_type, status');

    // 날짜 필터
    if (startDate && endDate) {
      query = query.gte('receipt_date', startDate).lte('receipt_date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('CS 통계 조회 실패:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // 해결방법별 집계
    const byResolution = data?.reduce((acc: any, row: any) => {
      const method = row.resolution_method || '미지정';
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {});

    // CS 유형별 집계
    const byType = data?.reduce((acc: any, row: any) => {
      const type = row.cs_type || '미지정';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    // 처리상태별 집계
    const byStatus = data?.reduce((acc: any, row: any) => {
      const status = row.status || '접수';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      stats: {
        byResolution: byResolution || {},
        byType: byType || {},
        byStatus: byStatus || {},
        total: data?.length || 0,
      },
    });
  } catch (error: any) {
    console.error('GET /api/cs-records/stats 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
