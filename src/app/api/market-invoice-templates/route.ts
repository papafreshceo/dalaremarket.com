import { createClientForRouteHandler } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/market-invoice-templates
 * 모든 마켓 송장 템플릿 조회
 */
export async function GET() {
  try {
    const supabase = await createClientForRouteHandler();

    const { data, error } = await supabase
      .from('market_invoice_templates')
      .select('*')
      .order('market_name');

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error: any) {
    console.error('GET /api/market-invoice-templates 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/market-invoice-templates
 * 새로운 마켓 송장 템플릿 추가
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClientForRouteHandler();
    const body = await request.json();

    const { market_name, template_name, columns } = body;

    // 중복 체크
    const { data: existing } = await supabase
      .from('market_invoice_templates')
      .select('id')
      .eq('market_name', market_name)
      .single();

    if (existing) {
      return NextResponse.json(
        { success: false, error: '이미 존재하는 마켓입니다.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('market_invoice_templates')
      .insert({
        market_name,
        template_name,
        columns,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('POST /api/market-invoice-templates 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/market-invoice-templates
 * 마켓 송장 템플릿 수정
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClientForRouteHandler();
    const body = await request.json();

    const { id, market_name, template_name, sheet_name, columns, is_active } = body;

    const { data, error } = await supabase
      .from('market_invoice_templates')
      .update({
        market_name,
        template_name,
        sheet_name,
        columns,
        is_active,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('PUT /api/market-invoice-templates 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/market-invoice-templates
 * 마켓 송장 템플릿 삭제
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClientForRouteHandler();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('market_invoice_templates')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('DELETE /api/market-invoice-templates 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
