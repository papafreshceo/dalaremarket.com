import { NextRequest, NextResponse } from 'next/server';
import { createClientForRouteHandler } from '@/lib/supabase/server';
import logger from '@/lib/logger';

/**
 * GET /api/courier-templates/[courier]
 * 특정 택배사 템플릿 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { courier: string } }
) {
  const supabase = await createClientForRouteHandler();

  try {
    const courier = decodeURIComponent(params.courier);

    const { data, error } = await supabase
      .from('courier_templates')
      .select('*')
      .eq('courier_name', courier)
      .eq('is_active', true)
      .single();

    if (error) {
      // 템플릿이 없는 경우는 에러가 아님
      if (error.code === 'PGRST116') {
        return NextResponse.json({ success: true, data: null });
      }

      logger.error('택배사 템플릿 조회 오류:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    logger.error('GET /api/courier-templates/[courier] 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
