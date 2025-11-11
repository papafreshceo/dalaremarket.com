import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-security';

export async function GET(request: NextRequest) {
  // 🔒 보안: 관리자만 회원 목록 조회 가능
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.error;

  try {
    const supabase = await createClient();

    // 회원 목록 조회
    const { data: members, error: membersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (membersError) {
      console.error('회원 목록 조회 오류:', membersError);
      return NextResponse.json({ error: '회원 목록을 불러올 수 없습니다.' }, { status: 500 });
    }

    if (!members || members.length === 0) {
      return NextResponse.json({ success: true, members: [] });
    }

    // 모든 회원의 user_id 목록
    const userIds = members.map(m => m.id);

    // 캐시 잔액 조회
    const { data: cashBalances } = await supabase
      .from('user_cash')
      .select('user_id, balance')
      .in('user_id', userIds);

    // 크레딧 잔액 조회
    const { data: creditBalances } = await supabase
      .from('user_credits')
      .select('user_id, balance')
      .in('user_id', userIds);

    // 잔액 데이터를 Map으로 변환
    const cashMap = new Map(cashBalances?.map(c => [c.user_id, c.balance]) || []);
    const creditMap = new Map(creditBalances?.map(c => [c.user_id, c.balance]) || []);

    // 회원 정보에 잔액 병합 (tier와 manual_tier는 users 테이블에 이미 있음)
    const processedMembers = members.map(member => ({
      ...member,
      cash_balance: cashMap.get(member.id) || 0,
      credit_balance: creditMap.get(member.id) || 0,
    }));

    return NextResponse.json({ success: true, members: processedMembers });
  } catch (error) {
    console.error('GET /api/admin/members 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  // 🔒 보안: 관리자만 회원 상태 변경 가능
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.error;

  try {
    const supabase = await createClient();
    const body = await request.json();
    const { memberId, is_active } = body;

    if (!memberId) {
      return NextResponse.json({ error: '회원 ID가 필요합니다.' }, { status: 400 });
    }

    // 회원 활성화 상태 업데이트
    const { error } = await supabase
      .from('users')
      .update({ is_active })
      .eq('id', memberId);

    if (error) {
      console.error('회원 상태 업데이트 오류:', error);
      return NextResponse.json({ error: '회원 상태를 업데이트할 수 없습니다.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/admin/members 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
