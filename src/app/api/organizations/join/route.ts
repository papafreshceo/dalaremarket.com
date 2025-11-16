import { createClientForRouteHandler } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-security'
import { getInvitationByToken, getDefaultPermissions } from '@/lib/organization-utils'
import logger from '@/lib/logger';

/**
 * GET /api/organizations/join?token=xxx
 * 초대 토큰으로 초대 정보 조회
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token')
    if (!token) {
      return NextResponse.json(
        { error: '초대 토큰이 필요합니다' },
        { status: 400 }
      )
    }

    const invitation = await getInvitationByToken(token)
    if (!invitation) {
      return NextResponse.json(
        { error: '유효하지 않거나 만료된 초대입니다' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      invitation,
    })
  } catch (error) {
    logger.error('초대 정보 조회 오류:', error);
    return NextResponse.json(
      { error: '초대 정보 조회 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/organizations/join
 * 초대 수락 및 조직 가입
 *
 * Body: { token?: string, invitation_id?: string, action?: 'accept' | 'reject' }
 * - token: 토큰 기반 초대 (기존 방식)
 * - invitation_id + action: 알림 기반 초대 (새 방식)
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (!auth.authorized) return auth.error

    const body = await request.json()
    const { token, invitation_id, action } = body

    // 알림 기반 초대 (새 방식)
    if (invitation_id && action) {
      return await handleNotificationBasedInvitation(auth.user.id, invitation_id, action)
    }

    // 토큰 기반 초대 (기존 방식)
    if (!token) {
      return NextResponse.json(
        { error: '초대 토큰 또는 invitation_id가 필요합니다' },
        { status: 400 }
      )
    }

    const supabase = await createClientForRouteHandler()

    // 초대 정보 조회
    const invitation = await getInvitationByToken(token)
    if (!invitation) {
      return NextResponse.json(
        { error: '유효하지 않거나 만료된 초대입니다' },
        { status: 404 }
      )
    }

    // 이메일 확인
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', auth.user.id)
      .single()

    if (user?.email !== invitation.email) {
      return NextResponse.json(
        { error: '초대된 이메일과 로그인한 계정이 일치하지 않습니다' },
        { status: 400 }
      )
    }

    // 이미 조직 멤버인지 확인
    const { data: existingMember } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', invitation.organization_id)
      .eq('user_id', auth.user.id)
      .eq('status', 'active')
      .single()

    if (existingMember) {
      return NextResponse.json(
        { error: '이미 조직 멤버입니다' },
        { status: 400 }
      )
    }

    // 역할별 기본 권한 가져오기
    const permissions = getDefaultPermissions(invitation.role)

    // 초대한 조직의 소유자 조회
    const { data: invitingOrg } = await supabase
      .from('organizations')
      .select('owner_id')
      .eq('id', invitation.organization_id)
      .single()

    if (!invitingOrg) {
      return NextResponse.json(
        { error: '조직을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 이미 다른 사람의 조직 멤버인지 확인 (본인 소유 조직 제외)
    const { data: existingMemberships } = await supabase
      .from('organization_members')
      .select('organization_id, organizations!inner(owner_id)')
      .eq('user_id', auth.user.id)
      .eq('status', 'active')

    if (existingMemberships && existingMemberships.length > 0) {
      // 본인이 소유자가 아닌 조직 중에서, 다른 소유자의 조직 멤버인지 확인
      const otherOwnerMembership = existingMemberships.find(
        (m: any) => m.organizations.owner_id !== auth.user.id && m.organizations.owner_id !== invitingOrg.owner_id
      )

      if (otherOwnerMembership) {
        return NextResponse.json(
          { error: '이미 다른 사람의 셀러계정 멤버입니다. 한 사람의 셀러계정에만 소속될 수 있습니다.' },
          { status: 400 }
        )
      }
    }

    // 사용자의 개인 조직 확인 및 삭제
    const { data: currentUser } = await supabase
      .from('users')
      .select('primary_organization_id')
      .eq('id', auth.user.id)
      .single()

    if (currentUser?.primary_organization_id) {
      // 기존 조직 정보 조회
      const { data: oldOrg } = await supabase
        .from('organizations')
        .select('id, owner_id, name')
        .eq('id', currentUser.primary_organization_id)
        .single()

      // 본인이 소유자인 개인 조직인 경우 삭제
      if (oldOrg && oldOrg.owner_id === auth.user.id) {
        logger.debug('🗑️  개인 셀러계정 삭제:', { data: oldOrg.name });

        // 기존 조직의 멤버 삭제
        await supabase
          .from('organization_members')
          .delete()
          .eq('organization_id', oldOrg.id)

        // 기존 조직 삭제
        await supabase
          .from('organizations')
          .delete()
          .eq('id', oldOrg.id)
      }
    }

    // 기존 멤버십 확인 (suspended 포함)
    const { data: existingSuspendedMember } = await supabase
      .from('organization_members')
      .select('id, status')
      .eq('organization_id', invitation.organization_id)
      .eq('user_id', auth.user.id)
      .single()

    let member
    let memberError

    if (existingSuspendedMember) {
      // 기존 멤버십을 active로 변경
      const result = await supabase
        .from('organization_members')
        .update({
          role: invitation.role,
          status: 'active',
          invited_by: invitation.inviter_id,
          invited_at: invitation.created_at,
          joined_at: new Date().toISOString(),
          ...permissions,
        })
        .eq('id', existingSuspendedMember.id)
        .select()
        .single()

      member = result.data
      memberError = result.error
    } else {
      // 새로운 멤버로 추가
      const result = await supabase
        .from('organization_members')
        .insert({
          organization_id: invitation.organization_id,
          user_id: auth.user.id,
          role: invitation.role,
          status: 'active',
          invited_by: invitation.inviter_id,
          invited_at: invitation.created_at,
          joined_at: new Date().toISOString(),
          ...permissions,
        })
        .select()
        .single()

      member = result.data
      memberError = result.error
    }

    if (memberError) {
      logger.error('멤버 추가 실패:', memberError);
      return NextResponse.json(
        { error: '조직 가입에 실패했습니다' },
        { status: 500 }
      )
    }

    // 초대 상태 업데이트
    await supabase
      .from('organization_invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        accepted_by: auth.user.id,
      })
      .eq('id', invitation.id)

    // 사용자의 primary_organization_id를 새 조직으로 업데이트
    await supabase
      .from('users')
      .update({
        primary_organization_id: invitation.organization_id,
      })
      .eq('id', auth.user.id)

    return NextResponse.json({
      success: true,
      member,
      organization_id: invitation.organization_id,
    })
  } catch (error) {
    logger.error('조직 가입 오류:', error);
    return NextResponse.json(
      { error: '조직 가입 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

/**
 * 알림 기반 초대 처리 (수락/거절)
 */
