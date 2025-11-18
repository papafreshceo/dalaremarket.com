// 역할 타입
export type UserRole = 'super_admin' | 'admin' | 'employee' | 'partner' | 'vip_customer' | 'customer'

// 권한 타입
export interface Permission {
  id: string
  role: UserRole
  page_path: string
  can_access: boolean
  can_create: boolean
  can_read: boolean
  can_update: boolean
  can_delete: boolean
  created_at: string
  updated_at: string
}

// 페이지 정보 타입
export interface PageInfo {
  name: string
  path: string
  icon?: string // SVG path data
  description?: string
  category?: string
  group?: string
}

// 역할 정보 타입
export interface RoleInfo {
  value: UserRole
  label: string
  description: string
  color: string
}

// 역할별 정보
export const ROLE_INFO: Record<UserRole, RoleInfo> = {
  super_admin: {
    value: 'super_admin',
    label: '최고관리자',
    description: '모든 시스템 권한 보유',
    color: 'red'
  },
  admin: {
    value: 'admin',
    label: '관리자',
    description: '대부분의 관리 권한 보유',
    color: 'blue'
  },
  employee: {
    value: 'employee',
    label: '직원',
    description: '기본 업무 권한만 보유',
    color: 'green'
  },
  partner: {
    value: 'partner',
    label: '파트너',
    description: '제한적 접근 권한',
    color: 'purple'
  },
  vip_customer: {
    value: 'vip_customer',
    label: 'VIP고객',
    description: 'VIP 고객 권한',
    color: 'yellow'
  },
  customer: {
    value: 'customer',
    label: '일반고객',
    description: '일반 고객 권한',
    color: 'gray'
  }
}

// 관리자 페이지 목록을 메뉴에서 자동으로 추출하는 함수
function extractAdminPagesFromMenu(): PageInfo[] {
  // 런타임에 메뉴 구조를 import하여 동적으로 추출
  try {
    const menuModule = require('@/config/admin-menu')
    const menuGroups = menuModule.menuGroups || []
    const menuCategories = menuModule.menuCategories || []

    const pages: PageInfo[] = []

    // 카테고리 맵 생성
    const categoryMap = new Map(menuCategories.map((cat: any) => [cat.id, cat.name]))

    menuGroups.forEach((group: any) => {
      if (group.items && Array.isArray(group.items)) {
        group.items.forEach((item: any) => {
          // divider 제외
          if (item.href && item.name) {
            pages.push({
              name: item.name,
              path: item.href,
              description: `${group.name} > ${item.name}`,
              category: categoryMap.get(group.category) || group.category,
              group: group.name,
            })
          }
        })
      }
    })

    return pages
  } catch (error) {
    console.error('Failed to extract pages from menu:', error)
    // 폴백: 기본 페이지 목록
    return [
      { name: '대시보드', path: '/admin/dashboard', description: '전체 현황 및 통계', category: '운영', group: '주문관리' },
    ]
  }
}

// 관리자 페이지 목록 (메뉴 기반 자동 생성)
export const ADMIN_PAGES: PageInfo[] = extractAdminPagesFromMenu()

// 권한 액션 타입
export type PermissionAction = 'create' | 'read' | 'update' | 'delete'

// 권한 액션 정보
export const PERMISSION_ACTIONS: Record<PermissionAction, { label: string; description: string; color: string }> = {
  create: { label: '생성', description: '새로운 데이터 생성', color: 'green' },
  read: { label: '조회', description: '데이터 조회', color: 'blue' },
  update: { label: '수정', description: '데이터 수정', color: 'yellow' },
  delete: { label: '삭제', description: '데이터 삭제', color: 'red' },
}
