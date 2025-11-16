import { NextRequest, NextResponse } from 'next/server'
import { createClientForRouteHandler } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/api-security'
import logger from '@/lib/logger';

/**
 * GET /api/organizations/cleanup
 * 현재 사용자의 조직 목록 확인 및 정리
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (!auth.authorized) return auth.error

    const supabase = await createClientForRouteHandler()

    // 사용자 정보 조회
    const { data: user } = await supabase
      .from('users')
      .select('id, email, tier')
      .eq('id', auth.user.id)
      .single()

    // 모든 조직 조회
    const { data: orgs } = await supabase
      .from('organizations')
      .select('*')
      .eq('owner_id', auth.user.id)
      .order('is_main', { ascending: false })
      .order('created_at', { ascending: true })

    const mainOrgs = orgs?.filter(o => o.is_main) || []
    const subOrgs = orgs?.filter(o => !o.is_main) || []

    return NextResponse.json({
      success: true,
      user: {
        id: user?.id,
        email: user?.email,
        tier: user?.tier,
      },
      summary: {
        total: orgs?.length || 0,
        main: mainOrgs.length,
        sub: subOrgs.length,
      },
      organizations: {
        main: mainOrgs,
        sub: subOrgs,
      },
    })
  } catch (error: any) {
    logger.error('조직 확인 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/organizations/cleanup
 * 서브 조직 일괄 삭제 (메인만 남김)
 */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (!auth.authorized) return auth.error

    const supabase = await createClientForRouteHandler()

    // 서브 조직들 삭제
    const { data: deleted, error } = await supabase
      .from('organizations')
      .delete()
      .eq('owner_id', auth.user.id)
      .eq('is_main', false)
      .select()

    if (error) {
      logger.error('서브 조직 삭제 실패:', error);
      return NextResponse.json(
        { error: '서브 조직 삭제에 실패했습니다', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `${deleted?.length || 0}개의 서브 조직이 삭제되었습니다`,
      deleted_count: deleted?.length || 0,
    })
  } catch (error: any) {
    logger.error('정리 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다', details: error.message },
      { status: 500 }
    )
  }
}
