import { createClientForRouteHandler } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-security'
import { CreateOrganizationRequest, UpdateOrganizationRequest } from '@/types/organization'
import { getDefaultPermissions } from '@/lib/organization-utils'

/**
 * GET /api/organizations
 * 사용자의 조직 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (!auth.authorized) return auth.error

    const supabase = await createClientForRouteHandler()

    // 사용자가 속한 모든 조직 조회
    const { data: memberOrgs, error: memberError } = await supabase
      .from('organization_members')
      .select(`
        organization_id,
        role,
        status,
        organizations (*)
      `)
      .eq('user_id', auth.user.id)
      .eq('status', 'active')

    if (memberError) {
      console.error('조직 조회 실패:', memberError)
      return NextResponse.json(
        { error: '조직 조회에 실패했습니다' },
        { status: 500 }
      )
    }

    // 조직 정보 추출
    const organizations = memberOrgs?.map((m: any) => ({
      ...m.organizations,
      my_role: m.role,
    })) || []

    return NextResponse.json({
      success: true,
      organizations,
    })
  } catch (error) {
    console.error('조직 조회 오류:', error)
    return NextResponse.json(
      { error: '조직 조회 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/organizations
 * 새 조직 생성
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (!auth.authorized) return auth.error

    const body: CreateOrganizationRequest = await request.json()
    const supabase = await createClientForRouteHandler()

    // 조직 생성
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: body.name,
        business_number: body.business_number,
        address: body.address,
        phone: body.phone,
        email: body.email,
        representative_name: body.representative_name,
        commission_rate: body.commission_rate || 0,
        settlement_cycle: body.settlement_cycle || '월1회',
        bank_name: body.bank_name,
        account_number: body.account_number,
        account_holder: body.account_holder,
        tax_invoice_email: body.tax_invoice_email,
        owner_id: auth.user.id,
        is_active: true,
      })
      .select()
      .single()

    if (orgError) {
      console.error('조직 생성 실패:', orgError)
      return NextResponse.json(
        { error: '조직 생성에 실패했습니다' },
        { status: 500 }
      )
    }

    // 소유자를 멤버로 추가
    const ownerPermissions = getDefaultPermissions('owner')
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: organization.id,
        user_id: auth.user.id,
        role: 'owner',
        status: 'active',
        joined_at: new Date().toISOString(),
        ...ownerPermissions,
      })

    if (memberError) {
      console.error('소유자 멤버 추가 실패:', memberError)
      // 조직 삭제 (롤백)
      await supabase.from('organizations').delete().eq('id', organization.id)
      return NextResponse.json(
        { error: '조직 생성에 실패했습니다' },
        { status: 500 }
      )
    }

    // 사용자의 primary_organization_id 업데이트 (첫 조직인 경우)
    const { data: currentUser } = await supabase
      .from('users')
      .select('primary_organization_id')
      .eq('id', auth.user.id)
      .single()

    if (!currentUser?.primary_organization_id) {
      await supabase
        .from('users')
        .update({ primary_organization_id: organization.id })
        .eq('id', auth.user.id)
    }

    return NextResponse.json({
      success: true,
      organization,
    })
  } catch (error) {
    console.error('조직 생성 오류:', error)
    return NextResponse.json(
      { error: '조직 생성 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/organizations?id=xxx
 * 조직 정보 수정
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (!auth.authorized) return auth.error

    const organizationId = request.nextUrl.searchParams.get('id')
    if (!organizationId) {
      return NextResponse.json(
        { error: '조직 ID가 필요합니다' },
        { status: 400 }
      )
    }

    const body: UpdateOrganizationRequest = await request.json()
    const supabase = await createClientForRouteHandler()

    // 권한 확인: 소유자만 수정 가능
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', auth.user.id)
      .eq('status', 'active')
      .single()

    if (!member || member.role !== 'owner') {
      return NextResponse.json(
        { error: '조직 정보를 수정할 권한이 없습니다' },
        { status: 403 }
      )
    }

    // 조직 정보 업데이트
    const { data: organization, error: updateError } = await supabase
      .from('organizations')
      .update(body)
      .eq('id', organizationId)
      .select()
      .single()

    if (updateError) {
      console.error('조직 정보 업데이트 실패:', updateError)
      return NextResponse.json(
        { error: '조직 정보 업데이트에 실패했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      organization,
    })
  } catch (error) {
    console.error('조직 정보 수정 오류:', error)
    return NextResponse.json(
      { error: '조직 정보 수정 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