async function handleNotificationBasedInvitation(
  userId: string,
  invitationId: string,
  action: 'accept' | 'reject'
) {
  const supabase = await createClientForRouteHandler()

  // Admin client for RLS bypass (needed for deletion operations)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const adminSupabase = createAdminClient(supabaseUrl, supabaseServiceKey)

  // 1. 초대 정보 조회
  const { data: invitation, error: invitationError } = await supabase
    .from('organization_invitations')
    .select('*')
    .eq('id', invitationId)
    .single()

  if (invitationError || !invitation) {
    return NextResponse.json(
      { error: '초대를 찾을 수 없습니다' },
      { status: 404 }
    )
  }

  // 2. 초대 유효성 검증
  if (invitation.status !== 'pending') {
    return NextResponse.json(
      { error: '이미 처리된 초대입니다' },
      { status: 400 }
    )
  }

  // 만료 확인
  const expiresAt = new Date(invitation.expires_at)
  if (expiresAt < new Date()) {
    await supabase
      .from('organization_invitations')
      .update({ status: 'expired' })
      .eq('id', invitationId)

    return NextResponse.json(
      { error: '만료된 초대입니다' },
      { status: 400 }
    )
  }

  // 3. 초대받은 사람 확인
  const { data: user } = await supabase
    .from('users')
    .select('email')
    .eq('id', userId)
    .single()

  if (user?.email !== invitation.email) {
    return NextResponse.json(
      { error: '초대된 이메일과 로그인한 계정이 일치하지 않습니다' },
      { status: 403 }
    )
  }

  // 4-A. 거절 처리
  if (action === 'reject') {
    const { error: rejectError } = await supabase
      .from('organization_invitations')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', invitationId)

    if (rejectError) {
      logger.error('초대 거절 실패:', rejectError);
      return NextResponse.json(
        { error: '초대 거절에 실패했습니다' },
        { status: 500 }
      )
    }

    // 알림 읽음 처리
    if (invitation.notification_id) {
      await supabase
        .from('notifications')
        .update({
          read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', invitation.notification_id)
    }

    return NextResponse.json({
      success: true,
      action: 'rejected',
      message: '초대를 거절했습니다',
    })
  }

  // 4-B. 수락 처리
  if (action === 'accept') {
    // 이미 조직 멤버인지 확인
    const { data: existingMember } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', invitation.organization_id)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (existingMember) {
      return NextResponse.json(
        { error: '이미 조직 멤버입니다' },
        { status: 400 }
      )
    }

    // 역할별 기본 권한 가져오기
    const permissions = getDefaultPermissions(invitation.role)

    // 초대한 조직의 소유자 조회
    const { data: invitingOrg } = await supabase
      .from('organizations')
      .select('owner_id')
      .eq('id', invitation.organization_id)
      .single()

    if (!invitingOrg) {
      return NextResponse.json(
        { error: '조직을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // ⭐ CRITICAL: 검증 전에 먼저 개인 조직 삭제
    // 이후 검증 로직이 실행될 때는 이미 개인 조직이 삭제된 상태여야 함
    logger.debug('기존 멤버십 확인 및 삭제 시작 (검증 전)');

    // 현재 사용자의 모든 active 멤버십 조회 (organization_id만 가져옴)
    const { data: membershipsToDelete } = await supabase
      .from('organization_members')
      .select('id, organization_id')
      .eq('user_id', userId)
      .eq('status', 'active')

    logger.debug('📋 조회된 멤버십:', { data: membershipsToDelete?.length || 0, membershipsToDelete });

    if (membershipsToDelete && membershipsToDelete.length > 0) {
      for (const membership of membershipsToDelete) {
        // 각 organization_id에 대해 조직 정보 조회 (admin client로)
        const { data: org } = await adminSupabase
          .from('organizations')
          .select('id, owner_id, business_name')
          .eq('id', membership.organization_id)
          .single()

        logger.debug('🔎 조직 정보:', { data: org });

        // 본인이 소유자인 개인 조직인 경우만 삭제
        if (org && org.owner_id === userId) {
          logger.debug('🗑️  개인 셀러계정 삭제 시작:', { business_name: org.business_name, org_id: org.id });

          // 멤버십 삭제 (admin client로 RLS 우회)
          const { error: memberDeleteError } = await adminSupabase
            .from('organization_members')
            .delete()
            .eq('organization_id', org.id)

          if (memberDeleteError) {
            logger.error('❌ 멤버십 삭제 실패:', memberDeleteError);
          } else {
            logger.info('멤버십 삭제 완료');
          }

          // 조직 삭제 (admin client로 RLS 우회)
          const { error: orgDeleteError } = await adminSupabase
            .from('organizations')
            .delete()
            .eq('id', org.id)

          if (orgDeleteError) {
            logger.error('❌ 조직 삭제 실패:', orgDeleteError);
          } else {
            logger.info('조직 삭제 완료:');
          }
        } else {
          logger.debug('⏭️  스킵: 본인 소유 조직 아님 또는 조직 없음');
        }
      }
    }

    logger.info('기존 멤버십 정리 완료 (검증 전)');

    // 이미 다른 사람의 조직 멤버인지 확인 (본인 소유 조직 제외)
    // ⭐ 이 시점에는 이미 개인 조직이 삭제된 상태
    const { data: existingMemberships } = await supabase
      .from('organization_members')
      .select('organization_id, organizations!inner(owner_id)')
      .eq('user_id', userId)
      .eq('status', 'active')

    if (existingMemberships && existingMemberships.length > 0) {
      logger.debug('⚠️  검증: 남아있는 멤버십 발견:', { data: existingMemberships.length });

      // 본인이 소유자가 아닌 조직 중에서, 다른 소유자의 조직 멤버인지 확인
      const otherOwnerMembership = existingMemberships.find(
        (m: any) => m.organizations.owner_id !== userId && m.organizations.owner_id !== invitingOrg.owner_id
      )

      if (otherOwnerMembership) {
        logger.error('❌ 다른 소유자의 조직 멤버십 발견');
        return NextResponse.json(
          { error: '이미 다른 사람의 셀러계정 멤버입니다. 한 사람의 셀러계정에만 소속될 수 있습니다.' },
          { status: 400 }
        )
      }
    } else {
      logger.info('검증: 기존 멤버십 없음 - 새 조직 가입 가능');
    }

    // 기존 멤버십 확인 (suspended 포함)
    const { data: existingSuspendedMember } = await supabase
      .from('organization_members')
      .select('id, status')
      .eq('organization_id', invitation.organization_id)
      .eq('user_id', userId)
      .single()

    let member
    let memberError

    if (existingSuspendedMember) {
      // 기존 멤버십을 active로 변경
      const result = await supabase
        .from('organization_members')
        .update({
          role: invitation.role,
          status: 'active',
          invited_by: invitation.inviter_id,
          invited_at: invitation.created_at,
          joined_at: new Date().toISOString(),
          ...permissions,
        })
        .eq('id', existingSuspendedMember.id)
        .select()
        .single()

      member = result.data
      memberError = result.error
    } else {
      // 새로운 멤버로 추가
      const result = await supabase
        .from('organization_members')
        .insert({
          organization_id: invitation.organization_id,
          user_id: userId,
          role: invitation.role,
          status: 'active',
          invited_by: invitation.inviter_id,
          invited_at: invitation.created_at,
          joined_at: new Date().toISOString(),
          ...permissions,
        })
        .select()
        .single()

      member = result.data
      memberError = result.error
    }

    if (memberError) {
      logger.error('멤버 추가 실패:', memberError);
      return NextResponse.json(
        { error: '조직 가입에 실패했습니다' },
        { status: 500 }
      )
    }

    // 초대 상태 업데이트
    await supabase
      .from('organization_invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        accepted_by: userId,
      })
      .eq('id', invitationId)

    // 알림 읽음 처리
    if (invitation.notification_id) {
      await supabase
        .from('notifications')
        .update({
          read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', invitation.notification_id)
    }

    // 사용자의 primary_organization_id를 새 조직으로 업데이트
    await supabase
      .from('users')
      .update({
        primary_organization_id: invitation.organization_id,
      })
      .eq('id', userId)

    // 조직 정보 조회
    const { data: organization } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', invitation.organization_id)
      .single()

    return NextResponse.json({
      success: true,
      action: 'accepted',
      member,
      organization_id: invitation.organization_id,
      organization_name: organization?.name,
      message: '셀러계정 멤버가 되었습니다',
    })
  }

  return NextResponse.json(
    { error: '잘못된 action 값입니다' },
    { status: 400 }
  )
}
