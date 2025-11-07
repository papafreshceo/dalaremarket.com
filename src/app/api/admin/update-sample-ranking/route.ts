import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-security';

/**
 * POST /api/admin/update-sample-ranking
 * 샘플 회원들을 랭킹 참여 상태로 설정
 * Security: 관리자 전용
 */
export async function POST(request: NextRequest) {
  try {
    // 🔒 관리자 권한 확인
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.error;

    const supabase = await createClient();

    // 1. 샘플 회원들 조회 (이메일에 'sample' 또는 'test' 포함)
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .or('email.ilike.%sample%,email.ilike.%test%')
      .order('email');

    if (usersError) {
      console.error('샘플 회원 조회 실패:', usersError);
      return NextResponse.json(
        { success: false, error: usersError.message },
        { status: 500 }
      );
    }

    if (!users || users.length === 0) {
      return NextResponse.json({
        success: true,
        message: '샘플 회원이 없습니다.',
        count: 0
      });
    }


    // 2. 각 샘플 회원의 ranking_participation 업데이트
    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const user of users) {
      const { error: updateError } = await supabase
        .from('ranking_participation')
        .upsert({
          seller_id: user.id,
          is_participating: true,
          show_score: true,
          show_sales_performance: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'seller_id'
        });

      if (updateError) {
        console.error(`${user.email} 업데이트 실패:`, updateError);
        errorCount++;
        results.push({
          email: user.email,
          success: false,
          error: updateError.message
        });
      } else {
        successCount++;
        results.push({
          email: user.email,
          success: true
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `${successCount}명 성공, ${errorCount}명 실패`,
      totalUsers: users.length,
      successCount,
      errorCount,
      results
    });

  } catch (error: any) {
    console.error('POST /api/admin/update-sample-ranking 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
