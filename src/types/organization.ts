// 조직 시스템 타입 정의

// 조직 역할
export type OrganizationRole = 'owner' | 'member'

// 멤버 상태
export type MemberStatus = 'active' | 'invited' | 'suspended'

// 초대 상태
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled'

// 조직 정보
export interface Organization {
  id: string
  business_name?: string  // name → business_name
  business_number?: string
  business_address?: string  // address → business_address
  business_email?: string  // email → business_email
  representative_name?: string
  representative_phone?: string  // phone → representative_phone
  manager_name?: string
  manager_phone?: string
  bank_name?: string
  bank_account?: string  // account_number → bank_account
  account_holder?: string
  depositor_name?: string
  store_name?: string
  store_phone?: string
  seller_code?: string
  partner_code?: string
  tier?: string
  owner_id: string
  is_active: boolean
  memo?: string
  created_at: string
  updated_at: string
}

// 조직 멤버
export interface OrganizationMember {
  id: string
  organization_id: string
  user_id: string
  role: OrganizationRole
  status: MemberStatus
  invited_by?: string
  invited_at?: string
  joined_at?: string
  can_manage_orders: boolean
  can_manage_products: boolean
  can_manage_members: boolean
  can_view_financials: boolean
  memo?: string
  created_at: string
  updated_at: string
}

// 조직 초대
export interface OrganizationInvitation {
  id: string
  organization_id: string
  inviter_id: string
  email: string
  role: OrganizationRole
  token: string
  status: InvitationStatus
  expires_at: string
  accepted_at?: string
  accepted_by?: string
  message?: string
  created_at: string
  updated_at: string
}

// 조직 멤버 (사용자 정보 포함)
export interface OrganizationMemberWithUser extends OrganizationMember {
  user: {
    id: string
    email: string
    profile_name?: string
    name?: string
    phone?: string
  }
}

// 조직 정보 (소유자 정보 포함)
export interface OrganizationWithOwner extends Organization {
  owner: {
    id: string
    email: string
    profile_name?: string
  }
  member_count?: number
}

// 조직 생성 요청
export interface CreateOrganizationRequest {
  business_name: string
  business_number?: string
  business_address?: string
  business_email?: string
  representative_name?: string
  representative_phone?: string
  manager_name?: string
  manager_phone?: string
  bank_name?: string
  bank_account?: string
  account_holder?: string
  depositor_name?: string
  store_name?: string
  store_phone?: string
}

// 조직 업데이트 요청
export interface UpdateOrganizationRequest {
  business_name?: string
  business_number?: string
  business_address?: string
  business_email?: string
  representative_name?: string
  representative_phone?: string
  manager_name?: string
  manager_phone?: string
  bank_name?: string
  bank_account?: string
  account_holder?: string
  depositor_name?: string
  store_name?: string
  store_phone?: string
  is_active?: boolean
  memo?: string
}

// 멤버 초대 요청
export interface InviteMemberRequest {
  email: string
  role?: OrganizationRole
  message?: string
  permissions?: {
    can_manage_orders?: boolean
    can_manage_products?: boolean
    can_manage_members?: boolean
    can_view_financials?: boolean
  }
}

// 멤버 역할 업데이트 요청
export interface UpdateMemberRoleRequest {
  member_id: string
  role?: OrganizationRole
  permissions?: {
    can_manage_orders?: boolean
    can_manage_products?: boolean
    can_manage_members?: boolean
    can_view_financials?: boolean
  }
}

// 조직 컨텍스트 (현재 사용자의 조직 정보)
export interface OrganizationContext {
  organization: Organization
  member: OrganizationMember
  is_owner: boolean
  is_admin: boolean
  can_manage_members: boolean
}

// 역할별 권한 정의
export const ROLE_PERMISSIONS: Record<OrganizationRole, {
  can_manage_orders: boolean
  can_manage_products: boolean
  can_manage_members: boolean
  can_view_financials: boolean
}> = {
  owner: {
    can_manage_orders: true,
    can_manage_products: true,
    can_manage_members: true,
    can_view_financials: true,
  },
  member: {
    can_manage_orders: true,
    can_manage_products: true,
    can_manage_members: false,
    can_view_financials: false,
  },
}

// 역할 표시명
export const ROLE_LABELS: Record<OrganizationRole, string> = {
  owner: '소유자',
  member: '담당자',
}

// 상태 표시명
export const STATUS_LABELS: Record<MemberStatus, string> = {
  active: '활성',
  invited: '초대됨',
  suspended: '정지',
}

// 초대 상태 표시명
export const INVITATION_STATUS_LABELS: Record<InvitationStatus, string> = {
  pending: '대기 중',
  accepted: '수락됨',
  expired: '만료됨',
  cancelled: '취소됨',
}
