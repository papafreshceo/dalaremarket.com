import { NextRequest, NextResponse } from 'next/server';
import { createClientForRouteHandler } from '@/lib/supabase/server';

// GET: 프리셋 목록 조회
export async function GET() {
  try {
    const supabase = await createClientForRouteHandler();

    const { data, error } = await supabase
      .from('platform_design_presets')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: 새 프리셋 생성 또는 업데이트 (이름 기준)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClientForRouteHandler();
    const body = await request.json();
    const { name, settings } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: '프리셋 이름이 필요합니다.' }, { status: 400 });
    }

    // 같은 이름의 프리셋이 있는지 확인
    const { data: existing } = await supabase
      .from('platform_design_presets')
      .select('id')
      .eq('name', name)
      .single();

    let data, error;

    if (existing) {
      // 기존 프리셋 업데이트
      const result = await supabase
        .from('platform_design_presets')
        .update({
          settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();
      data = result.data;
      error = result.error;
    } else {
      // 새 프리셋 생성
      const result = await supabase
        .from('platform_design_presets')
        .insert({
          name,
          settings,
          is_active: true
        })
        .select()
        .single();
      data = result.data;
      error = result.error;
    }

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT: 프리셋 수정
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClientForRouteHandler();
    const body = await request.json();
    const { id, name, settings } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: '프리셋 ID가 필요합니다.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('platform_design_presets')
      .update({
        name,
        settings,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
