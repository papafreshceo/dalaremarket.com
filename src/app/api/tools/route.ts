import { NextResponse } from 'next/server';
import { createClientForRouteHandler } from '@/lib/supabase/server';
import logger from '@/lib/logger';

// GET: 활성화된 도구 목록 조회
export async function GET() {
  try {
    const supabase = await createClientForRouteHandler();

    // 활성화된 도구만 조회
    const { data: tools, error } = await supabase
      .from('tools_master')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      logger.error('Error fetching tools:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      tools: tools || []
    });
  } catch (error: any) {
    logger.error('Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
