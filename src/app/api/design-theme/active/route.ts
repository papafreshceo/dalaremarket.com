import { NextRequest, NextResponse } from 'next/server';
import { createClientForRouteHandler } from '@/lib/supabase/server';
import logger from '@/lib/logger';

// 활성화된 테마 조회 (public)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClientForRouteHandler();

    // URL에서 scope 파라미터 추출 (기본값: 'admin')
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope') || 'admin';

    // scope 값 검증
    if (!['admin', 'platform', 'orders'].includes(scope)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 scope입니다.' },
        { status: 400 }
      );
    }

    const { data: theme, error } = await supabase
      .from('design_themes')
      .select('*')
      .eq('is_active', true)
      .eq('theme_scope', scope)
      .single();

    if (error) {
      // 활성 테마가 없으면 기본값 반환
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          success: true,
          data: {
            name: 'Default',
            css_variables: {
              '--font-sans': 'DM Sans, sans-serif',
              '--font-mono': 'Space Mono, monospace',
              '--color-primary': '#000000',
              '--color-secondary': '#ffffff',
              '--color-accent': '#fef3c7',
              '--color-border': '#000000',
              '--border-width': '2px',
              '--shadow-sm': '4px 4px 0px 0px rgba(0, 0, 0, 0.1)',
              '--shadow-md': '6px 6px 0px 0px rgba(0, 0, 0, 0.1)',
              '--shadow-lg': '8px 8px 0px 0px rgba(0, 0, 0, 0.15)',
              '--radius': '0px'
            }
          }
        });
      }

      logger.error('Fetch active theme error:', error);
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
    logger.error('GET /api/design-theme/active error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
