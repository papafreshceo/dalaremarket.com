import { NextRequest, NextResponse } from 'next/server';
import { createClientForRouteHandler } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import logger from '@/lib/logger';

// GET: 사용자의 도구별 사용 횟수 조회
export async function GET(request: NextRequest) {
  try {
    // Authorization 헤더 확인
    const authHeader = request.headers.get('authorization');
    let supabase;

    if (authHeader?.startsWith('Bearer ')) {
      // Authorization 헤더가 있으면 토큰으로 인증
      const token = authHeader.substring(7);
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        }
      );
    } else {
      // 없으면 쿠키로 인증
      supabase = await createClientForRouteHandler();
    }

    // 현재 로그인한 사용자 정보 가져오기
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 사용자의 도구별 사용 횟수 가져오기
    const { data, error } = await supabase.rpc('get_user_tool_usage_counts', {
      p_user_id: user.id
    });

    if (error) {
      logger.error('Error fetching tool usage:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // 배열을 객체로 변환 { tool_id: usage_count }
    const usageCounts = (data || []).reduce((acc: Record<string, number>, item: any) => {
      acc[item.tool_id] = parseInt(item.usage_count);
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      usageCounts
    });
  } catch (error: any) {
    logger.error('Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: 도구 사용 기록 추가
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // 현재 로그인한 사용자 정보 가져오기
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { toolId } = await request.json();

    if (!toolId) {
      return NextResponse.json({ success: false, error: 'toolId is required' }, { status: 400 });
    }

    // 도구 사용 기록 추가
    const { error } = await supabase
      .from('tool_usage')
      .insert({
        user_id: user.id,
        tool_id: toolId,
        used_at: new Date().toISOString()
      });

    if (error) {
      logger.error('Error recording tool usage:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Tool usage recorded successfully'
    });
  } catch (error: any) {
    logger.error('Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
