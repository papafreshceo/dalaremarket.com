import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/cs-records
 * CS 기록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const csType = searchParams.get('csType');
    const resolutionMethod = searchParams.get('resolutionMethod');
    const status = searchParams.get('status');
    const orderNumber = searchParams.get('orderNumber');
    const searchName = searchParams.get('searchName');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = (page - 1) * limit;

    let query = supabase.from('cs_records').select('*', { count: 'exact' });

    // 날짜 필터 (접수일 기준)
    if (startDate && endDate) {
      query = query.gte('receipt_date', startDate).lte('receipt_date', endDate);
    }

    // CS 유형 필터
    if (csType) {
      query = query.eq('cs_type', csType);
    }

    // 해결방법 필터
    if (resolutionMethod) {
      query = query.eq('resolution_method', resolutionMethod);
    }

    // 처리상태 필터
    if (status) {
      query = query.eq('status', status);
    }

    // 주문번호 검색
    if (orderNumber) {
      query = query.ilike('order_number', `%${orderNumber}%`);
    }

    // 이름 검색 (주문자 또는 수령인)
    if (searchName) {
      query = query.or(
        `orderer_name.ilike.%${searchName}%,recipient_name.ilike.%${searchName}%`
      );
    }

    // 정렬 (최신순)
    query = query.order('receipt_date', { ascending: false });

    // 페이지네이션
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('CS 기록 조회 실패:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    console.error('GET /api/cs-records 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cs-records
 * CS 기록 생성
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // 필수 필드 검증
    if (!body.receipt_date || !body.order_number) {
      return NextResponse.json(
        { success: false, error: '접수일과 주문번호는 필수입니다.' },
        { status: 400 }
      );
    }

    // 기본값 설정
    if (!body.status) {
      body.status = '접수';
    }

    const { data, error } = await supabase
      .from('cs_records')
      .insert(body)
      .select()
      .single();

    if (error) {
      console.error('CS 기록 생성 실패:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('POST /api/cs-records 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/cs-records
 * CS 기록 수정
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: 'ID 필드가 필요합니다.' },
        { status: 400 }
      );
    }

    const { id, ...updateData } = body;

    // 완료 처리 시 처리일시 자동 설정
    if (updateData.status === '완료' && !updateData.processing_datetime) {
      updateData.processing_datetime = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('cs_records')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('CS 기록 수정 실패:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('PUT /api/cs-records 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cs-records
 * CS 기록 삭제
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID 파라미터가 필요합니다.' },
        { status: 400 }
      );
    }

    const { error } = await supabase.from('cs_records').delete().eq('id', id);

    if (error) {
      console.error('CS 기록 삭제 실패:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/cs-records 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
