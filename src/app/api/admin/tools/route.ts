import { NextRequest, NextResponse } from 'next/server';
import { createClientForRouteHandler } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/api-security';

// GET: 모든 도구 조회
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.error;

    const supabase = await createClientForRouteHandler();

    // 모든 도구 조회
    const { data: tools, error } = await supabase
      .from('tools_master')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching tools:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      tools: tools || []
    });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT: 도구 정보 수정
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.error;

    const supabase = await createClientForRouteHandler();

    const tool = await request.json();

    // 도구 정보 업데이트
    const { error } = await supabase
      .from('tools_master')
      .update({
        name: tool.name,
        description: tool.description,
        credits_required: tool.credits_required,
        is_active: tool.is_active,
        is_premium: tool.is_premium,
        display_order: tool.display_order,
        billing_type: tool.billing_type || 'on_open',
        billing_interval_minutes: tool.billing_interval_minutes || 60,
        action_buttons: tool.action_buttons || [],
        updated_at: new Date().toISOString()
      })
      .eq('id', tool.id);

    if (error) {
      console.error('Error updating tool:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Tool updated successfully'
    });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
