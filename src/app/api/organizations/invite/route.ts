import { createClientForRouteHandler } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-security'
import { InviteMemberRequest } from '@/types/organization'
import {
  canManageMembers,
  canAddMember,
  generateInvitationToken,
  getInvitationExpiryDate,
  getDefaultPermissions,
} from '@/lib/organization-utils'

/**
 * POST /api/organizations/invite
 * 조직에 멤버 초대
 */
export async function POST(request: NextRequest) {
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

    const body: InviteMemberRequest = await request.json()
    const supabase = await createClientForRouteHandler()

    // 권한 확인: 멤버 관리 권한 필요
    const hasPermission = await canManageMembers(organizationId, auth.user.id)
    if (!hasPermission) {
      return NextResponse.json(
        { error: '멤버를 초대할 권한이 없습니다' },
        { status: 403 }
      )
    }

    // 최대 멤버 수 확인
    const canAdd = await canAddMember(organizationId)
    if (!canAdd) {
      return NextResponse.json(
        { error: '조직의 최대 멤버 수에 도달했습니다' },
        { status: 400 }
      )
    }

    // 이미 초대된 이메일인지 확인
    const { data: existingInvitation } = await supabase
      .from('organization_invitations')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('email', body.email)
      .eq('status', 'pending')
      .single()

    if (existingInvitation) {
      return NextResponse.json(
        { error: '이미 초대된 이메일입니다' },
        { status: 400 }
      )
    }

    // 이미 조직 멤버인지 확인
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', body.email)
      .single()

    if (existingUser) {
      const { data: existingMember } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('user_id', existingUser.id)
        .eq('status', 'active')
        .single()

      if (existingMember) {
        return NextResponse.json(
          { error: '이미 조직 멤버입니다' },
          { status: 400 }
        )
      }
    }

    // 초대 생성
    const token = generateInvitationToken()
    const role = body.role || 'member'
    const expiresAt = getInvitationExpiryDate(7)

    // 조직 정보 조회
    const { data: organization } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', organizationId)
      .single()

    // 초대한 사람 정보 조회
    const { data: inviter } = await supabase
      .from('users')
      .select('profile_name, name, email')
      .eq('id', auth.user.id)
      .single()

    const inviterName = inviter?.profile_name || inviter?.name || inviter?.email || '관리자'
    const orgName = organization?.name || '셀러계정'

    // 초대받은 사용자 조회 (이미 가입된 경우만 알림 생성)
    if (existingUser) {
      // 1. 먼저 초대 생성 (invitation_id를 먼저 얻어야 알림에 포함 가능)
      const { data: invitation, error: inviteError } = await supabase
        .from('organization_invitations')
        .insert({
          organization_id: organizationId,
          inviter_id: auth.user.id,
          email: body.email,
          role,
          token,
          status: 'pending',
          expires_at: expiresAt,
          message: body.message,
        })
        .select()
        .single()

      if (inviteError) {
        console.error('초대 생성 실패:', inviteError)
        return NextResponse.json(
          { error: '초대 생성에 실패했습니다' },
          { status: 500 }
        )
      }

      // 2. 알림 생성 (invitation_id 포함)
      const { data: notification, error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: existingUser.id,
          type: 'organization_invitation',
          title: '셀러계정 초대',
          message: `${orgName}에서 멤버로 초대했습니다`,
          data: {
            invitation_id: invitation.id,  // ⭐ CRITICAL: invitation_id 추가
            organization_id: organizationId,
            organization_name: orgName,
            inviter_id: auth.user.id,
            inviter_name: inviterName,
            role,
            custom_message: body.message,
          },
          read: false,
        })
        .select()
        .single()

      if (notificationError) {
        console.error('알림 생성 실패:', notificationError)
      }

      // 3. 초대에 notification_id 업데이트
      if (notification) {
        await supabase
          .from('organization_invitations')
          .update({ notification_id: notification.id })
          .eq('id', invitation.id)
      }

      return NextResponse.json({
        success: true,
        invitation,
        notification_created: true,
      })
    } else {
      // 미가입자인 경우 초대만 생성 (알림 없음)
      const { data: invitation, error: inviteError } = await supabase
        .from('organization_invitations')
        .insert({
          organization_id: organizationId,
          inviter_id: auth.user.id,
          email: body.email,
          role,
          token,
          status: 'pending',
          expires_at: expiresAt,
          message: body.message,
        })
        .select()
        .single()

      if (inviteError) {
        console.error('초대 생성 실패:', inviteError)
        return NextResponse.json(
          { error: '초대 생성에 실패했습니다' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        invitation,
        notification_created: false,
        message: '해당 이메일은 미가입자입니다. 가입 후 초대를 수락할 수 있습니다.',
      })
    }
  } catch (error) {
    console.error('초대 생성 오류:', error)
    return NextResponse.json(
      { error: '초대 생성 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/organizations/invite?organization_id=xxx
 * 조직의 초대 목록 조회
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

    // 권한 확인: 멤버 관리 권한 필요
    const hasPermission = await canManageMembers(organizationId, auth.user.id)
    if (!hasPermission) {
      return NextResponse.json(
        { error: '초대 목록을 조회할 권한이 없습니다' },
        { status: 403 }
      )
    }

    // 초대 목록 조회
    const { data: invitations, error: fetchError } = await supabase
      .from('organization_invitations')
      .select(`
        *,
        inviter:users!organization_invitations_inviter_id_fkey(
          id,
          email,
          profile_name,
          name
        )
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('초대 목록 조회 실패:', fetchError)
      return NextResponse.json(
        { error: '초대 목록 조회에 실패했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      invitations,
    })
  } catch (error) {
    console.error('초대 목록 조회 오류:', error)
    return NextResponse.json(
      { error: '초대 목록 조회 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/organizations/invite?invitation_id=xxx
 * 초대 취소
 */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (!auth.authorized) return auth.error

    const invitationId = request.nextUrl.searchParams.get('invitation_id')
    if (!invitationId) {
      return NextResponse.json(
        { error: '초대 ID가 필요합니다' },
        { status: 400 }
      )
    }

    const supabase = await createClientForRouteHandler()

    // 초대 정보 조회
    const { data: invitation } = await supabase
      .from('organization_invitations')
      .select('organization_id, inviter_id')
      .eq('id', invitationId)
      .single()

    if (!invitation) {
      return NextResponse.json(
        { error: '초대를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 권한 확인: 초대한 사람 또는 조직 관리자만 취소 가능
    const hasPermission =
      invitation.inviter_id === auth.user.id ||
      (await canManageMembers(invitation.organization_id, auth.user.id))

    if (!hasPermission) {
      return NextResponse.json(
        { error: '초대를 취소할 권한이 없습니다' },
        { status: 403 }
      )
    }

    // 초대 정보 다시 조회 (notification_id 포함)
    const { data: fullInvitation } = await supabase
      .from('organization_invitations')
      .select('*')
      .eq('id', invitationId)
      .single()

    // 초대 취소
    const { error: cancelError } = await supabase
      .from('organization_invitations')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', invitationId)

    if (cancelError) {
      console.error('초대 취소 실패:', cancelError)
      return NextResponse.json(
        { error: '초대 취소에 실패했습니다' },
        { status: 500 }
      )
    }

    // 연결된 알림도 업데이트 (있는 경우)
    if (fullInvitation?.notification_id) {
      const { error: notificationError } = await supabase
        .from('notifications')
        .update({
          updated_at: new Date().toISOString()
        })
        .eq('id', fullInvitation.notification_id)

      if (notificationError) {
        console.error('알림 업데이트 실패:', notificationError)
        // 알림 업데이트 실패는 무시 (초대 취소는 성공했으므로)
      }
    }

    return NextResponse.json({
      success: true,
      message: '초대가 취소되었습니다',
    })
  } catch (error) {
    console.error('초대 취소 오류:', error)
    return NextResponse.json(
      { error: '초대 취소 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
