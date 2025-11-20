import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // 현재 사용자 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: '인증되지 않은 사용자입니다.' },
        { status: 401 }
      );
    }

    // 사용자의 primary_organization_id 조회
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('primary_organization_id')
      .eq('id', user.id)
      .single();

    if (userDataError || !userData?.primary_organization_id) {
      return NextResponse.json(
        { success: false, error: '조직 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 해당 조직의 세금계산서 목록 조회 (항목 포함)
    const { data: invoices, error: invoicesError } = await supabase
      .from('tax_invoices')
      .select(`
        *,
        tax_invoice_items (
          id,
          item_name,
          spec,
          qty,
          unit_cost,
          supply_cost,
          tax_amount,
          remark
        )
      `)
      .eq('organization_id', userData.primary_organization_id)
      .order('issue_date', { ascending: false });

    if (invoicesError) {
      console.error('세금계산서 조회 오류:', invoicesError);
      return NextResponse.json(
        { success: false, error: '세금계산서 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      invoices: invoices || []
    });

  } catch (error) {
    console.error('세금계산서 목록 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
