import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

interface IssueRequest {
  organization_id: string;
  issue_date: string;
  items: {
    item_name: string;
    spec?: string;
    qty: number;
    unit_cost: number;
  }[];
  remark?: string;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 관리자 권한 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: '인증되지 않은 사용자입니다.' },
        { status: 401 }
      );
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    const { invoices } = await request.json() as { invoices: IssueRequest[] };

    if (!invoices || invoices.length === 0) {
      return NextResponse.json(
        { success: false, error: '발급할 계산서 정보가 없습니다.' },
        { status: 400 }
      );
    }

    const results = [];

    for (const invoiceData of invoices) {
      try {
        // 금액 계산
        let totalSupplyCost = 0;
        let totalTaxAmount = 0;

        const items = invoiceData.items.map(item => {
          const supplyCost = item.unit_cost * item.qty;
          const taxAmount = Math.round(supplyCost * 0.1);
          totalSupplyCost += supplyCost;
          totalTaxAmount += taxAmount;

          return {
            item_name: item.item_name,
            spec: item.spec || null,
            qty: item.qty,
            unit_cost: item.unit_cost,
            supply_cost: supplyCost,
            tax_amount: taxAmount,
            remark: null
          };
        });

        const totalAmount = totalSupplyCost + totalTaxAmount;

        // 세금계산서 생성
        const { data: invoice, error: invoiceError } = await supabase
          .from('tax_invoices')
          .insert({
            organization_id: invoiceData.organization_id,
            invoice_number: `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            issue_date: invoiceData.issue_date,
            supply_cost: totalSupplyCost,
            tax_amount: totalTaxAmount,
            total_amount: totalAmount,
            status: 'issued',
            remark: invoiceData.remark || null,
            created_by: user.id
          })
          .select()
          .single();

        if (invoiceError) {
          console.error('세금계산서 생성 오류:', invoiceError);
          results.push({
            organization_id: invoiceData.organization_id,
            success: false,
            error: invoiceError.message
          });
          continue;
        }

        // 품목 추가
        const itemsWithInvoiceId = items.map(item => ({
          ...item,
          invoice_id: invoice.id
        }));

        const { error: itemsError } = await supabase
          .from('tax_invoice_items')
          .insert(itemsWithInvoiceId);

        if (itemsError) {
          console.error('품목 추가 오류:', itemsError);
          // 계산서는 생성되었지만 품목 추가 실패
          results.push({
            organization_id: invoiceData.organization_id,
            success: false,
            error: '품목 추가 실패: ' + itemsError.message
          });
          continue;
        }

        // 조직 정보 조회 (알림용)
        const { data: orgData } = await supabase
          .from('organizations')
          .select('business_name, business_email')
          .eq('id', invoiceData.organization_id)
          .single();

        results.push({
          organization_id: invoiceData.organization_id,
          organization_name: orgData?.business_name || '',
          invoice_id: invoice.id,
          invoice_number: invoice.invoice_number,
          total_amount: totalAmount,
          success: true
        });

        // TODO: 이메일 알림 전송 (선택사항)
        // await sendInvoiceEmail(orgData?.business_email, invoice);

      } catch (error: any) {
        console.error('세금계산서 발급 오류:', error);
        results.push({
          organization_id: invoiceData.organization_id,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `총 ${invoices.length}건 중 ${successCount}건 성공, ${failCount}건 실패`,
      results
    });

  } catch (error) {
    console.error('일괄 발급 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
