import { NextRequest, NextResponse } from 'next/server';
import { createClientForRouteHandler } from '@/lib/supabase/server';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  const supabase = await createClientForRouteHandler();

  const { data, error } = await supabase
    .from('mapping_settings_standard_fields')
    .select('*')
    .order('market_name', { ascending: true });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClientForRouteHandler();
  const body = await request.json();
  const { market_name, updates } = body;


  try {
    const { data, error} = await supabase
      .from('mapping_settings_standard_fields')
      .update(updates)
      .eq('market_name', market_name)
      .select();


    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    logger.error('저장 오류:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClientForRouteHandler();
  const body = await request.json();
  const { ids } = body;

  try {
    const { error } = await supabase
      .from('mapping_settings_standard_fields')
      .delete()
      .in('id', ids);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClientForRouteHandler();
  const body = await request.json();

  const { data, error } = await supabase
    .from('mapping_settings_standard_fields')
    .insert(body)
    .select();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: data[0] });
}
