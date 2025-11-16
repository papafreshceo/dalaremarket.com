import { NextRequest, NextResponse } from 'next/server'
import { createClientForRouteHandler } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/api-security'
import logger from '@/lib/logger';

/**
 * POST /api/organizations/sub
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

    // 서브 계정 생성 (한도 체크는 프론트엔드에서 '서브계정추가' 버튼 클릭 시 수행)
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
        store_name: body.store_name,
        store_phone: body.store_phone,
      })
      .select()
      .single()

    if (createError) {
      logger.error('서브 계정 생성 실패:', createError);
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
    logger.error('서브 계정 생성 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET /api/organizations/sub
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

    // 서브 계정 목록 조회 (메인 계정 제외)
    const { data: subAccounts, error } = await supabase
      .from('sub_accounts')
      .select('*')
      .eq('organization_id', org.id)
      .eq('is_main', false)
      .order('created_at', { ascending: true })

    if (error) {
      logger.error('서브 계정 조회 실패:', error);
      return NextResponse.json(
        { error: '서브 계정 조회에 실패했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      sub_organizations: subAccounts || [],
      main_organization: org,
    })
  } catch (error: any) {
    logger.error('서브 계정 조회 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/organizations/sub
 * 서브 계정 수정
 */
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (!auth.authorized) return auth.error

    const supabase = await createClientForRouteHandler()
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json(
        { error: '서브 계정 ID가 필요합니다' },
        { status: 400 }
      )
    }

    // 권한 확인: 본인 조직의 서브 계정인지
    const { data: subAccount } = await supabase
      .from('sub_accounts')
      .select('organization_id')
      .eq('id', body.id)
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
    const { data: updatedAccount, error: updateError } = await supabase
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
        store_name: body.store_name,
        store_phone: body.store_phone,
      })
      .eq('id', body.id)
      .select()
      .single()

    if (updateError) {
      logger.error('서브 계정 수정 실패:', updateError);
      return NextResponse.json(
        { error: '서브 계정 수정에 실패했습니다', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      sub_account: updatedAccount,
      message: '서브 계정이 수정되었습니다',
    })
  } catch (error: any) {
    logger.error('서브 계정 수정 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/organizations/sub?id=xxx
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
      logger.error('서브 계정 삭제 실패:', deleteError);
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
    logger.error('서브 계정 삭제 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다', details: error.message },
      { status: 500 }
    )
  }
}
