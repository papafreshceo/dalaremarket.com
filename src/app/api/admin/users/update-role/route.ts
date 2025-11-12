import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-security'
import { generateSellerCode, generatePartnerCode } from '@/lib/user-codes'

export async function POST(request: NextRequest) {
  // 🔒 보안: 관리자만 역할 변경 가능
  const auth = await requireAdmin(request)
  if (!auth.authorized) return auth.error

  try {
    const supabase = await createClient()
    const body = await request.json()
    const { userId, newRole, oldRole } = body

    if (!userId || !newRole || !oldRole) {
      return NextResponse.json(
        { success: false, error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      )
    }

    const updateData: any = { role: newRole }

    // 일반 회원 → 관리자 그룹으로 변경 시 셀러계정 연결 해제
    const isBecomingStaff = ['admin', 'super_admin', 'employee'].includes(newRole) &&
                            !['admin', 'super_admin', 'employee'].includes(oldRole)

    if (isBecomingStaff) {
      updateData.primary_organization_id = null
    }

    // 셀러/파트너로 변경 시 코드 생성
    if (newRole === 'seller' && oldRole !== 'seller') {
      try {
        const code = await generateSellerCode()
        updateData.seller_code = code
      } catch (error) {
        console.error('Failed to generate seller code:', error)
      }
    } else if (newRole === 'partner' && oldRole !== 'partner') {
      try {
        const code = await generatePartnerCode()
        updateData.partner_code = code
      } catch (error) {
        console.error('Failed to generate partner code:', error)
      }
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      isBecomingStaff
    })

  } catch (error: any) {
    console.error('POST /api/admin/users/update-role 오류:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
