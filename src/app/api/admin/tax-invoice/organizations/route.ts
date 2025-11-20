import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
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

    // 모든 조직 조회
    const { data: organizations, error: orgsError } = await supabase
      .from('organizations')
      .select(`
        id,
        business_name,
        business_number,
        business_email,
        email,
        phone,
        address,
        seller_code,
        tier,
        created_at
      `)
      .order('business_name', { ascending: true });

    if (orgsError) {
      console.error('조직 조회 오류:', orgsError);
      return NextResponse.json(
        { success: false, error: '조직 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      organizations: organizations || []
    });

  } catch (error) {
    console.error('조직 목록 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
