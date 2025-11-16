// 사용자 정보 기반 자동 조직 생성

import { createClient } from '@/lib/supabase/server'
import { getDefaultPermissions } from '@/lib/organization-utils'

/**
 * 사용자의 사업자 정보를 기반으로 조직 자동 생성
 * 회원가입 시 또는 사업자 정보 업데이트 시 호출
 */
export async function autoCreateOrganizationFromUser(userId: string) {
  // ⚠️ RLS 우회를 위해 Service Role 클라이언트 사용
  const { createAdminClient } = await import('@/lib/supabase/server')
  const supabase = createAdminClient()

  console.log('🔍 [autoCreate] 시작 - userId:', userId)

  // 1. 사용자 정보 조회
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (userError || !user) {
    console.error('❌ [autoCreate] 사용자 정보 조회 실패:', userError)
    return { success: false, error: '사용자 정보를 찾을 수 없습니다' }
  }

  console.log('✅ [autoCreate] 사용자 발견:', {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    primary_organization_id: user.primary_organization_id
  })

  // 2. 기존 조직이 있는지 확인
  if (user.primary_organization_id) {
    console.log('🔍 [autoCreate] primary_organization_id 확인:', user.primary_organization_id)
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id, business_name, owner_id')
      .eq('id', user.primary_organization_id)
      .single()

    if (existingOrg) {
      console.log('⚠️ [autoCreate] 기존 조직 발견:', {
        id: existingOrg.id,
        name: existingOrg.business_name,
        owner_id: existingOrg.owner_id,
        is_user_owner: existingOrg.owner_id === userId
      })
      return { success: true, organization_id: existingOrg.id, already_exists: true }
    }
  }

  // 3. owner_id로 조직이 있는지 확인 (primary_organization_id가 없는 경우)
  console.log('🔍 [autoCreate] owner_id로 조직 검색:', userId)
  const { data: orgByOwner, error: ownerError } = await supabase
    .from('organizations')
    .select('id, business_name, owner_id')
    .eq('owner_id', userId)
    .single()

  console.log('📊 [autoCreate] owner_id 검색 결과:', {
    found: !!orgByOwner,
    error: ownerError?.message,
    data: orgByOwner
  })

  if (orgByOwner) {
    // 조직이 있는데 primary_organization_id가 설정되지 않은 경우 업데이트
    if (!user.primary_organization_id) {
      await supabase
        .from('users')
        .update({ primary_organization_id: orgByOwner.id })
        .eq('id', userId)
    }

    // 멤버 레코드가 있는지 확인
    const { data: existingMember } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', orgByOwner.id)
      .eq('user_id', userId)
      .single()

    // 멤버 레코드가 없으면 추가 (탈퇴 후 재생성 케이스)
    if (!existingMember) {
      console.log('👤 [autoCreate] 기존 조직에 멤버 추가')
      const ownerPermissions = getDefaultPermissions('owner')
      await supabase
        .from('organization_members')
        .insert({
          organization_id: orgByOwner.id,
          user_id: userId,
          role: 'owner',
          status: 'active',
          joined_at: new Date().toISOString(),
          can_manage_members: ownerPermissions.can_manage_members,
          can_manage_orders: ownerPermissions.can_manage_orders,
          can_manage_products: ownerPermissions.can_manage_products,
          can_view_financials: ownerPermissions.can_view_financials,
        })
      console.log('✅ [autoCreate] 멤버 추가 완료')
    }

    return {
      success: true,
      organization_id: orgByOwner.id,
      organization_name: orgByOwner.business_name,
      already_exists: true
    }
  }

  // 4. 조직 생성 (RLS 우회를 위해 Service Role로 직접 INSERT)
  console.log('🔨 조직 생성 시작')

  const { data: newOrganization, error: orgError } = await supabase
    .from('organizations')
    .insert({
      owner_id: userId,
      is_active: true,
    })
    .select()
    .single()

  if (orgError || !newOrganization) {
    console.error('셀러계정 생성 실패:', orgError)
    return { success: false, error: '셀러계정 생성에 실패했습니다' }
  }

  console.log('✅ 조직 생성 성공:', newOrganization.id, newOrganization.business_name)

  const organization = newOrganization

  // 5. 소유자로 조직 멤버 추가 (Service Role로 RLS 우회)
  const ownerPermissions = getDefaultPermissions('owner')
  console.log('👤 멤버 추가 시작')

  const { error: memberError } = await supabase
    .from('organization_members')
    .insert({
      organization_id: organization.id,
      user_id: userId,
      role: 'owner',
      status: 'active',
      joined_at: new Date().toISOString(),
      can_manage_members: ownerPermissions.can_manage_members,
      can_manage_orders: ownerPermissions.can_manage_orders,
      can_manage_products: ownerPermissions.can_manage_products,
      can_view_financials: ownerPermissions.can_view_financials,
    })

  if (memberError) {
    console.error('멤버 추가 실패:', memberError)
    // 셀러계정 삭제 (롤백)
    await supabase.from('organizations').delete().eq('id', organization.id)
    return { success: false, error: '셀러계정 멤버 추가에 실패했습니다' }
  }

  console.log('✅ 멤버 추가 성공')

  // 7. 사용자의 primary_organization_id 업데이트 (Service Role로 RLS 우회)
  console.log('🔄 primary_organization_id 업데이트 시작')
  const { error: updateError } = await supabase
    .from('users')
    .update({ primary_organization_id: organization.id })
    .eq('id', userId)

  if (updateError) {
    console.error('사용자 셀러계정 ID 업데이트 실패:', updateError)
  } else {
    console.log('✅ primary_organization_id 업데이트 성공')
  }

  // 8. 기존 주문에 조직 ID 매핑 (created_by 기준으로 변경)
  console.log('📦 기존 주문 매핑 시작')
  await supabase
    .from('integrated_orders')
    .update({ organization_id: organization.id })
    .eq('created_by', userId)
    .is('organization_id', null)

  console.log('✅ 기존 주문 매핑 완료')

  // 9. 셀러코드 생성
  try {
    console.log('🔑 셀러코드 생성 시작')
    const { generateUserCodes } = await import('@/lib/user-codes')
    await generateUserCodes(userId)
    console.log('✅ 셀러코드 생성 완료')
  } catch (codeError) {
    console.error('셀러코드 생성 실패:', codeError)
    // 셀러코드 생성 실패해도 조직 생성은 성공으로 처리
  }

  return {
    success: true,
    organization_id: organization.id,
    organization_name: organization.business_name,
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

  // 2. 셀러계정 정보 업데이트 (users 테이블에는 조직 관련 필드 없음)
  const { error: updateError } = await supabase
    .from('organizations')
    .update({
      business_email: user.email,
    })
    .eq('id', user.primary_organization_id)
    .eq('owner_id', userId) // 소유자만 업데이트 가능

  if (updateError) {
    console.error('셀러계정 정보 동기화 실패:', updateError)
    return { success: false, error: '셀러계정 정보 동기화에 실패했습니다' }
  }

  return { success: true }
}
