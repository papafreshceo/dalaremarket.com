/**
 * 감사 로그(Audit Log) 유틸리티
 *
 * 시스템에서 발생하는 중요한 작업을 데이터베이스에 영구 기록합니다.
 * - 보안: 누가 무엇을 했는지 추적
 * - 규정 준수: 법적 요구사항 충족
 * - 문제 해결: 데이터 변경 이력 확인
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';
import logger from '@/lib/logger';

// 액션 타입 정의
export type AuditAction =
  // 데이터 삭제
  | 'delete_order'
  | 'delete_user'
  | 'delete_organization'
  | 'hard_delete_order'
  | 'bulk_delete_orders'

  // 권한 변경
  | 'change_user_role'
  | 'grant_admin_access'
  | 'revoke_admin_access'
  | 'impersonate_user'

  // 데이터 접근
  | 'view_customer_info'
  | 'export_customer_data'
  | 'download_order_excel'

  // 조직 관리
  | 'create_organization'
  | 'update_organization'
  | 'invite_member'
  | 'remove_member'
  | 'change_organization_tier'

  // 캐시/크레딧
  | 'use_cash'
  | 'refund_cash'
  | 'grant_cash'
  | 'revoke_cash'
  | 'use_credits'
  | 'grant_credits'
  | 'revoke_credits'

  // 설정 변경
  | 'update_system_settings'
  | 'update_market_settings'
  | 'update_tier_settings'

  // 인증/보안
  | 'login_success'
  | 'login_failed'
  | 'password_reset'
  | 'account_locked'

  // 결제 (나중에 추가될 예정)
  | 'payment_success'
  | 'payment_failed'
  | 'payment_refund'
  | 'subscription_created'
  | 'subscription_cancelled';

// 액션 카테고리
export type AuditCategory =
  | 'data_deletion'
  | 'data_modification'
  | 'data_access'
  | 'permission_change'
  | 'payment'
  | 'authentication'
  | 'system_config';

// 심각도
export type AuditSeverity = 'info' | 'warning' | 'critical';

// 리소스 타입
export type ResourceType =
  | 'order'
  | 'user'
  | 'organization'
  | 'payment'
  | 'cash'
  | 'credits'
  | 'settings';

// 감사 로그 생성 파라미터
export interface CreateAuditLogParams {
  // 필수
  action: AuditAction;

  // 권장
  actionCategory?: AuditCategory;
  resourceType?: ResourceType;
  resourceId?: string;

  // 선택
  beforeData?: any;
  afterData?: any;
  details?: Record<string, any>;

  // 자동 설정 가능
  userId?: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  organizationId?: string;

  // 요청 정보 (자동 추출 가능)
  ipAddress?: string;
  userAgent?: string;
  requestMethod?: string;
  requestPath?: string;
  statusCode?: number;

  // 메타데이터
  isSensitive?: boolean;
  severity?: AuditSeverity;
  metadata?: Record<string, any>;
}

/**
 * IP 주소 추출
 */
function extractIpAddress(request?: NextRequest): string | undefined {
  if (!request) return undefined;

  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  return realIp || undefined;
}

/**
 * 감사 로그 생성
 *
 * @example
 * ```typescript
 * await createAuditLog({
 *   action: 'delete_order',
 *   actionCategory: 'data_deletion',
 *   resourceType: 'order',
 *   resourceId: '1234',
 *   beforeData: order,
 *   details: { order_number: 'ORD-001' },
 *   severity: 'warning'
 * }, request, auth);
 * ```
 */
