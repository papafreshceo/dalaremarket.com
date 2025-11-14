import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    console.log('🔍 [seller-info GET] 인증 체크:', { userId: user?.id, authError });

    if (authError || !user) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    console.log('🔍 [seller-info GET] organizationId:', organizationId);

    if (!organizationId) {
      return NextResponse.json({ error: '조직 ID가 필요합니다' }, { status: 400 });
    }

    // 조직 정보 조회
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('bank_account, bank_name, account_holder, depositor_name, representative_name, representative_phone, manager_name, manager_phone')
      .eq('id', organizationId)
      .single();

    console.log('🔍 [seller-info GET] 조회 결과:', { orgData, orgError });

    if (orgError) {
      console.error('❌ [seller-info GET] 조직 정보 조회 오류:', orgError);
      return NextResponse.json({
        success: false,
        error: '조직 정보 조회 실패',
        details: orgError
      }, { status: 500 });
    }

    console.log('✅ [seller-info GET] 성공');

    return NextResponse.json({
      success: true,
      data: orgData
    });
  } catch (error) {
    console.error('❌ [seller-info GET] API 오류:', error);
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다' }, { status: 401 });
    }

    const body = await request.json();
    const { organizationId, ...updateData } = body;

    if (!organizationId) {
      return NextResponse.json({ error: '조직 ID가 필요합니다' }, { status: 400 });
    }

    // 필드 매핑 (클라이언트에서 이미 올바른 필드명으로 전송됨)
    const dbUpdateData: any = {
      bank_account: updateData.bank_account,
      bank_name: updateData.bank_name,
      account_holder: updateData.account_holder,
      depositor_name: updateData.depositor_name,
      representative_name: updateData.representative_name,
      representative_phone: updateData.representative_phone,
      manager_name: updateData.manager_name,
      manager_phone: updateData.manager_phone,
    };

    // 조직 정보 업데이트
    const { error: updateError } = await supabase
      .from('organizations')
      .update(dbUpdateData)
      .eq('id', organizationId);

    if (updateError) {
      console.error('조직 정보 업데이트 오류:', updateError);
      return NextResponse.json({ error: '조직 정보 업데이트 실패', details: updateError }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: '정보가 저장되었습니다'
    });
  } catch (error) {
    console.error('API 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}
