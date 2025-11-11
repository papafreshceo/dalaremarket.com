import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-security'
import { getInvitationByToken, getDefaultPermissions } from '@/lib/organization-utils'

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
    console.error('초대 정보 조회 오류:', error)
    return NextResponse.json(
      { error: '초대 정보 조회 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/organizations/join
 * 초대 수락 및 조직 가입
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (!auth.authorized) return auth.error

    const { token } = await request.json()
    if (!token) {
      return NextResponse.json(
        { error: '초대 토큰이 필요합니다' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

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

    // 조직 멤버로 추가
    const { data: member, error: memberError } = await supabase
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

    if (memberError) {
      console.error('멤버 추가 실패:', memberError)
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

    // 사용자의 primary_organization_id 업데이트 (첫 조직인 경우)
    const { data: currentUser } = await supabase
      .from('users')
      .select('primary_organization_id')
      .eq('id', auth.user.id)
      .single()

    if (!currentUser?.primary_organization_id) {
      await supabase
        .from('users')
        .update({ primary_organization_id: invitation.organization_id })
        .eq('id', auth.user.id)
    }

    return NextResponse.json({
      success: true,
      member,
      organization_id: invitation.organization_id,
    })
  } catch (error) {
    console.error('조직 가입 오류:', error)
    return NextResponse.json(
      { error: '조직 가입 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
