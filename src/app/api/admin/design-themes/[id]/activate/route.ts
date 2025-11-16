import { NextRequest, NextResponse } from 'next/server';
import { createClientForRouteHandler } from '@/lib/supabase/server';
import logger from '@/lib/logger';

// 테마 활성화
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClientForRouteHandler();

    // 트리거가 자동으로 다른 테마들을 비활성화하지만, 명시적으로 처리
    const { error: deactivateError } = await supabase
      .from('design_themes')
      .update({ is_active: false })
      .neq('id', id);

    if (deactivateError) {
      logger.error('Deactivate themes error:', deactivateError);
    }

    // 선택한 테마 활성화
    const { data: theme, error } = await supabase
      .from('design_themes')
      .update({ is_active: true })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Activate theme error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: theme,
      message: '테마가 활성화되었습니다.'
    });
  } catch (error: any) {
    logger.error('POST /api/admin/design-themes/[id]/activate error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
