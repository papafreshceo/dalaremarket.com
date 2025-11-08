import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET: 즐겨찾기 도구 목록 조회
export async function GET() {
  try {
    const supabase = await createClient();

    // 현재 로그인한 사용자 정보 가져오기
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 사용자의 즐겨찾기 도구 가져오기
    const { data, error } = await supabase
      .from('users')
      .select('favorite_tools')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching favorite tools:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      favoriteTools: data?.favorite_tools || []
    });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: 즐겨찾기 도구 업데이트
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 현재 로그인한 사용자 정보 가져오기
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { favoriteTools } = await request.json();

    if (!Array.isArray(favoriteTools)) {
      return NextResponse.json({ success: false, error: 'Invalid favoriteTools format' }, { status: 400 });
    }

    // 즐겨찾기 도구 업데이트
    const { error } = await supabase
      .from('users')
      .update({ favorite_tools: favoriteTools })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating favorite tools:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Favorite tools updated successfully',
      favoriteTools
    });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
