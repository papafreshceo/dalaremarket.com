import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // 회원 목록 조회 (모든 필드 포함 + 티어별 할인율 + 캐시/크레딧 잔액 JOIN)
    const { data: members, error: membersError } = await supabase
      .from('users')
      .select(`
        *,
        tier_criteria!left(discount_rate),
        user_cash!left(balance),
        user_credits!left(balance)
      `)
      .order('created_at', { ascending: false });

    if (membersError) {
      console.error('회원 목록 조회 오류:', membersError);
      return NextResponse.json({ error: '회원 목록을 불러올 수 없습니다.' }, { status: 500 });
    }

    // discount_rate, cash_balance, credit_balance를 평탄화
    const processedMembers = members?.map(member => ({
      ...member,
      discount_rate: member.tier_criteria?.discount_rate || null,
      cash_balance: member.user_cash?.balance || 0,
      credit_balance: member.user_credits?.balance || 0,
      tier_criteria: undefined, // 중첩 객체 제거
      user_cash: undefined,
      user_credits: undefined
    }));

    return NextResponse.json({ success: true, members: processedMembers });
  } catch (error) {
    console.error('GET /api/admin/members 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
