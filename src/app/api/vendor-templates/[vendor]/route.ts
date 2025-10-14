import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/vendor-templates/[vendor]
 * 특정 벤더사 템플릿 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { vendor: string } }
) {
  try {
    const supabase = await createClient();
    const vendor = decodeURIComponent(params.vendor);

    const { data, error } = await supabase
      .from('vendor_export_templates')
      .select('*')
      .eq('vendor_name', vendor)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        return NextResponse.json({
          success: true,
          data: null,
          message: '템플릿이 없습니다.',
        });
      }
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
    console.error('GET /api/vendor-templates/[vendor] 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
