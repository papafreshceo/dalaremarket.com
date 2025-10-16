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
  icon?: React.ReactNode
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
  { name: '대시보드', path: '/admin/dashboard', description: '전체 현황 및 통계' },
  { name: '상품관리', path: '/admin/products', description: '상품 등록 및 관리' },
  { name: '플랫폼주문', path: '/admin/order-platform', description: '플랫폼 주문 관리' },
  { name: '주문통합관리', path: '/admin/order-integration', description: '통합 주문 관리' },
  { name: '구매관리', path: '/admin/purchase', description: '구매 발주 관리' },
  { name: '농가관리', path: '/admin/farms', description: '농가 정보 관리' },
  { name: '재고관리', path: '/admin/inventory', description: '재고 현황 관리' },
  { name: '고객관리', path: '/admin/customers', description: '고객 정보 관리' },
  { name: '거래처관리', path: '/admin/partners', description: '거래처 정보 관리' },
  { name: '지출관리', path: '/admin/expense', description: '지출 내역 관리' },
  { name: '근로자관리', path: '/admin/workers', description: '근로자 정보 관리' },
  { name: '전자문서', path: '/admin/documents', description: '문서 작성 및 관리' },
  { name: '업무계획', path: '/admin/planning', description: '업무 일정 관리' },
  { name: '설정', path: '/admin/settings', description: '시스템 설정' },
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
