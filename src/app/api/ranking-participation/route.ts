import { createClientForRouteHandler } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-security';

/**
 * GET /api/ranking-participation
 * 본인의 랭킹 참여 설정 조회
 * Security: 인증 필요
 */
export async function GET(request: NextRequest) {
  try {
    // 🔒 보안: 로그인한 사용자만 조회 가능
    const auth = await requireAuth(request);
    if (!auth.authorized) return auth.error;

    const supabase = await createClientForRouteHandler();
    const userId = auth.userData.id;

    // 참여 설정 조회
    const { data, error } = await supabase
      .from('ranking_participation')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('랭킹 참여 설정 조회 실패:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // 설정이 없으면 기본값 반환
    if (!data) {
      return NextResponse.json({
        success: true,
        data: {
          user_id: userId,
          is_participating: false,
          show_score: false,
          show_sales_performance: false
        }
      });
    }

    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error('GET /api/ranking-participation 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/ranking-participation
 * 랭킹 참여 설정 업데이트
 * Security: 인증 필요
 */
export async function PUT(request: NextRequest) {
  try {
    // 🔒 보안: 로그인한 사용자만 수정 가능
    const auth = await requireAuth(request);
    if (!auth.authorized) return auth.error;

    const supabase = await createClientForRouteHandler();
    const userId = auth.userData.id;
    const body = await request.json();

    // 필드 검증
    const updates: any = {};
    if (typeof body.is_participating === 'boolean') {
      updates.is_participating = body.is_participating;
    }
    if (typeof body.show_score === 'boolean') {
      updates.show_score = body.show_score;
    }
    if (typeof body.show_sales_performance === 'boolean') {
      updates.show_sales_performance = body.show_sales_performance;
    }

    // 참여하지 않으면 공개 설정도 모두 false로
    if (updates.is_participating === false) {
      updates.show_score = false;
      updates.show_sales_performance = false;
    }

    // Upsert (있으면 업데이트, 없으면 생성)
    const { data, error } = await supabase
      .from('ranking_participation')
      .upsert({
        user_id: userId,
        ...updates,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) {
      console.error('랭킹 참여 설정 업데이트 실패:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error('PUT /api/ranking-participation 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
