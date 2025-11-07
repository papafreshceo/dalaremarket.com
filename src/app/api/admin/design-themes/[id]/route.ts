import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// 특정 테마 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: theme, error } = await supabase
      .from('design_themes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Fetch theme error:', error);
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
    console.error('GET /api/admin/design-themes/[id] error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// 테마 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const { name, description, css_variables } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (css_variables !== undefined) updateData.css_variables = css_variables;


    const { data: theme, error } = await supabase
      .from('design_themes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update theme error:', error);
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
    console.error('PATCH /api/admin/design-themes/[id] error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// 테마 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 활성화된 테마는 삭제 불가
    const { data: theme } = await supabase
      .from('design_themes')
      .select('is_active')
      .eq('id', id)
      .single();

    if (theme?.is_active) {
      return NextResponse.json(
        { success: false, error: '활성화된 테마는 삭제할 수 없습니다.' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('design_themes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete theme error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '테마가 삭제되었습니다.'
    });
  } catch (error: any) {
    console.error('DELETE /api/admin/design-themes/[id] error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
