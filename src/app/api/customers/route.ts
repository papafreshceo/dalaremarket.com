import { createClientForRouteHandler } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-security';

/**
 * GET /api/customers
 * 고객 조회 (검색, 필터링)
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authorized) return auth.error;

    const supabase = await createClientForRouteHandler();
    const searchParams = request.nextUrl.searchParams;

    const customerType = searchParams.get('customerType'); // 'regular' | 'marketing'
    const searchKeyword = searchParams.get('searchKeyword');
    const limit = parseInt(searchParams.get('limit') || '1000');

    // 기본 쿼리 (삭제되지 않은 고객만)
    let query = supabase
      .from('customers')
      .select('*')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    // 고객 타입 필터 (배열에 포함되어 있는지 확인)
    if (customerType) {
      query = query.contains('customer_types', [customerType]);
    }

    // 검색어 (이름, 전화번호)
    if (searchKeyword) {
      query = query.or(
        `name.ilike.%${searchKeyword}%,phone.ilike.%${searchKeyword}%,recipient_name.ilike.%${searchKeyword}%`
      );
    }

    query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      console.error('고객 조회 실패:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error: any) {
    console.error('고객 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/customers
 * 고객 생성
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authorized) return auth.error;

    const supabase = await createClientForRouteHandler();
    const body = await request.json();

    const {
      name,
      phone,
      email,
      customer_type = 'regular', // 하위 호환성을 위해 유지
      customer_types, // 새로운 배열 방식
      recipient_name,
      recipient_phone,
      zonecode,
      road_address,
      jibun_address,
      detail_address,
      memo,
    } = body;

    // customer_types 배열 결정: 새 방식 우선, 없으면 기존 방식 변환
    const typesArray = customer_types || (customer_type ? [customer_type] : ['regular']);

    // 필수 필드 검증
    if (!name || !phone) {
      return NextResponse.json(
        { success: false, error: '이름과 전화번호는 필수입니다.' },
        { status: 400 }
      );
    }

    // 전화번호 중복 체크
    const { data: existing } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', phone)
      .eq('is_deleted', false)
      .single();

    if (existing) {
      // 이미 등록된 고객이 있으면 customer_types에 새로운 타입 추가
      const existingTypes = existing.customer_types || [];
      const newTypes = [...new Set([...existingTypes, ...typesArray])]; // 중복 제거

      // 타입이 변경되지 않았으면 그냥 기존 고객 반환
      if (JSON.stringify(existingTypes.sort()) === JSON.stringify(newTypes.sort())) {
        return NextResponse.json({
          success: true,
          data: existing,
          message: '이미 해당 유형으로 등록된 고객입니다.',
        });
      }

      // 타입 추가 업데이트
      const { data: updated, error: updateError } = await supabase
        .from('customers')
        .update({ customer_types: newTypes })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) {
        console.error('고객 타입 업데이트 실패:', updateError);
        return NextResponse.json(
          { success: false, error: updateError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: updated,
        message: '기존 고객에 새로운 유형이 추가되었습니다.',
      });
    }

    // 새 고객 생성
    const { data, error } = await supabase
      .from('customers')
      .insert({
        name,
        phone,
        email,
        customer_types: typesArray,
        recipient_name,
        recipient_phone,
        zonecode,
        road_address,
        jibun_address,
        detail_address,
        memo,
        created_by: auth.user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('고객 생성 실패:', error);
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
    console.error('고객 생성 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/customers
 * 고객 수정
 */
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authorized) return auth.error;

    const supabase = await createClientForRouteHandler();
    const body = await request.json();

    const {
      id,
      name,
      phone,
      email,
      customer_type, // 하위 호환성
      customer_types, // 새로운 배열 방식
      recipient_name,
      recipient_phone,
      zonecode,
      road_address,
      jibun_address,
      detail_address,
      memo,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID는 필수입니다.' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    // customer_types 우선, 없으면 customer_type을 배열로 변환
    if (customer_types !== undefined) {
      updateData.customer_types = customer_types;
    } else if (customer_type !== undefined) {
      updateData.customer_types = [customer_type];
    }
    if (recipient_name !== undefined) updateData.recipient_name = recipient_name;
    if (recipient_phone !== undefined) updateData.recipient_phone = recipient_phone;
    if (zonecode !== undefined) updateData.zonecode = zonecode;
    if (road_address !== undefined) updateData.road_address = road_address;
    if (jibun_address !== undefined) updateData.jibun_address = jibun_address;
    if (detail_address !== undefined) updateData.detail_address = detail_address;
    if (memo !== undefined) updateData.memo = memo;

    const { data, error } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('고객 수정 실패:', error);
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
    console.error('고객 수정 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/customers
 * 고객 삭제 (완전 삭제)
 */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authorized) return auth.error;

    const supabase = await createClientForRouteHandler();
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID는 필수입니다.' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('고객 삭제 실패:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('고객 삭제 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
