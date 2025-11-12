import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET: 사용자 크레딧 조회 (기존 user_credits 테이블 사용)
export async function GET() {
  try {
    const supabase = await createClient();

    // 현재 로그인한 사용자 정보 가져오기
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 사용자 크레딧 조회 (기존 user_credits 테이블)
    const { data, error } = await supabase
      .from('organization_credits')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error fetching credits:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      credits: data?.balance || 0,
      balance: data?.balance || 0
    });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
