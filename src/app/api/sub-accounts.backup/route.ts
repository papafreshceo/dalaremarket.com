import { NextRequest, NextResponse } from 'next/server'
import { createClientForRouteHandler } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/api-security'

/**
 * POST /api/sub-accounts
 * 서브 계정(정산용 사업자 정보) 생성
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (!auth.authorized) return auth.error

    const supabase = await createClientForRouteHandler()
    const body = await request.json()

    // 사용자의 메인 조직 조회
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, tier')
      .eq('owner_id', auth.user.id)
      .single()

    if (orgError || !org) {
      return NextResponse.json(
        { error: '메인 계정을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 현재 서브 계정 개수 확인
    const { count: currentCount } = await supabase
      .from('sub_accounts')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', org.id)
      .eq('is_active', true)

    // 티어별 최대 개수 확인
    const tierLimits: Record<string, number> = {
      Light: 1,
      Pro: 3,
      Enterprise: 10,
    }
    const maxCount = tierLimits[org.tier || 'Light'] || 1

    if ((currentCount || 0) >= maxCount) {
      return NextResponse.json(
        {
          error: '서브 계정 한도 초과',
          message: `현재 티어(${org.tier || 'Light'})에서는 최대 ${maxCount}개의 서브 계정만 생성할 수 있습니다.`,
          currentCount,
          maxCount,
        },
        { status: 400 }
      )
    }

    // 서브 계정 생성
    const { data: subAccount, error: createError } = await supabase
      .from('sub_accounts')
      .insert({
        organization_id: org.id,
        business_name: body.business_name,
        business_number: body.business_number,
        representative_name: body.representative_name,
        address: body.address,
        email: body.email,
        phone: body.phone,
        fax: body.fax,
        bank_name: body.bank_name,
        account_number: body.account_number,
        account_holder: body.account_holder,
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

    return NextResponse.json({
      success: true,
      sub_account: subAccount,
      message: '서브 계정이 생성되었습니다',
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
 * GET /api/sub-accounts
 * 서브 계정 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (!auth.authorized) return auth.error

    const supabase = await createClientForRouteHandler()

    // 사용자의 메인 조직 조회
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('owner_id', auth.user.id)
      .single()

    if (orgError || !org) {
      return NextResponse.json(
        { error: '메인 계정을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 서브 계정 목록 조회
    const { data: subAccounts, error } = await supabase
      .from('sub_accounts')
      .select('*')
      .eq('organization_id', org.id)
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
      sub_accounts: subAccounts || [],
      main_organization: org,
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
 * PATCH /api/sub-accounts?id=xxx
 * 서브 계정 수정
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (!auth.authorized) return auth.error

    const subAccountId = request.nextUrl.searchParams.get('id')
    if (!subAccountId) {
      return NextResponse.json(
        { error: '수정할 서브 계정 ID가 필요합니다' },
        { status: 400 }
      )
    }

    const supabase = await createClientForRouteHandler()
    const body = await request.json()

    // 권한 확인: 본인 조직의 서브 계정인지
    const { data: subAccount } = await supabase
      .from('sub_accounts')
      .select('organization_id')
      .eq('id', subAccountId)
      .single()

    if (!subAccount) {
      return NextResponse.json(
        { error: '서브 계정을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', subAccount.organization_id)
      .eq('owner_id', auth.user.id)
      .single()

    if (!org) {
      return NextResponse.json(
        { error: '수정 권한이 없습니다' },
        { status: 403 }
      )
    }

    // 서브 계정 수정
    const { data: updated, error: updateError } = await supabase
      .from('sub_accounts')
      .update({
        business_name: body.business_name,
        business_number: body.business_number,
        representative_name: body.representative_name,
        address: body.address,
        email: body.email,
        phone: body.phone,
        fax: body.fax,
        bank_name: body.bank_name,
        account_number: body.account_number,
        account_holder: body.account_holder,
      })
      .eq('id', subAccountId)
      .select()
      .single()

    if (updateError) {
      console.error('서브 계정 수정 실패:', updateError)
      return NextResponse.json(
        { error: '서브 계정 수정에 실패했습니다', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      sub_account: updated,
      message: '서브 계정이 수정되었습니다',
    })
  } catch (error: any) {
    console.error('서브 계정 수정 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/sub-accounts?id=xxx
 * 서브 계정 삭제
 */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (!auth.authorized) return auth.error

    const subAccountId = request.nextUrl.searchParams.get('id')
    if (!subAccountId) {
      return NextResponse.json(
        { error: '삭제할 서브 계정 ID가 필요합니다' },
        { status: 400 }
      )
    }

    const supabase = await createClientForRouteHandler()

    // 권한 확인: 본인 조직의 서브 계정인지
    const { data: subAccount } = await supabase
      .from('sub_accounts')
      .select('organization_id')
      .eq('id', subAccountId)
      .single()

    if (!subAccount) {
      return NextResponse.json(
        { error: '서브 계정을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', subAccount.organization_id)
      .eq('owner_id', auth.user.id)
      .single()

    if (!org) {
      return NextResponse.json(
        { error: '삭제 권한이 없습니다' },
        { status: 403 }
      )
    }

    // 서브 계정 삭제
    const { error: deleteError } = await supabase
      .from('sub_accounts')
      .delete()
      .eq('id', subAccountId)

    if (deleteError) {
      console.error('서브 계정 삭제 실패:', deleteError)
      return NextResponse.json(
        { error: '서브 계정 삭제에 실패했습니다', details: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '서브 계정이 삭제되었습니다',
    })
  } catch (error: any) {
    console.error('서브 계정 삭제 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다', details: error.message },
      { status: 500 }
    )
  }
}
