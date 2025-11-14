import { createClientForRouteHandler } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-security';

export async function GET(request: NextRequest) {
  // 🔒 보안: 관리자만 회원 목록 조회 가능
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.error;

  try {
    const supabase = await createClientForRouteHandler();

    // 1. 모든 조직 조회
    const { data: organizations, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });

    if (orgError) {
      console.error('조직 목록 조회 오류:', orgError);
      return NextResponse.json({ error: '조직 목록을 불러올 수 없습니다.' }, { status: 500 });
    }

    if (!organizations || organizations.length === 0) {
      return NextResponse.json({ success: true, members: [] });
    }

    const orgIds = organizations.map(o => o.id);

    // 2. 조직 멤버 조회 (조직별 모든 멤버)
    const { data: orgMembers, error: membersError } = await supabase
      .from('organization_members')
      .select(`
        *,
        user:users!organization_members_user_id_fkey (
          id,
          email,
          name,
          profile_name,
          phone,
          role,
          created_at,
          updated_at,
          last_login_provider
        )
      `)
      .in('organization_id', orgIds)
      .order('organization_id', { ascending: false })
      .order('role', { ascending: true }); // owner가 먼저 오도록

    if (membersError) {
      console.error('조직 멤버 조회 오류:', membersError);
      return NextResponse.json({ error: '멤버 목록을 불러올 수 없습니다.' }, { status: 500 });
    }

    // 3. 캐시 잔액 조회
    const { data: cashBalances } = await supabase
      .from('organization_cash')
      .select('organization_id, balance')
      .in('organization_id', orgIds);

    // 4. 크레딧 잔액 조회
    const { data: creditBalances } = await supabase
      .from('organization_credits')
      .select('organization_id, balance')
      .in('organization_id', orgIds);

    // 5. 데이터를 Map으로 변환
    const orgMap = new Map(organizations.map(o => [o.id, o]));
    const cashMap = new Map(cashBalances?.map(c => [c.organization_id, c.balance]) || []);
    const creditMap = new Map(creditBalances?.map(c => [c.organization_id, c.balance]) || []);

    // 6. 조직 멤버 데이터 병합
    console.log('조직 수:', organizations?.length);
    console.log('조직 멤버 수:', orgMembers?.length);

    const processedMembers = (orgMembers || []).map(member => {
      const org = orgMap.get(member.organization_id);
      const user = member.user;

      return {
        // 멤버 ID (organization_members.id)
        member_id: member.id,
        organization_id: member.organization_id,

        // 사용자 정보
        id: user?.id || null,
        email: user?.email || null,
        name: user?.name || null,
        profile_name: user?.profile_name || null,
        phone: user?.phone || null,
        user_role: user?.role || null, // 회원구분 (super_admin, admin, employee, seller, partner)
        created_at: user?.created_at || null,
        updated_at: user?.updated_at || null,
        last_login_provider: user?.last_login_provider || null,

        // 조직 내 역할
        org_role: member.role, // owner, member
        org_status: member.status, // active, invited, suspended

        // 조직 정보
        business_name: org?.business_name || null,
        business_number: org?.business_number || null,
        business_address: org?.business_address || null,
        business_email: org?.business_email || null,
        representative_name: org?.representative_name || null,
        representative_phone: org?.representative_phone || null,
        manager_name: org?.manager_name || null,
        manager_phone: org?.manager_phone || null,
        bank_name: org?.bank_name || null,
        account_number: org?.bank_account || null,
        account_holder: org?.account_holder || null,
        depositor_name: org?.depositor_name || null,
        store_name: org?.store_name || null,
        store_phone: org?.store_phone || null,
        tier: org?.tier || null,
        seller_code: org?.seller_code || null,

        // 조직 잔액 (모든 멤버 행에 포함하지만, 프론트에서 첫 행만 표시)
        cash_balance: cashMap.get(member.organization_id) || 0,
        credit_balance: creditMap.get(member.organization_id) || 0,
      };
    });

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
    const supabase = await createClientForRouteHandler();
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
