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

// 관리자 페이지 목록 (admin layout의 menuItems와 동일)
export const ADMIN_PAGES: PageInfo[] = [
  { name: '대시보드', path: '/admin/dashboard', description: '전체 현황 및 통계', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { name: '상품관리', path: '/admin/products', description: '상품 등록 및 관리', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { name: '플랫폼주문', path: '/admin/order-platform', description: '플랫폼 주문 관리', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
  { name: '주문통합관리', path: '/admin/order-integration', description: '통합 주문 관리', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { name: '구매관리', path: '/admin/purchase', description: '구매 발주 관리', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
  { name: '농가관리', path: '/admin/farms', description: '농가 정보 관리', icon: 'M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9' },
  { name: '재고관리', path: '/admin/inventory', description: '재고 현황 관리', icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4' },
  { name: '고객관리', path: '/admin/customers', description: '고객 정보 관리', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { name: '거래처관리', path: '/admin/partners', description: '거래처 정보 관리', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { name: '지출관리', path: '/admin/expense', description: '지출 내역 관리', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { name: '근로자관리', path: '/admin/workers', description: '근로자 정보 관리', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
  { name: '전자문서', path: '/admin/documents', description: '문서 작성 및 관리', icon: 'M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2' },
  { name: '업무계획', path: '/admin/planning', description: '업무 일정 관리', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { name: '공지사항', path: '/admin/notices', description: '공지사항 작성 및 관리', icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z' },
  { name: '회원관리', path: '/admin/members', description: '플랫폼 회원 관리', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { name: '설정', path: '/admin/settings', description: '시스템 설정', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  { name: '디자인 테마', path: '/admin/design-themes', description: '디자인 테마 관리', icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01' },
  { name: 'Google 분석', path: '/admin/analytics', description: 'Google Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0h2a2 2 0 012 2v6a2 2 0 01-2 2h-2a2 2 0 01-2-2v-6z' },
]

// 권한 액션 타입
export type PermissionAction = 'create' | 'read' | 'update' | 'delete'

// 권한 액션 정보
export const PERMISSION_ACTIONS: Record<PermissionAction, { label: string; description: string; color: string }> = {
  create: { label: '생성', description: '새로운 데이터 생성', color: 'green' },
  read: { label: '조회', description: '데이터 조회', color: 'blue' },
  update: { label: '수정', description: '데이터 수정', color: 'yellow' },
  delete: { label: '삭제', description: '데이터 삭제', color: 'red' },
}
