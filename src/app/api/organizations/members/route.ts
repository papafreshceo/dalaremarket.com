import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-security'
import { UpdateMemberRoleRequest } from '@/types/organization'
import { canManageMembers, getOrganizationMembers } from '@/lib/organization-utils'

/**
 * GET /api/organizations/members?organization_id=xxx
 * 조직 멤버 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (!auth.authorized) return auth.error

    const organizationId = request.nextUrl.searchParams.get('organization_id')
    if (!organizationId) {
      return NextResponse.json(
        { error: '조직 ID가 필요합니다' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 권한 확인: 해당 조직의 멤버만 조회 가능
    const { data: myMember } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('user_id', auth.user.id)
      .eq('status', 'active')
      .single()

    if (!myMember) {
      return NextResponse.json(
        { error: '조직 멤버 정보를 조회할 권한이 없습니다' },
        { status: 403 }
      )
    }

    // 멤버 목록 조회
    const members = await getOrganizationMembers(organizationId)

    return NextResponse.json({
      success: true,
      members,
    })
  } catch (error) {
    console.error('멤버 조회 오류:', error)
    return NextResponse.json(
      { error: '멤버 조회 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/organizations/members?organization_id=xxx
 * 멤버 역할 및 권한 수정
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (!auth.authorized) return auth.error

    const organizationId = request.nextUrl.searchParams.get('organization_id')
    if (!organizationId) {
      return NextResponse.json(
        { error: '조직 ID가 필요합니다' },
        { status: 400 }
      )
    }

    const body: UpdateMemberRoleRequest = await request.json()
    const supabase = await createClient()

    // 권한 확인: 멤버 관리 권한 필요
    const hasPermission = await canManageMembers(organizationId, auth.user.id)
    if (!hasPermission) {
      return NextResponse.json(
        { error: '멤버 정보를 수정할 권한이 없습니다' },
        { status: 403 }
      )
    }

    // 소유자는 역할 변경 불가
    const { data: targetMember } = await supabase
      .from('organization_members')
      .select('role, user_id')
      .eq('id', body.member_id)
      .single()

    if (targetMember?.role === 'owner') {
      return NextResponse.json(
        { error: '소유자의 역할은 변경할 수 없습니다' },
        { status: 400 }
      )
    }

    // 멤버 정보 업데이트
    const updateData: any = {}
    if (body.role) {
      updateData.role = body.role
    }
    if (body.permissions) {
      if (body.permissions.can_manage_orders !== undefined) {
        updateData.can_manage_orders = body.permissions.can_manage_orders
      }
      if (body.permissions.can_manage_products !== undefined) {
        updateData.can_manage_products = body.permissions.can_manage_products
      }
      if (body.permissions.can_manage_members !== undefined) {
        updateData.can_manage_members = body.permissions.can_manage_members
      }
      if (body.permissions.can_view_financials !== undefined) {
        updateData.can_view_financials = body.permissions.can_view_financials
      }
    }

    const { data: updatedMember, error: updateError } = await supabase
      .from('organization_members')
      .update(updateData)
      .eq('id', body.member_id)
      .select()
      .single()

    if (updateError) {
      console.error('멤버 정보 업데이트 실패:', updateError)
      return NextResponse.json(
        { error: '멤버 정보 업데이트에 실패했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      member: updatedMember,
    })
  } catch (error) {
    console.error('멤버 정보 수정 오류:', error)
    return NextResponse.json(
      { error: '멤버 정보 수정 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/organizations/members?organization_id=xxx&member_id=xxx
 * 멤버 제거
 */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (!auth.authorized) return auth.error

    const organizationId = request.nextUrl.searchParams.get('organization_id')
    const memberId = request.nextUrl.searchParams.get('member_id')

    if (!organizationId || !memberId) {
      return NextResponse.json(
        { error: '조직 ID와 멤버 ID가 필요합니다' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 권한 확인: 멤버 관리 권한 필요
    const hasPermission = await canManageMembers(organizationId, auth.user.id)
    if (!hasPermission) {
      return NextResponse.json(
        { error: '멤버를 제거할 권한이 없습니다' },
        { status: 403 }
      )
    }

    // 소유자는 제거 불가
    const { data: targetMember } = await supabase
      .from('organization_members')
      .select('role, user_id')
      .eq('id', memberId)
      .single()

    if (targetMember?.role === 'owner') {
      return NextResponse.json(
        { error: '소유자는 제거할 수 없습니다' },
        { status: 400 }
      )
    }

    // 멤버 제거 (실제로는 status를 suspended로 변경)
    const { error: deleteError } = await supabase
      .from('organization_members')
      .update({ status: 'suspended' })
      .eq('id', memberId)

    if (deleteError) {
      console.error('멤버 제거 실패:', deleteError)
      return NextResponse.json(
        { error: '멤버 제거에 실패했습니다' },
        { status: 500 }
      )
    }

    // 제거된 사용자의 primary_organization_id 초기화
    if (targetMember?.user_id) {
      const { data: user } = await supabase
        .from('users')
        .select('primary_organization_id')
        .eq('id', targetMember.user_id)
        .single()

      if (user?.primary_organization_id === organizationId) {
        await supabase
          .from('users')
          .update({ primary_organization_id: null })
          .eq('id', targetMember.user_id)
      }
    }

    return NextResponse.json({
      success: true,
      message: '멤버가 제거되었습니다',
    })
  } catch (error) {
    console.error('멤버 제거 오류:', error)
    return NextResponse.json(
      { error: '멤버 제거 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
