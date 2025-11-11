// 조직 관련 유틸리티 함수

import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import {
  Organization,
  OrganizationMember,
  OrganizationContext,
  OrganizationRole,
  ROLE_PERMISSIONS,
} from '@/types/organization'

/**
 * 사용자의 주 소속 조직 가져오기 (서버용)
 * RLS 무한 재귀 방지를 위해 Service Role 직접 사용
 */
export async function getUserPrimaryOrganization(
  userId: string
): Promise<Organization | null> {
  // Service Role 클라이언트 사용 (RLS 우회)
  const { createAdminClient } = await import('@/lib/supabase/server')
  const supabase = createAdminClient()

  // ✅ 먼저 사용자의 primary_organization_id 조회
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('primary_organization_id')
    .eq('id', userId)
    .single()

  if (userError || !user?.primary_organization_id) {
    return null
  }

  // ✅ 조직 정보 직접 조회 (Service Role이므로 RLS 우회)
  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', user.primary_organization_id)
    .single()

  if (orgError || !organization) {
    return null
  }

  return organization as Organization
}

/**
 * 사용자의 주 소속 조직 가져오기 (클라이언트용)
 */
export async function getUserPrimaryOrganizationClient(
  userId: string
): Promise<Organization | null> {
  const supabase = createBrowserClient()

  const { data: user } = await supabase
    .from('users')
    .select('primary_organization_id')
    .eq('id', userId)
    .single()

  if (!user?.primary_organization_id) {
    return null
  }

  const { data: organization } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', user.primary_organization_id)
    .single()

  return organization
}

/**
 * 조직의 멤버 정보 가져오기
 */
export async function getOrganizationMember(
  organizationId: string,
  userId: string
): Promise<OrganizationMember | null> {
  const supabase = await createServerClient()

  const { data: member } = await supabase
    .from('organization_members')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  return member
}

/**
 * 조직의 멤버 정보 가져오기 (클라이언트용)
 */
export async function getOrganizationMemberClient(
  organizationId: string,
  userId: string
): Promise<OrganizationMember | null> {
  const supabase = createBrowserClient()

  const { data: member } = await supabase
    .from('organization_members')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  return member
}

/**
 * 사용자의 조직 컨텍스트 가져오기 (조직 + 멤버 정보)
 */
export async function getUserOrganizationContext(
  userId: string
): Promise<OrganizationContext | null> {
  const organization = await getUserPrimaryOrganization(userId)
  if (!organization) {
    return null
  }

  const member = await getOrganizationMember(organization.id, userId)
  if (!member) {
    return null
  }

  return {
    organization,
    member,
    is_owner: member.role === 'owner',
    is_admin: member.role === 'admin' || member.role === 'owner',
    can_manage_members: member.can_manage_members,
  }
}

/**
 * 사용자가 조직 멤버인지 확인
 */
export async function isOrganizationMember(
  organizationId: string,
  userId: string
): Promise<boolean> {
  const member = await getOrganizationMember(organizationId, userId)
  return member !== null
}

/**
 * 사용자가 조직 소유자인지 확인
 */
export async function isOrganizationOwner(
  organizationId: string,
  userId: string
): Promise<boolean> {
  const member = await getOrganizationMember(organizationId, userId)
  return member?.role === 'owner'
}

/**
 * 사용자가 조직 관리자인지 확인 (소유자 + 관리자)
 */
export async function isOrganizationAdmin(
  organizationId: string,
  userId: string
): Promise<boolean> {
  const member = await getOrganizationMember(organizationId, userId)
  return member?.role === 'owner' || member?.role === 'admin'
}

/**
 * 멤버 관리 권한 확인
 */
export async function canManageMembers(
  organizationId: string,
  userId: string
): Promise<boolean> {
  const member = await getOrganizationMember(organizationId, userId)
  return member?.can_manage_members === true
}

/**
 * 주문 관리 권한 확인
 */
export async function canManageOrders(
  organizationId: string,
  userId: string
): Promise<boolean> {
  const member = await getOrganizationMember(organizationId, userId)
  return member?.can_manage_orders === true
}

/**
 * 상품 관리 권한 확인
 */
export async function canManageProducts(
  organizationId: string,
  userId: string
): Promise<boolean> {
  const member = await getOrganizationMember(organizationId, userId)
  return member?.can_manage_products === true
}

