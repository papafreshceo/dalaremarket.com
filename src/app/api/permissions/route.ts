import { createClientForRouteHandler } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import logger from '@/lib/logger';

// GET: 역할별 권한 조회 (관리자 이상만 가능)
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
    const role = searchParams.get('role')

    let query = supabase
      .from('permissions')
      .select('*')
      .order('page_path', { ascending: true })

    if (role) {
      query = query.eq('role', role)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ success: true, data })
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
