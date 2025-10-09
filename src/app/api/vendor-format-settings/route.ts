import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/vendor-format-settings
 * 벤더사 양식 설정 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('vendor_format_settings')
      .select('*')
      .order('vendor_name', { ascending: true });

    if (error) {
      console.error('벤더사 양식 설정 조회 실패:', error);
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
    console.error('GET /api/vendor-format-settings 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/vendor-format-settings
 * 벤더사 양식 설정 생성
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from('vendor_format_settings')
      .insert([body])
      .select()
      .single();

    if (error) {
      console.error('벤더사 양식 설정 생성 실패:', error);
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
    console.error('POST /api/vendor-format-settings 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/vendor-format-settings
 * 벤더사 양식 설정 수정
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: 'ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const { id, ...updateData } = body;

    const { data, error } = await supabase
      .from('vendor_format_settings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('벤더사 양식 설정 수정 실패:', error);
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
    console.error('PUT /api/vendor-format-settings 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/vendor-format-settings
 * 벤더사 양식 설정 삭제
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('vendor_format_settings')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('벤더사 양식 설정 삭제 실패:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('DELETE /api/vendor-format-settings 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
