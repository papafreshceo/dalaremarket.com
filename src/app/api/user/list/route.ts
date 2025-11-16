import { createClientForRouteHandler } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';

/**
 * GET /api/user/list
 * 사용자 목록 조회 (메시지 전송용)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClientForRouteHandler();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 모든 사용자 조회 (본인 제외)
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, name, nickname')
      .neq('id', user.id)
      .order('email', { ascending: true });

    if (error) {
      logger.error('사용자 목록 조회 실패:', error);
      return NextResponse.json(
        { success: false, error: '사용자 목록을 불러올 수 없습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      users: users || [],
    });

  } catch (error: any) {
    logger.error('GET /api/user/list 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
