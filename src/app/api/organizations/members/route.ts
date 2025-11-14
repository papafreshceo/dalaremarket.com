import { createClientForRouteHandler, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-security'
import { UpdateMemberRoleRequest } from '@/types/organization'
import { canManageMembers, getOrganizationMembers } from '@/lib/organization-utils'
import { autoCreateOrganizationFromUser } from '@/lib/auto-create-organization'
import { generateUserCodes } from '@/lib/user-codes'

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

    const supabase = await createClientForRouteHandler()

    // 권한 확인: 해당 조직의 멤버 또는 소유자만 조회 가능
    // 1. 조직 소유자인지 확인
    const { data: org } = await supabase
      .from('organizations')
      .select('owner_id')
      .eq('id', organizationId)
      .single()

    const isOwner = org?.owner_id === auth.user.id

    // 2. 멤버인지 확인
    const { data: myMember } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('user_id', auth.user.id)
      .eq('status', 'active')
      .maybeSingle()

    // 소유자도 아니고 멤버도 아니면 권한 없음
    if (!isOwner && !myMember) {
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
    const supabase = await createClientForRouteHandler()

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

    const supabase = await createClientForRouteHandler()
    const adminSupabase = createAdminClient()

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

    // 제거된 사용자의 개인 셀러계정 및 셀러코드 자동 생성
    if (targetMember?.user_id) {
      const { data: user } = await supabase
        .from('users')
        .select('primary_organization_id')
        .eq('id', targetMember.user_id)
        .single()

      if (user?.primary_organization_id === organizationId) {
        try {
          console.log('🚀 [멤버삭제] 개인 셀러계정 생성 시작, user_id:', targetMember.user_id)
          // 개인 셀러계정 자동 생성
          const result = await autoCreateOrganizationFromUser(targetMember.user_id)
          console.log('✅ [멤버삭제] 개인 셀러계정 생성 결과:', result)

          if (!result.organization_id) {
            throw new Error('셀러계정 ID가 반환되지 않았습니다')
          }

          // users의 primary_organization_id 업데이트 (Admin Client로 RLS 우회)
          console.log('🔄 [멤버삭제] primary_organization_id 업데이트 시작:', {
            user_id: targetMember.user_id,
            new_org_id: result.organization_id
          })
          const { data: updateData, error: updateError } = await adminSupabase
            .from('users')
            .update({ primary_organization_id: result.organization_id })
            .eq('id', targetMember.user_id)
            .select()

          if (updateError) {
            console.error('❌ [멤버삭제] primary_organization_id 업데이트 실패:', updateError)
            throw updateError
          }
          console.log('✅ [멤버삭제] primary_organization_id 업데이트 성공:', updateData)

          // 셀러코드 자동 생성
          console.log('🔑 [멤버삭제] 셀러코드 생성 시작')
          await generateUserCodes(targetMember.user_id)

          console.log(`✅ [멤버삭제] 완료: user_id=${targetMember.user_id}, org_id=${result.organization_id}`)
        } catch (createError) {
          console.error('❌ [멤버삭제] 개인 셀러계정 생성 실패:', createError)
          // 실패 시 최소한 primary_organization_id는 null로 (Admin Client 사용)
          await adminSupabase
            .from('users')
            .update({ primary_organization_id: null })
            .eq('id', targetMember.user_id)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: '멤버가 제거되었습니다. 해당 사용자의 개인 셀러계정이 자동으로 생성되었습니다.',
    })
  } catch (error) {
    console.error('멤버 제거 오류:', error)
    return NextResponse.json(
      { error: '멤버 제거 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
