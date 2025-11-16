// 알림 시스템 타입 정의

// 알림 타입
export type NotificationType =
  | 'organization_invitation'  // 셀러계정 초대
  | 'order_update'             // 주문 업데이트
  | 'system_notice'            // 시스템 공지
  | 'payment_update'           // 결제/정산 업데이트

// 알림
export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body?: string
  message?: string
  data?: Record<string, any>
  is_read: boolean
  read_at?: string
  created_at: string
  updated_at?: string
}

// 조직 초대 알림 데이터
export interface OrganizationInvitationData {
  invitation_id: string
  organization_id: string
  organization_name: string
  inviter_id: string
  inviter_name: string
  role: 'owner' | 'admin' | 'member'
  custom_message?: string
}

// 주문 업데이트 알림 데이터
export interface OrderUpdateData {
  order_id: string
  order_number: string
  status: string
  message: string
}

// 알림 생성 요청
export interface CreateNotificationRequest {
  user_id: string
  type: NotificationType
  title: string
  message?: string
  data?: Record<string, any>
}

// 알림 조회 응답
export interface NotificationsResponse {
  success: boolean
  notifications: Notification[]
  unread_count: number
  total_count: number
}

// 알림 읽음 처리 요청
export interface MarkAsReadRequest {
  notification_ids?: string[]  // 특정 알림들만 읽음 처리
  mark_all?: boolean           // 모든 알림 읽음 처리
}

// 알림 타입별 표시명
export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  organization_invitation: '셀러계정 초대',
  order_update: '주문 업데이트',
  system_notice: '시스템 공지',
  payment_update: '결제/정산 업데이트',
}

// 알림 타입별 아이콘 (Tailwind 클래스)
export const NOTIFICATION_TYPE_ICONS: Record<NotificationType, string> = {
  organization_invitation: '👥',
  order_update: '📦',
  system_notice: '📢',
  payment_update: '💰',
}

// 알림 타입별 색상 (Tailwind 클래스)
export const NOTIFICATION_TYPE_COLORS: Record<NotificationType, {
  bg: string
  text: string
  border: string
}> = {
  organization_invitation: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  order_update: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
  },
  system_notice: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    border: 'border-yellow-200',
  },
  payment_update: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
}
