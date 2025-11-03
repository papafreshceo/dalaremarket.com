import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// 테마 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: themes, error } = await supabase
      .from('design_themes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch themes error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: themes
    });
  } catch (error: any) {
    console.error('GET /api/admin/design-themes error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// 테마 생성
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { name, description, css_variables } = body;

    if (!name || !css_variables) {
      return NextResponse.json(
        { success: false, error: '이름과 CSS 변수는 필수입니다.' },
        { status: 400 }
      );
    }

    const { data: theme, error } = await supabase
      .from('design_themes')
      .insert({
        name,
        description,
        css_variables,
        is_active: false
      })
      .select()
      .single();

    if (error) {
      console.error('Create theme error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: theme
    });
  } catch (error: any) {
    console.error('POST /api/admin/design-themes error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