/**
 * 재무 정보 조회 권한 확인
 */
export async function canViewFinancials(
  organizationId: string,
  userId: string
): Promise<boolean> {
  const member = await getOrganizationMember(organizationId, userId)
  return member?.can_view_financials === true
}

/**
 * 조직의 모든 멤버 가져오기 (사용자 정보 포함)
 */
export async function getOrganizationMembers(organizationId: string) {
  const supabase = await createServerClient()

  const { data: members, error } = await supabase
    .from('organization_members')
    .select(`
      *,
      user:users(
        id,
        email,
        profile_name,
        company_name,
        manager_name,
        manager_phone
      )
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('조직 멤버 조회 실패:', error)
    return []
  }

  return members
}

/**
 * 조직 초대 토큰 생성
 */
export function generateInvitationToken(): string {
  return crypto.randomUUID()
}

/**
 * 초대 만료 시간 계산 (기본 7일)
 */
export function getInvitationExpiryDate(days: number = 7): string {
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + days)
  return expiryDate.toISOString()
}

/**
 * 초대 토큰으로 초대 정보 가져오기
 */
export async function getInvitationByToken(token: string) {
  const supabase = await createServerClient()

  const { data: invitation, error } = await supabase
    .from('organization_invitations')
    .select(`
      *,
      organization:organizations(*),
      inviter:users!inviter_id(
        id,
        email,
        profile_name,
        company_name
      )
    `)
    .eq('token', token)
    .eq('status', 'pending')
    .single()

  if (error) {
    console.error('초대 정보 조회 실패:', error)
    return null
  }

  // 만료 확인
  if (new Date(invitation.expires_at) < new Date()) {
    // 만료 상태로 업데이트
    await supabase
      .from('organization_invitations')
      .update({ status: 'expired' })
      .eq('id', invitation.id)

    return null
  }

  return invitation
}

/**
 * 역할별 기본 권한 가져오기
 */
export function getDefaultPermissions(role: OrganizationRole) {
  return ROLE_PERMISSIONS[role]
}

/**
 * 조직 멤버 수 확인
 */
export async function getOrganizationMemberCount(
  organizationId: string
): Promise<number> {
  const supabase = await createServerClient()

  const { count, error } = await supabase
    .from('organization_members')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('status', 'active')

  if (error) {
    console.error('멤버 수 조회 실패:', error)
    return 0
  }

  return count || 0
}

/**
 * 조직의 최대 멤버 수 제한 확인
 */
export async function canAddMember(organizationId: string): Promise<boolean> {
  const supabase = await createServerClient()

  const { data: organization } = await supabase
    .from('organizations')
    .select('max_members')
    .eq('id', organizationId)
    .single()

  if (!organization) {
    return false
  }

  const currentCount = await getOrganizationMemberCount(organizationId)
  return currentCount < organization.max_members
}

/**
 * 조직의 모든 사용자 ID 가져오기 (캐시/크레딧 공유용)
 */
export async function getOrganizationUserIds(
  organizationId: string
): Promise<string[]> {
  const supabase = await createServerClient()

  const { data: members, error } = await supabase
    .from('organization_members')
    .select('user_id')
    .eq('organization_id', organizationId)
    .eq('status', 'active')

  if (error) {
    console.error('조직 사용자 ID 조회 실패:', error)
    return []
  }

  return members.map((m) => m.user_id)
}

/**
 * 주문에 조직 ID 자동 설정
 */
export async function assignOrderToOrganization(
  orderId: string,
  userId: string
) {
  const supabase = await createServerClient()

  // 사용자의 주 소속 조직 가져오기
  const { data: user } = await supabase
    .from('users')
    .select('primary_organization_id')
    .eq('id', userId)
    .single()

  if (!user?.primary_organization_id) {
    return
  }

  // 주문에 조직 ID 설정
  await supabase
    .from('integrated_orders')
    .update({ organization_id: user.primary_organization_id })
    .eq('id', orderId)
}

/**
 * 조직 데이터 조회 필터 (같은 조직 데이터만 조회)
 */
export async function getOrganizationDataFilter(userId: string) {
  const supabase = await createServerClient()

  const { data: user } = await supabase
    .from('users')
    .select('primary_organization_id')
    .eq('id', userId)
    .single()

  return user?.primary_organization_id || null
}
