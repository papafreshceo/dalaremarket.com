// 사용자 정보 기반 자동 조직 생성

import { createClient } from '@/lib/supabase/server'
import { getDefaultPermissions } from '@/lib/organization-utils'

/**
 * 사용자의 사업자 정보를 기반으로 조직 자동 생성
 * 회원가입 시 또는 사업자 정보 업데이트 시 호출
 */
export async function autoCreateOrganizationFromUser(userId: string) {
  // ✅ RLS 우회를 위해 Service Role 클라이언트 사용
  const { createAdminClient } = await import('@/lib/supabase/server')
  const supabase = createAdminClient()

  // 1. 사용자 정보 조회
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (userError || !user) {
    console.error('사용자 정보 조회 실패:', userError)
    return { success: false, error: '사용자 정보를 찾을 수 없습니다' }
  }

  // 2. 이미 조직이 있는지 확인
  if (user.primary_organization_id) {
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', user.primary_organization_id)
      .single()

    if (existingOrg) {
      return { success: true, organization_id: existingOrg.id, already_exists: true }
    }
  }

  // 3. owner_id로 조직이 있는지 확인 (primary_organization_id가 없는 경우)
  const { data: orgByOwner } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('owner_id', userId)
    .single()

  if (orgByOwner) {
    // 조직이 있는데 primary_organization_id가 설정되지 않은 경우 업데이트
    if (!user.primary_organization_id) {
      await supabase.rpc('exec_sql', {
        sql: `UPDATE users SET primary_organization_id = '${orgByOwner.id}' WHERE id = '${userId}'`
      })
    }
    return {
      success: true,
      organization_id: orgByOwner.id,
      organization_name: orgByOwner.name,
      already_exists: true
    }
  }

  // 4. 셀러계정명 결정
  // 우선순위: company_name > profile_name > name > email
  const organizationName =
    user.company_name ||
    (user.profile_name ? `${user.profile_name}님의 셀러계정` : null) ||
    (user.name ? `${user.name}님의 셀러계정` : null) ||
    `${user.email?.split('@')[0]}님의 셀러계정` ||
    '내 셀러계정'

  // 5. 조직 생성 (RLS 우회를 위해 raw SQL 사용)

  const { error: orgError } = await supabase.rpc('exec_sql', {
    sql: `
      INSERT INTO organizations (
        name, business_number, address, phone, email,
        representative_name, commission_rate, settlement_cycle,
        bank_name, account_number, account_holder, tax_invoice_email,
        owner_id, is_active, max_members
      ) VALUES (
        '${organizationName.replace(/'/g, "''")}',
        ${user.business_number ? `'${user.business_number}'` : 'NULL'},
        ${user.company_address ? `'${user.company_address.replace(/'/g, "''")}'` : 'NULL'},
        ${user.representative_phone ? `'${user.representative_phone}'` : 'NULL'},
        ${user.email ? `'${user.email}'` : 'NULL'},
        ${user.representative_name ? `'${user.representative_name.replace(/'/g, "''")}'` : 'NULL'},
        ${user.commission_rate || 0},
        '${user.settlement_cycle || '월1회'}',
        ${user.bank_name ? `'${user.bank_name.replace(/'/g, "''")}'` : 'NULL'},
        ${user.account_number ? `'${user.account_number}'` : 'NULL'},
        ${user.account_holder ? `'${user.account_holder.replace(/'/g, "''")}'` : 'NULL'},
        ${user.tax_invoice_email ? `'${user.tax_invoice_email}'` : 'NULL'},
        '${userId}',
        true,
        10
      )
    `
  })

  if (orgError) {
    console.error('셀러계정 생성 실패:', orgError)
    return { success: false, error: '셀러계정 생성에 실패했습니다' }
  }

  // 생성된 셀러계정 ID 조회
  const { data: newOrg, error: fetchError} = await supabase
    .from('organizations')
    .select('id, name')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (fetchError || !newOrg) {
    console.error('생성된 셀러계정 조회 실패:', fetchError)
    return { success: false, error: '셀러계정을 생성했지만 조회에 실패했습니다' }
  }

  const organization = newOrg

  // 6. 소유자를 조직 멤버로 추가 (Service Role로 RLS 우회)
  const ownerPermissions = getDefaultPermissions('owner')

  // ✅ RLS 우회를 위해 raw SQL 사용 (ON CONFLICT로 중복 방지)
  const { error: memberError } = await supabase.rpc('exec_sql', {
    sql: `
      INSERT INTO organization_members (
        organization_id, user_id, role, status, joined_at,
        can_manage_members, can_manage_orders, can_manage_products, can_view_financials
      ) VALUES (
        '${organization.id}', '${userId}', 'owner', 'active', NOW(),
        ${ownerPermissions.can_manage_members}, ${ownerPermissions.can_manage_orders},
        ${ownerPermissions.can_manage_products}, ${ownerPermissions.can_view_financials}
      )
      ON CONFLICT (organization_id, user_id) DO NOTHING
    `
  })

  if (memberError) {
    console.error('멤버 추가 실패:', memberError)
    // 셀러계정 삭제 (롤백)
    await supabase.from('organizations').delete().eq('id', organization.id)
    return { success: false, error: '셀러계정 멤버 추가에 실패했습니다' }
  }

  // 7. 사용자의 primary_organization_id 업데이트 (Service Role로 RLS 우회)
  const { error: updateError } = await supabase.rpc('exec_sql', {
    sql: `UPDATE users SET primary_organization_id = '${organization.id}' WHERE id = '${userId}'`
  })

  if (updateError) {
    console.error('사용자 셀러계정 ID 업데이트 실패:', updateError)
  }

  // 8. 기존 주문에 셀러계정 ID 매핑 (Service Role로 RLS 우회)
  await supabase.rpc('exec_sql', {
    sql: `
      UPDATE integrated_orders
      SET organization_id = '${organization.id}'
      WHERE seller_id = '${userId}' AND organization_id IS NULL
    `
  })

  return {
    success: true,
    organization_id: organization.id,
    organization_name: organization.name,
  }
}

/**
 * 사용자 정보 업데이트 시 조직 정보도 동기화
 */
export async function syncOrganizationFromUser(userId: string) {
  const supabase = await createClient()

  // 1. 사용자 정보 조회
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (!user || !user.primary_organization_id) {
    return { success: false, error: '셀러계정 정보가 없습니다' }
  }

  // 2. 셀러계정 정보 업데이트
  const organizationName =
    user.company_name ||
    (user.profile_name ? `${user.profile_name}님의 셀러계정` : null) ||
    `${user.email?.split('@')[0]}님의 셀러계정` ||
    '내 셀러계정'

  const { error: updateError } = await supabase
    .from('organizations')
    .update({
      name: organizationName,
      business_number: user.business_number,
      address: user.company_address,
      phone: user.representative_phone,
      email: user.email,
      representative_name: user.representative_name,
      commission_rate: user.commission_rate || 0,
      settlement_cycle: user.settlement_cycle || '월1회',
      bank_name: user.bank_name,
      account_number: user.account_number,
      account_holder: user.account_holder,
      tax_invoice_email: user.tax_invoice_email,
    })
    .eq('id', user.primary_organization_id)
    .eq('owner_id', userId) // 소유자만 업데이트 가능

  if (updateError) {
    console.error('셀러계정 정보 동기화 실패:', updateError)
    return { success: false, error: '셀러계정 정보 동기화에 실패했습니다' }
  }

  return { success: true }
}
