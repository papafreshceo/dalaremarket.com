import { NextRequest, NextResponse } from 'next/server';
import { createClientForRouteHandler } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClientForRouteHandler();

  const { data, error } = await supabase
    .from('courier_settings')
    .select('*')
    .order('display_order', { ascending: true, nullsFirst: false })
    .order('id', { ascending: true });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}

export async function POST(request: NextRequest) {
  const supabase = await createClientForRouteHandler();
  const body = await request.json();

  const { data, error } = await supabase
    .from('courier_settings')
    .insert(body)
    .select();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: data[0] });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClientForRouteHandler();
  const body = await request.json();
  const { id, ...updates } = body;

  try {
    const { data, error } = await supabase
      .from('courier_settings')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data: data[0] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClientForRouteHandler();
  const body = await request.json();
  const { ids } = body;

  try {
    const { error } = await supabase
      .from('courier_settings')
      .delete()
      .in('id', ids);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
