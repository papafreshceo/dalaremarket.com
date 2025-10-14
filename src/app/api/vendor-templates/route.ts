import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/vendor-templates
 * 모든 벤더사 템플릿 조회
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 테이블 존재 여부 확인 및 생성
    const { error: createError } = await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS vendor_export_templates (
          id SERIAL PRIMARY KEY,
          vendor_name VARCHAR(100) UNIQUE NOT NULL,
          template_name VARCHAR(200),
          columns JSONB NOT NULL DEFAULT '[]'::jsonb,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `
    });

    if (createError) {
      console.log('Table might already exist:', createError);
    }

    const { data, error } = await supabase
      .from('vendor_export_templates')
      .select('*')
      .eq('is_active', true)
      .order('vendor_name');

    if (error) {
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
    console.error('GET /api/vendor-templates 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/vendor-templates
 * 새 벤더사 템플릿 생성
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { vendor_name, template_name, columns } = body;

    if (!vendor_name) {
      return NextResponse.json(
        { success: false, error: '벤더사명이 필요합니다.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('vendor_export_templates')
      .insert({
        vendor_name,
        template_name: template_name || vendor_name + ' 양식',
        columns: columns || [],
      })
      .select()
      .single();

    if (error) {
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
    console.error('POST /api/vendor-templates 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/vendor-templates
 * 벤더사 템플릿 수정
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { id, vendor_name, template_name, columns } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (vendor_name !== undefined) updateData.vendor_name = vendor_name;
    if (template_name !== undefined) updateData.template_name = template_name;
    if (columns !== undefined) updateData.columns = columns;

    const { data, error } = await supabase
      .from('vendor_export_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
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
    console.error('PUT /api/vendor-templates 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/vendor-templates
 * 벤더사 템플릿 삭제 (소프트 삭제)
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
      .from('vendor_export_templates')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '템플릿이 삭제되었습니다.',
    });
  } catch (error: any) {
    console.error('DELETE /api/vendor-templates 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
