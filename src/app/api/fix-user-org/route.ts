import { createClientForRouteHandler } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/fix-user-org
 * 특정 사용자에게 개인 셀러계정 생성
 *
 * Body: { email: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'email이 필요합니다' },
        { status: 400 }
      )
    }

    // Admin client 생성
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const adminSupabase = createAdminClient(supabaseUrl, supabaseServiceKey)

    logger.debug('🔍 사용자 조회:', { data: email });

    // 사용자 조회
    const { data: user, error: userError } = await adminSupabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (userError || !user) {
      logger.error('❌ 사용자를 찾을 수 없습니다:', userError);
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    logger.debug('✅ 사용자 발견:', {
      id: user.id,
      email: user.email,
      name: user.name,
      primary_organization_id: user.primary_organization_id,
      role: user.role
    });

    // 이미 primary_organization_id가 있고 유효한지 확인
    if (user.primary_organization_id) {
      const { data: org } = await adminSupabase
        .from('organizations')
        .select('*')
        .eq('id', user.primary_organization_id)
        .single()

      if (org) {
        logger.info('유효한 조직이 이미 존재합니다:');
        return NextResponse.json({
          success: true,
          message: '이미 유효한 조직이 존재합니다',
          organization: org
        })
      } else {
        logger.warn('조직이 존재하지 않습니다. 새로 생성합니다...');
      }
    }

    // 기존 active 멤버십 확인
    const { data: activeMemberships } = await adminSupabase
      .from('organization_members')
      .select('*, organizations(*)')
      .eq('user_id', user.id)
      .eq('status', 'active')

    logger.debug('📋 기존 active 멤버십:', { data: activeMemberships?.length || 0 });

    // 개인 셀러계정명
    const orgName = `${user.name || user.email} 셀러계정`

    logger.debug('🏢 개인 셀러계정 생성 중:', { data: orgName });

    // 새 조직 생성
    const { data: newOrg, error: orgError } = await adminSupabase
      .from('organizations')
      .insert({
        owner_id: user.id,
        business_name: orgName,
        is_active: true,
        tier: 'light',
      })
      .select()
      .single()

    if (orgError) {
      logger.error('❌ 조직 생성 실패:', orgError);
      return NextResponse.json(
        { error: '조직 생성에 실패했습니다', details: orgError },
        { status: 500 }
      )
    }

    logger.info('조직 생성 완료:');

    // 멤버로 추가
    const { data: newMember, error: memberError } = await adminSupabase
      .from('organization_members')
      .insert({
        organization_id: newOrg.id,
        user_id: user.id,
        role: 'owner',
        status: 'active',
        joined_at: new Date().toISOString(),
        can_manage_members: true,
        can_manage_products: true,
        can_manage_orders: true,
        can_view_financials: true,
      })
      .select()
      .single()

    if (memberError) {
      logger.error('❌ 멤버 추가 실패:', memberError);
      // 롤백: 조직 삭제
      await adminSupabase.from('organizations').delete().eq('id', newOrg.id)
      return NextResponse.json(
        { error: '멤버 추가에 실패했습니다', details: memberError },
        { status: 500 }
      )
    }

    logger.info('멤버 추가 완료:');

    // primary_organization_id 업데이트
    const { error: updateError } = await adminSupabase
      .from('users')
      .update({ primary_organization_id: newOrg.id })
      .eq('id', user.id)

    if (updateError) {
      logger.error('❌ primary_organization_id 업데이트 실패:', updateError);
      return NextResponse.json(
        { error: 'primary_organization_id 업데이트에 실패했습니다', details: updateError },
        { status: 500 }
      )
    }

    logger.info('primary_organization_id 업데이트 완료');

    return NextResponse.json({
      success: true,
      message: '개인 셀러계정이 생성되었습니다',
      organization: newOrg,
      member: newMember
    })
  } catch (error) {
    logger.error('❌ 오류 발생:', error);
    return NextResponse.json(
      { error: '처리 중 오류가 발생했습니다', details: String(error) },
      { status: 500 }
    )
  }
}
