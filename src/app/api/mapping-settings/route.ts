import { NextRequest, NextResponse } from 'next/server';
import { createClientForRouteHandler } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClientForRouteHandler();

  const { data, error } = await supabase
    .from('mapping_settings')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}

export async function POST(request: NextRequest) {
  const supabase = await createClientForRouteHandler();
  const body = await request.json();

  const { data, error } = await supabase
    .from('mapping_settings')
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

  const { data, error } = await supabase
    .from('mapping_settings')
    .update(updates)
    .eq('id', id)
    .select();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: data[0] });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClientForRouteHandler();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('mapping_settings')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
