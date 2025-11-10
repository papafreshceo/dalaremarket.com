/**
 * API 보안 헬퍼 함수
 *
 * 기존 API에 쉽게 보안을 추가할 수 있는 유틸리티
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'

/**
 * 인증이 필요한 API 래퍼
 * 로그인한 사용자만 접근 가능
 */
export async function requireAuth(request: NextRequest) {
  const authResult = await withAuth(request, { requireAuth: true })

  if (!authResult.authorized) {
    return {
      authorized: false,
      error: authResult.response,
      user: null,
      userData: null,
    }
  }

  return {
    authorized: true,
    error: null,
    user: authResult.user,
    userData: authResult.userData,
  }
}

/**
 * 직원 이상 권한 필요 (employee, admin, super_admin 모두 허용)
 */
export async function requireStaff(request: NextRequest) {
  const authResult = await withAuth(request, {
    requireRole: ['super_admin', 'admin', 'employee']
  })

  if (!authResult.authorized) {
    return {
      authorized: false,
      error: authResult.response,
      user: null,
      userData: null,
    }
  }

  return {
    authorized: true,
    error: null,
    user: authResult.user,
    userData: authResult.userData,
  }
}

/**
 * 관리자 이상 권한 필요 (admin, super_admin만 허용)
 */
export async function requireAdmin(request: NextRequest) {
  const authResult = await withAuth(request, {
    requireRole: ['super_admin', 'admin']
  })

  if (!authResult.authorized) {
    return {
      authorized: false,
      error: authResult.response,
      user: null,
      userData: null,
    }
  }

  return {
    authorized: true,
    error: null,
    user: authResult.user,
    userData: authResult.userData,
  }
}

/**
 * 최고관리자만 접근 가능
 */
export async function requireSuperAdmin(request: NextRequest) {
  const authResult = await withAuth(request, {
    requireRole: 'super_admin'
  })

  if (!authResult.authorized) {
    return {
      authorized: false,
      error: authResult.response,
      user: null,
      userData: null,
    }
  }

  return {
    authorized: true,
    error: null,
    user: authResult.user,
    userData: authResult.userData,
  }
}

/**
 * 감사 로그 기록 (중요한 작업 추적용)
 */
export function auditLog(
  action: string,
  userData: any,
  details?: Record<string, any>
) {
  const timestamp = new Date().toISOString()
  const logMessage = `[${timestamp}] [${action}] ${userData.name}(${userData.role})`

  if (details) {
  } else {
  }

  // TODO: 나중에 데이터베이스에 감사 로그 저장하기
  // await supabase.from('audit_logs').insert({
  //   action,
  //   user_id: userData.id,
  //   user_name: userData.name,
  //   user_role: userData.role,
  //   details,
  //   created_at: timestamp
  // })
}

/**
 * 빠른 보안 체크 예시
 */
export const SecurityExamples = {
  // 누구나 조회 가능, 수정/삭제는 관리자만
  async simpleProtection(request: NextRequest, method: string) {
    if (method === 'GET') {
      // GET은 인증만 필요
      return await requireAuth(request)
    } else {
      // POST, PATCH, DELETE는 관리자 필요
      return await requireAdmin(request)
    }
  },

  // 모든 작업에 관리자 권한 필요
  async adminOnly(request: NextRequest) {
    return await requireAdmin(request)
  },

  // 최고관리자만
  async superAdminOnly(request: NextRequest) {
    return await requireSuperAdmin(request)
  },
}
