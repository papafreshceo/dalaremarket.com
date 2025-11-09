import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'

// POST: 권한 대량 업데이트 (최고관리자만 가능)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 🔒 보안: 관리자 이상만 권한 대량 업데이트 가능
    const authResult = await withAuth(request, {
      requireRole: ['super_admin', 'admin']
    })

    if (!authResult.authorized) {
      return authResult.response
    }

    // admin은 super_admin 권한 변경 불가
    if (authResult.userData.role === 'admin') {
      const body = await request.json()
      if (body.role === 'super_admin') {
        return NextResponse.json(
          { success: false, error: '관리자는 최고관리자 권한을 변경할 수 없습니다.' },
          { status: 403 }
        )
      }
      // 다시 읽기 위해 body를 복원
      request = new NextRequest(request.url, {
        method: request.method,
        headers: request.headers,
        body: JSON.stringify(body)
      })
    }

    const body = await request.json()
    const { role, permissions } = body

    if (!role || !permissions || !Array.isArray(permissions)) {
      return NextResponse.json(
        { success: false, error: '잘못된 요청 형식입니다.' },
        { status: 400 }
      )
    }

    // super_admin 역할의 권한은 변경 불가
    if (role === 'super_admin') {
      return NextResponse.json(
        { success: false, error: '최고관리자 권한은 변경할 수 없습니다.' },
        { status: 403 }
      )
    }

    // 해당 역할의 모든 권한을 삭제
    const { error: deleteError } = await supabase
      .from('permissions')
      .delete()
      .eq('role', role)

    if (deleteError) throw deleteError

    // 새로운 권한을 삽입
    if (permissions.length > 0) {
      // id, created_at, updated_at 필드를 제거하고 필요한 필드만 추출
      const permissionsToInsert = permissions.map(p => ({
        role: p.role,
        page_path: p.page_path,
        can_access: p.can_access,
        can_create: p.can_create,
        can_read: p.can_read,
        can_update: p.can_update,
        can_delete: p.can_delete
      }))

      const { data, error: insertError } = await supabase
        .from('permissions')
        .insert(permissionsToInsert)
        .select()

      if (insertError) throw insertError

      // 감사 로그

      return NextResponse.json({ success: true, data })
    }

    return NextResponse.json({ success: true, data: [] })
  } catch (error: any) {
    console.error('권한 대량 업데이트 오류:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
