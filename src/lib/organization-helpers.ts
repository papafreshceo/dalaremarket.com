/**
 * 조직(Organization) 관련 헬퍼 함수
 * 메인/서브 셀러계정 시스템 지원
 */

import { createClient } from '@/lib/supabase/server'

export interface Organization {
  id: string
  name: string
  owner_id: string
  parent_organization_id: string | null
  is_main: boolean
  business_number?: string
  business_name?: string
  address?: string
  email?: string
  representative_name?: string
  bank_name?: string
  account_number?: string
  account_holder?: string
  tier?: string | null
  tier_updated_at?: string | null
  is_manual_tier?: boolean
  accumulated_points?: number
  created_at: string
  updated_at: string
}

/**
 * 메인 계정 조회
 * - 현재 조직이 메인이면 그대로 반환
 * - 서브 계정이면 부모(메인) 조직 조회
 */
export async function getMainOrganization(
  organizationId: string
): Promise<Organization | null> {
  const supabase = await createClient()

  // 현재 조직 조회
  const { data: currentOrg, error: currentError } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', organizationId)
    .single()

  if (currentError || !currentOrg) {
    console.error('조직 조회 실패:', currentError)
    return null
  }

  // 메인 계정이면 그대로 반환
  if (currentOrg.is_main) {
    return currentOrg as Organization
  }

  // 서브 계정이면 부모 조직 조회
  if (currentOrg.parent_organization_id) {
    const { data: parentOrg, error: parentError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', currentOrg.parent_organization_id)
      .single()

    if (parentError || !parentOrg) {
      console.error('부모 조직 조회 실패:', parentError)
      return null
    }

    return parentOrg as Organization
  }

  return null
}

/**
 * 사용자의 메인 계정 조회
 */
export async function getUserMainOrganization(
  userId: string
): Promise<Organization | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('owner_id', userId)
    .eq('is_main', true)
    .single()

  if (error || !data) {
    console.error('사용자 메인 조직 조회 실패:', error)
    return null
  }

  return data as Organization
}

/**
 * 사용자의 모든 셀러계정 조회 (메인 + 서브)
 */
export async function getUserOrganizations(userId: string): Promise<Organization[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('owner_id', userId)
    .order('is_main', { ascending: false }) // 메인이 먼저
    .order('created_at', { ascending: true })

  if (error) {
    console.error('사용자 조직 목록 조회 실패:', error)
    return []
  }

  return (data as Organization[]) || []
}

/**
 * 서브 계정 목록 조회
 */
export async function getSubOrganizations(
  mainOrganizationId: string
): Promise<Organization[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('parent_organization_id', mainOrganizationId)
    .eq('is_main', false)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('서브 조직 목록 조회 실패:', error)
    return []
  }

  return (data as Organization[]) || []
}

/**
 * 조직의 캐시/크레딧/기여점수/티어 조회
 * - 서브 계정인 경우 메인 계정의 값 반환
 */
export async function getOrganizationBalance(organizationId: string) {
  const mainOrg = await getMainOrganization(organizationId)

  if (!mainOrg) {
    return {
      cash: 0,
      credits: 0,
      contribution_points: 0,
      tier: null,
    }
  }

  const supabase = await createClient()

  // 캐시 조회
  const { data: cashData } = await supabase
    .from('organization_cash')
    .select('balance')
    .eq('organization_id', mainOrg.id)
    .single()

  // 크레딧 조회
  const { data: creditsData } = await supabase
    .from('organization_credits')
    .select('balance')
    .eq('organization_id', mainOrg.id)
    .single()

  // 조직 정보 조회 (기여점수, 티어) - 이미 mainOrg에 있음
  return {
    cash: cashData?.balance || 0,
    credits: creditsData?.balance || 0,
    contribution_points: mainOrg.accumulated_points || 0,
    tier: mainOrg.tier || null,
  }
}

/**
 * 조직이 메인 계정인지 확인
 */
export async function isMainOrganization(organizationId: string): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('organizations')
    .select('is_main')
    .eq('id', organizationId)
    .single()

  if (error || !data) {
    return false
  }

  return data.is_main === true
}

/**
 * 사용자가 추가 계정을 생성할 수 있는지 확인
 * 티어별 제한: Light 1개, Standard 2개, Advance/Elite/Legend 3개
 */
export async function canCreateSubOrganization(
  userId: string,
  userTier: string | null
): Promise<{ canCreate: boolean; currentCount: number; maxCount: number }> {
  const orgs = await getUserOrganizations(userId)
  const currentCount = orgs.length

  // 티어별 최대 계정 수
  const getMaxAccounts = (tier: string | null) => {
    if (!tier) return 2
    const lowerTier = tier.toLowerCase()
    switch (lowerTier) {
      case 'light':
        return 2
      case 'standard':
        return 2
      case 'advance':
      case 'elite':
      case 'legend':
        return 3
      default:
        return 2
    }
  }

  const maxCount = getMaxAccounts(userTier)
  const canCreate = currentCount < maxCount

  return { canCreate, currentCount, maxCount }
}
