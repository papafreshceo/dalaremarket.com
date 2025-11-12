import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/api-security'
import { getUserMainOrganization, canCreateSubOrganization } from '@/lib/organization-helpers'

/**
 * POST /api/organizations/sub
 * 서브 셀러계정 생성
 */
export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const auth = await requireAuth(request)
    if (!auth.authorized) return auth.error

    const supabase = await createClient()
    const body = await request.json()

    // 사용자 정보 조회 (티어 확인)
    const { data: user } = await supabase
      .from('users')
      .select('tier')
      .eq('id', auth.user.id)
      .single()

    // 추가 계정 생성 가능 여부 확인
    const { canCreate, currentCount, maxCount } = await canCreateSubOrganization(
      auth.user.id,
      user?.tier || null
    )

    if (!canCreate) {
      return NextResponse.json(
        {
          error: `계정 한도 초과`,
          message: `현재 티어(${user?.tier || 'Light'})에서는 최대 ${maxCount}개의 계정만 보유할 수 있습니다.`,
          currentCount,
          maxCount,
        },
        { status: 400 }
      )
    }

    // 메인 계정 조회
    const mainOrg = await getUserMainOrganization(auth.user.id)
    if (!mainOrg) {
      return NextResponse.json(
        { error: '메인 셀러계정을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 서브 계정 생성
    const { data: subOrg, error: createError } = await supabase
      .from('organizations')
      .insert({
        owner_id: auth.user.id,
        parent_organization_id: mainOrg.id,
        is_main: false,
        name: body.business_name || `${mainOrg.name} 서브계정`,
        business_number: body.business_number,
        business_name: body.business_name,
        address: body.address,
        email: body.email,
        representative_name: body.representative_name,
        bank_name: body.bank_name,
        account_number: body.account_number,
        account_holder: body.account_holder,
        phone: body.phone,
        fax: body.fax,
      })
      .select()
      .single()

    if (createError) {
      console.error('서브 계정 생성 실패:', createError)
      return NextResponse.json(
        { error: '서브 계정 생성에 실패했습니다', details: createError.message },
        { status: 500 }
      )
    }

    // 서브 계정 생성 시 메인 계정의 owner로 자동 멤버 추가
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: mainOrg.id, // 메인 계정에 소속
        user_id: auth.user.id,
        role: 'owner',
        status: 'active',
        joined_at: new Date().toISOString(),
        can_manage_orders: true,
        can_manage_products: true,
        can_manage_members: true,
        can_view_financials: true,
      })

    if (memberError && memberError.code !== '23505') {
      // 23505 = 중복 키 (이미 멤버인 경우는 무시)
      console.warn('멤버 추가 경고:', memberError)
    }

    return NextResponse.json({
      success: true,
      organization: subOrg,
      message: '서브 셀러계정이 생성되었습니다',
    })
  } catch (error: any) {
    console.error('서브 계정 생성 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET /api/organizations/sub
 * 서브 셀러계정 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (!auth.authorized) return auth.error

    const supabase = await createClient()

    // 메인 계정 조회
    const mainOrg = await getUserMainOrganization(auth.user.id)
    if (!mainOrg) {
      return NextResponse.json(
        { error: '메인 셀러계정을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 서브 계정 목록 조회
    const { data: subOrgs, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('parent_organization_id', mainOrg.id)
      .eq('is_main', false)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('서브 계정 조회 실패:', error)
      return NextResponse.json(
        { error: '서브 계정 조회에 실패했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      sub_organizations: subOrgs || [],
      main_organization: mainOrg,
    })
  } catch (error: any) {
    console.error('서브 계정 조회 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/organizations/sub?id=xxx
 * 서브 셀러계정 삭제
 */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (!auth.authorized) return auth.error

    const orgId = request.nextUrl.searchParams.get('id')
    if (!orgId) {
      return NextResponse.json(
        { error: '삭제할 조직 ID가 필요합니다' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 삭제하려는 조직 조회
    const { data: org, error: fetchError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single()

    if (fetchError || !org) {
      return NextResponse.json(
        { error: '조직을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 권한 확인: 본인 소유 조직인지
    if (org.owner_id !== auth.user.id) {
      return NextResponse.json(
        { error: '삭제 권한이 없습니다' },
        { status: 403 }
      )
    }

    // 메인 계정은 삭제 불가
    if (org.is_main) {
      return NextResponse.json(
        { error: '메인 계정은 삭제할 수 없습니다' },
        { status: 400 }
      )
    }

    // 서브 계정 삭제 (CASCADE로 관련 데이터도 삭제됨)
    const { error: deleteError } = await supabase
      .from('organizations')
      .delete()
      .eq('id', orgId)

    if (deleteError) {
      console.error('조직 삭제 실패:', deleteError)
      return NextResponse.json(
        { error: '조직 삭제에 실패했습니다', details: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '서브 셀러계정이 삭제되었습니다',
    })
  } catch (error: any) {
    console.error('서브 계정 삭제 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다', details: error.message },
      { status: 500 }
    )
  }
}
