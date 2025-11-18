import { createClientForRouteHandler } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import logger from '@/lib/logger';
import { ADMIN_PAGES, UserRole } from '@/types/permissions'

// 역할별 기본 권한 설정
const DEFAULT_PERMISSIONS: Record<UserRole, Omit<any, 'role' | 'page_path'>> = {
  super_admin: {
    can_access: true,
    can_create: true,
    can_read: true,
    can_update: true,
    can_delete: true,
  },
  admin: {
    can_access: true,
    can_create: true,
    can_read: true,
    can_update: true,
    can_delete: false,
  },
  employee: {
    can_access: true,
    can_create: false,
    can_read: true,
    can_update: false,
    can_delete: false,
  },
  partner: {
    can_access: false,
    can_create: false,
    can_read: false,
    can_update: false,
    can_delete: false,
  },
  vip_customer: {
    can_access: false,
    can_create: false,
    can_read: false,
    can_update: false,
    can_delete: false,
  },
  customer: {
    can_access: false,
    can_create: false,
    can_read: false,
    can_update: false,
    can_delete: false,
  },
}

// GET: 역할별 권한 조회 (관리자 이상만 가능) + 자동 동기화
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClientForRouteHandler()

    // 🔒 보안: 로그인 사용자만 조회 가능 (임시로 완화)
    const authResult = await withAuth(request, {
      requireAuth: true
    })

    if (!authResult.authorized) {
      return authResult.response
    }

    const searchParams = request.nextUrl.searchParams
    const role = searchParams.get('role') as UserRole

    if (!role) {
      return NextResponse.json(
        { success: false, error: '역할이 필요합니다.' },
        { status: 400 }
      )
    }

    // 1. DB에서 기존 권한 조회
    const { data: existingPermissions, error } = await supabase
      .from('permissions')
      .select('*')
      .eq('role', role)
      .order('page_path', { ascending: true })

    if (error) throw error

    // 2. 메뉴에서 추출한 모든 페이지 경로
    const allPagePaths = ADMIN_PAGES.map(p => p.path)
    const existingPaths = new Set(existingPermissions?.map(p => p.page_path) || [])

    // 3. DB에 없는 페이지 찾기
    const missingPaths = allPagePaths.filter(path => !existingPaths.has(path))

    // 4. 누락된 페이지가 있으면 자동으로 추가
    if (missingPaths.length > 0) {
      logger.info(`${role} 역할에 ${missingPaths.length}개 페이지 권한 자동 추가`)

      const newPermissions = missingPaths.map(path => ({
        role,
        page_path: path,
        ...DEFAULT_PERMISSIONS[role],
      }))

      const { error: insertError } = await supabase
        .from('permissions')
        .insert(newPermissions)

      if (insertError) {
        logger.error('권한 자동 추가 오류:', insertError)
      }

      // 5. 다시 조회
      const { data: updatedPermissions } = await supabase
        .from('permissions')
        .select('*')
        .eq('role', role)
        .order('page_path', { ascending: true })

      return NextResponse.json({ success: true, data: updatedPermissions || [] })
    }

    return NextResponse.json({ success: true, data: existingPermissions || [] })
  } catch (error: any) {
    logger.error('권한 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST: 권한 생성 (최고관리자만 가능)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClientForRouteHandler()

    // 🔒 보안: 최고관리자만 권한 생성 가능
    const authResult = await withAuth(request, {
      requireRole: 'super_admin'
    })

    if (!authResult.authorized) {
      return authResult.response
    }

    const body = await request.json()

    const { data, error } = await supabase
      .from('permissions')
      .insert(body)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    logger.error('권한 생성 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// PATCH: 권한 수정 (최고관리자만 가능)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClientForRouteHandler()

    // 🔒 보안: 최고관리자만 권한 수정 가능
    const authResult = await withAuth(request, {
      requireRole: 'super_admin'
    })

    if (!authResult.authorized) {
      return authResult.response
    }

    const body = await request.json()
    const { id, ...updates } = body

    const { data, error } = await supabase
      .from('permissions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    logger.error('권한 수정 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// DELETE: 권한 삭제 (최고관리자만 가능)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClientForRouteHandler()

    // 🔒 보안: 최고관리자만 권한 삭제 가능
    const authResult = await withAuth(request, {
      requireRole: 'super_admin'
    })

    if (!authResult.authorized) {
      return authResult.response
    }

    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID가 필요합니다.' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('permissions')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('권한 삭제 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