export async function createAuditLog(
  params: CreateAuditLogParams,
  request?: NextRequest,
  authData?: { user: any; userData: any }
): Promise<{ success: boolean; error?: any }> {
  try {
    const supabase = await createClient();

    // 요청 정보 추출
    const ipAddress = params.ipAddress || extractIpAddress(request);
    const userAgent = params.userAgent || request?.headers.get('user-agent') || undefined;
    const requestMethod = params.requestMethod || request?.method || undefined;
    const requestPath = params.requestPath || request?.nextUrl?.pathname || undefined;

    // 사용자 정보 (authData가 있으면 우선 사용)
    const userId = params.userId || authData?.user?.id;
    const userName = params.userName || authData?.userData?.name;
    const userEmail = params.userEmail || authData?.user?.email;
    const userRole = params.userRole || authData?.userData?.role;
    const organizationId = params.organizationId || authData?.userData?.primary_organization_id;

    // 민감한 정보 마스킹 (before/after 데이터)
    const sanitize = (data: any) => {
      if (!data || typeof data !== 'object') return data;

      const sensitiveFields = ['password', 'token', 'secret', 'api_key', 'credit_card'];
      const sanitized = { ...data };

      for (const key in sanitized) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          sanitized[key] = '***REDACTED***';
        }
      }

      return sanitized;
    };

    // 감사 로그 삽입
    const { error } = await supabase.from('audit_logs').insert({
      // 사용자 정보
      user_id: userId,
      user_name: userName,
      user_email: userEmail,
      user_role: userRole,
      organization_id: organizationId,

      // 액션 정보
      action: params.action,
      action_category: params.actionCategory,
      resource_type: params.resourceType,
      resource_id: params.resourceId,

      // 데이터 변경 (민감한 정보 마스킹)
      before_data: params.beforeData ? sanitize(params.beforeData) : null,
      after_data: params.afterData ? sanitize(params.afterData) : null,
      details: params.details || null,

      // 요청 정보
      ip_address: ipAddress,
      user_agent: userAgent,
      request_method: requestMethod,
      request_path: requestPath,
      status_code: params.statusCode,

      // 메타데이터
      is_sensitive: params.isSensitive || false,
      severity: params.severity || 'info',
      metadata: params.metadata || null,
    });

    if (error) {
      logger.error('감사 로그 저장 실패', error);
      return { success: false, error };
    }

    // 개발 환경에서만 로그 출력
    logger.debug('감사 로그 기록됨', {
      action: params.action,
      user: userName,
      resource: `${params.resourceType}:${params.resourceId}`,
    });

    return { success: true };
  } catch (error) {
    logger.error('감사 로그 생성 중 오류', error as Error);
    return { success: false, error };
  }
}

/**
 * 액션별 카테고리 자동 매핑
 */
export function getActionCategory(action: AuditAction): AuditCategory {
  const mapping: Record<string, AuditCategory> = {
    delete_: 'data_deletion',
    change_: 'permission_change',
    grant_: 'permission_change',
    revoke_: 'permission_change',
    view_: 'data_access',
    export_: 'data_access',
    download_: 'data_access',
    login_: 'authentication',
    password_: 'authentication',
    account_: 'authentication',
    payment_: 'payment',
    subscription_: 'payment',
    update_: 'data_modification',
  };

  for (const [prefix, category] of Object.entries(mapping)) {
    if (action.startsWith(prefix)) {
      return category;
    }
  }

  return 'data_modification';
}

/**
 * 액션별 심각도 자동 매핑
 */
export function getActionSeverity(action: AuditAction): AuditSeverity {
  const critical: AuditAction[] = [
    'hard_delete_order',
    'bulk_delete_orders',
    'delete_user',
    'delete_organization',
    'grant_admin_access',
    'revoke_admin_access',
    'account_locked',
  ];

  const warning: AuditAction[] = [
    'delete_order',
    'change_user_role',
    'view_customer_info',
    'export_customer_data',
    'impersonate_user',
    'refund_cash',
    'revoke_cash',
    'revoke_credits',
    'payment_failed',
    'payment_refund',
  ];

  if (critical.includes(action)) return 'critical';
  if (warning.includes(action)) return 'warning';
  return 'info';
}

/**
 * 헬퍼 함수: 간단한 감사 로그 생성
 */
export async function auditLog(
  action: AuditAction,
  details?: Record<string, any>,
  request?: NextRequest,
  authData?: { user: any; userData: any }
): Promise<void> {
  await createAuditLog(
    {
      action,
      actionCategory: getActionCategory(action),
      severity: getActionSeverity(action),
      details,
    },
    request,
    authData
  );
}

// 타입 export
export type { CreateAuditLogParams };
