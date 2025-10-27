import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // 특정 공지사항 조회
    if (id) {
      const { data: notice, error } = await supabase
        .from('platform_notices')
        .select('*')
        .eq('id', id)
        .eq('published', true)
        .single();

      if (error) throw error;

      // 조회수 증가
      if (notice) {
        await supabase
          .from('platform_notices')
          .update({ view_count: notice.view_count + 1 })
          .eq('id', id);
      }

      return NextResponse.json({ notice });
    }

    // 공지사항 목록 조회
    const { data: notices, error } = await supabase
      .from('platform_notices')
      .select('*')
      .eq('published', true)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ notices });
  } catch (error: any) {
    console.error('Error fetching notices:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch notices' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 관리자 권한 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || !['admin', 'super_admin', 'employee'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    const { data: notice, error } = await supabase
      .from('platform_notices')
      .insert({
        ...body,
        author_id: user.id
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ notice });
  } catch (error: any) {
    console.error('Error creating notice:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create notice' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();

    // 관리자 권한 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || !['admin', 'super_admin', 'employee'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    const { data: notice, error } = await supabase
      .from('platform_notices')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ notice });
  } catch (error: any) {
    console.error('Error updating notice:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update notice' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();

    // 관리자 권한 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || !['admin', 'super_admin', 'employee'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Notice ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('platform_notices')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting notice:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete notice' },
      { status: 500 }
    );
  }
}
