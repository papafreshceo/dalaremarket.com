import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-security';

/**
 * GET /api/admin/ranking-rewards
 * 랭킹 보상 설정 조회
 * Security: 관리자 전용
 */
export async function GET(request: NextRequest) {
  try {
    // 🔒 관리자 권한 확인
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.error;

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('ranking_rewards_settings')
      .select('*')
      .order('period_type', { ascending: true })
      .order('rank', { ascending: true });

    if (error) {
      console.error('랭킹 보상 설정 조회 실패:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, rewards: data });

  } catch (error: any) {
    console.error('GET /api/admin/ranking-rewards 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/ranking-rewards
 * 랭킹 보상 설정 업데이트
 * Security: 관리자 전용
 */
export async function PUT(request: NextRequest) {
  try {
    // 🔒 관리자 권한 확인
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.error;

    const supabase = await createClient();
    const body = await request.json();
    const { rewards } = body;

    if (!Array.isArray(rewards)) {
      return NextResponse.json(
        { success: false, error: '보상 데이터가 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    // 각 보상 설정 업데이트
    const errors: any[] = [];
    for (const reward of rewards) {
      const { period_type, rank, reward_cash } = reward;

      if (!period_type || rank === undefined || reward_cash === undefined) {
        errors.push({ reward, error: '필수 필드 누락' });
        continue;
      }

      const { error } = await supabase
        .from('ranking_rewards_settings')
        .upsert({
          period_type,
          rank,
          reward_cash,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'period_type,rank'
        });

      if (error) {
        errors.push({ reward, error: error.message });
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: '일부 보상 설정 업데이트 실패', errors },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('PUT /api/admin/ranking-rewards 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
