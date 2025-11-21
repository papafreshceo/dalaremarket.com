import { NextRequest, NextResponse } from 'next/server';
import { createClientForRouteHandler } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import logger from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limit';

// POST: 크레딧 차감
export async function POST(request: NextRequest) {
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

    // Rate Limiting: 사용자당 1분에 30번까지 허용
    const rateLimitResult = rateLimit(`use-credits:${user.id}`, {
      maxRequests: 30,
      windowMs: 60 * 1000, // 1분
    });

    if (!rateLimitResult.success) {
      const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
      return NextResponse.json(
        { success: false, error: '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.' },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
          }
        }
      );
    }

    const { toolId } = await request.json();

    if (!toolId) {
      return NextResponse.json({ success: false, error: 'toolId is required' }, { status: 400 });
    }

    // 도구 정보 조회 (필요한 크레딧)
    const { data: toolData, error: toolError } = await supabase
      .from('tools')
      .select('credits_required')
      .eq('id', toolId)
      .single();

    if (toolError || !toolData) {
      return NextResponse.json({ success: false, error: 'Tool not found' }, { status: 404 });
    }

    const creditsRequired = toolData.credits_required || 0;

    // 크레딧이 필요 없는 도구
    if (creditsRequired === 0) {
      return NextResponse.json({
        success: true,
        message: 'No credits required',
        balance: 0
      });
    }

    // 사용자의 primary_organization_id 조회
    const { data: userData } = await supabase
      .from('users')
      .select('primary_organization_id')
      .eq('id', user.id)
      .single();

    if (!userData?.primary_organization_id) {
      return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 });
    }

    // 조직의 크레딧 잔액 조회
    const { data: creditData } = await supabase
      .from('organization_credits')
      .select('balance')
      .eq('organization_id', userData.primary_organization_id)
      .single();

    const currentBalance = creditData?.balance || 0;

    // 크레딧 부족 확인
    if (currentBalance < creditsRequired) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient credits',
        balance: currentBalance,
        required: creditsRequired
      }, { status: 400 });
    }

    // 크레딧 차감
    const newBalance = currentBalance - creditsRequired;
    const { error: updateError } = await supabase
      .from('organization_credits')
      .update({ balance: newBalance })
      .eq('organization_id', userData.primary_organization_id);

    if (updateError) {
      logger.error('Error updating credits:', updateError);
      return NextResponse.json({ success: false, error: 'Failed to update credits' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Credits deducted successfully',
      balance: newBalance,
      credits_after: newBalance
    });
  } catch (error: any) {
    logger.error('Error using credits:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
