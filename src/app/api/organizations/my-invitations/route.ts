import { createClientForRouteHandler } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-security'
import logger from '@/lib/logger';

/**
 * GET /api/organizations/my-invitations
 * 내가 받은 초대 목록 조회 (자신의 이메일로 온 초대만)
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (!auth.authorized) return auth.error

    const invitationId = request.nextUrl.searchParams.get('invitation_id')
    const supabase = await createClientForRouteHandler()

    // 현재 사용자 이메일 조회
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', auth.user.id)
      .single()

    if (!user?.email) {
      return NextResponse.json(
        { error: '사용자 정보를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 특정 초대 조회
    if (invitationId) {
      const { data: invitation, error: fetchError } = await supabase
        .from('organization_invitations')
        .select('*')
        .eq('id', invitationId)
        .eq('email', user.email)
        .single()

      if (fetchError) {
        logger.error('초대 조회 실패:', fetchError);
        return NextResponse.json(
          { error: '초대를 찾을 수 없습니다' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        invitation,
      })
    }

    // 내가 받은 모든 초대 조회
    const { data: invitations, error: fetchError } = await supabase
      .from('organization_invitations')
      .select(`
        *,
        organization:organizations!organization_invitations_organization_id_fkey(
          id,
          name
        ),
        inviter:users!organization_invitations_inviter_id_fkey(
          id,
          email,
          profile_name,
          company_name
        )
      `)
      .eq('email', user.email)
      .order('created_at', { ascending: false })

    if (fetchError) {
      logger.error('초대 목록 조회 실패:', fetchError);
      return NextResponse.json(
        { error: '초대 목록 조회에 실패했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      invitations: invitations || [],
    })
  } catch (error) {
    logger.error('초대 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '초대 목록 조회 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
