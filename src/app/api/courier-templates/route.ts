import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/courier-templates
 * 택배사 템플릿 목록 조회
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  try {
    // 테이블 자동 생성 (없는 경우)
    const { error: createError } = await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS courier_templates (
          id SERIAL PRIMARY KEY,
          courier_name VARCHAR(100) UNIQUE NOT NULL,
          template_name VARCHAR(200),
          columns JSONB NOT NULL DEFAULT '[]'::jsonb,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `
    });

    const { data, error } = await supabase
      .from('courier_templates')
      .select('*')
      .eq('is_active', true)
      .order('courier_name');

    if (error) {
      console.error('택배사 템플릿 조회 오류:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: any) {
    console.error('GET /api/courier-templates 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/courier-templates
 * 택배사 템플릿 생성
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    const body = await request.json();
    const { courier_name, template_name, columns } = body;

    if (!courier_name) {
      return NextResponse.json(
        { success: false, error: '택배사명은 필수입니다.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('courier_templates')
      .insert({
        courier_name,
        template_name: template_name || courier_name + ' 양식',
        columns: columns || [],
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('택배사 템플릿 생성 오류:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('POST /api/courier-templates 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/courier-templates
 * 택배사 템플릿 수정
 */
export async function PUT(request: NextRequest) {
  const supabase = await createClient();

  try {
    const body = await request.json();
    const { id, courier_name, template_name, columns } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID는 필수입니다.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('courier_templates')
      .update({
        courier_name,
        template_name,
        columns,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('택배사 템플릿 수정 오류:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('PUT /api/courier-templates 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/courier-templates?id=1
 * 택배사 템플릿 삭제
 */
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();

  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID는 필수입니다.' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('courier_templates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('택배사 템플릿 삭제 오류:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/courier-templates 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
