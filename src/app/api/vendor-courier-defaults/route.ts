import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/vendor-courier-defaults
 * 벤더사별 기본 택배사 설정 조회
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorName = searchParams.get('vendorName');

    let query = supabase
      .from('vendor_courier_defaults')
      .select('*')
      .order('vendor_name', { ascending: true });

    if (vendorName) {
      query = query.eq('vendor_name', vendorName);
    }

    const { data, error } = await query;

    if (error) {
      console.error('벤더 택배사 설정 조회 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('벤더 택배사 설정 조회 중 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

/**
 * POST /api/vendor-courier-defaults
 * 벤더사별 기본 택배사 설정 추가
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vendor_name, default_courier, created_by } = body;

    if (!vendor_name || !default_courier) {
      return NextResponse.json(
        { error: '벤더사명과 기본 택배사는 필수입니다.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('vendor_courier_defaults')
      .insert({
        vendor_name,
        default_courier,
        created_by,
        updated_by: created_by
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: '이미 등록된 벤더사입니다.' },
          { status: 409 }
        );
      }
      console.error('벤더 택배사 설정 추가 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('벤더 택배사 설정 추가 중 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

/**
 * PUT /api/vendor-courier-defaults
 * 벤더사별 기본 택배사 설정 수정
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, vendor_name, default_courier, updated_by } = body;

    if (!id || !vendor_name || !default_courier) {
      return NextResponse.json(
        { error: 'ID, 벤더사명, 기본 택배사는 필수입니다.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('vendor_courier_defaults')
      .update({
        vendor_name,
        default_courier,
        updated_by
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: '이미 등록된 벤더사명입니다.' },
          { status: 409 }
        );
      }
      console.error('벤더 택배사 설정 수정 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('벤더 택배사 설정 수정 중 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

/**
 * DELETE /api/vendor-courier-defaults
 * 벤더사별 기본 택배사 설정 삭제
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID는 필수입니다.' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('vendor_courier_defaults')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('벤더 택배사 설정 삭제 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('벤더 택배사 설정 삭제 중 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
