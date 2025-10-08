import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/product-mapping
 * 제품 매핑 조회
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    const optionName = searchParams.get('optionName');
    const vendorName = searchParams.get('vendorName');
    const isActive = searchParams.get('isActive');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = (page - 1) * limit;

    let query = supabase.from('product_mapping').select('*', { count: 'exact' });

    // 옵션명 검색
    if (optionName) {
      query = query.ilike('option_name', `%${optionName}%`);
    }

    // 벤더사 필터
    if (vendorName) {
      query = query.eq('vendor_name', vendorName);
    }

    // 활성 상태 필터
    if (isActive !== null && isActive !== undefined) {
      query = query.eq('is_active', isActive === 'true');
    }

    // 정렬
    query = query.order('option_name', { ascending: true });

    // 페이지네이션
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('제품 매핑 조회 실패:', error);
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
    console.error('GET /api/product-mapping 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/product-mapping
 * 제품 매핑 생성
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    if (!body.option_name) {
      return NextResponse.json(
        { success: false, error: '옵션명은 필수입니다.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('product_mapping')
      .insert(body)
      .select()
      .single();

    if (error) {
      console.error('제품 매핑 생성 실패:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('POST /api/product-mapping 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/product-mapping
 * 제품 매핑 수정
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

    const { data, error } = await supabase
      .from('product_mapping')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('제품 매핑 수정 실패:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('PUT /api/product-mapping 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/product-mapping
 * 제품 매핑 삭제
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

    const { error } = await supabase.from('product_mapping').delete().eq('id', id);

    if (error) {
      console.error('제품 매핑 삭제 실패:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/product-mapping 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
