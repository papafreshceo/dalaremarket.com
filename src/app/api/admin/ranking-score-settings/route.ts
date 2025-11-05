import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-security';

/**
 * GET /api/admin/ranking-score-settings
 * 랭킹 점수 산정 설정 조회
 * Security: 관리자 전용
 */
export async function GET(request: NextRequest) {
  try {
    // 🔒 관리자 권한 확인
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.error;

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('ranking_score_settings')
      .select('*')
      .single();

    if (error) {
      console.error('랭킹 점수 설정 조회 실패:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, settings: data });

  } catch (error: any) {
    console.error('GET /api/admin/ranking-score-settings 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/ranking-score-settings
 * 랭킹 점수 산정 설정 업데이트
 * Security: 관리자 전용
 */
export async function PUT(request: NextRequest) {
  try {
    // 🔒 관리자 권한 확인
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.error;

    const supabase = await createClient();
    const body = await request.json();

    // 유효성 검증
    const {
      sales_per_point,
      orders_per_point,
      weekly_consecutive_bonus,
      monthly_consecutive_bonus,
      post_score,
      comment_score,
      login_score
    } = body;

    // 필수 필드 검증
    if (
      sales_per_point === undefined ||
      orders_per_point === undefined ||
      weekly_consecutive_bonus === undefined ||
      monthly_consecutive_bonus === undefined ||
      post_score === undefined ||
      comment_score === undefined ||
      login_score === undefined
    ) {
      return NextResponse.json(
        { success: false, error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 양수 검증
    if (
      sales_per_point <= 0 ||
      orders_per_point <= 0 ||
      weekly_consecutive_bonus < 0 ||
      monthly_consecutive_bonus < 0 ||
      post_score < 0 ||
      comment_score < 0 ||
      login_score < 0
    ) {
      return NextResponse.json(
        { success: false, error: '점수는 0 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('ranking_score_settings')
      .update({
        sales_per_point,
        orders_per_point,
        weekly_consecutive_bonus,
        monthly_consecutive_bonus,
        post_score,
        comment_score,
        login_score,
        updated_at: new Date().toISOString()
      })
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .select()
      .single();

    if (error) {
      console.error('랭킹 점수 설정 업데이트 실패:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, settings: data });

  } catch (error: any) {
    console.error('PUT /api/admin/ranking-score-settings 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
