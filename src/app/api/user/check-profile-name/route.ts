import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { profile_name } = body;

    if (!profile_name || !profile_name.trim()) {
      return NextResponse.json(
        { success: false, error: '프로필 이름을 입력해주세요.' },
        { status: 400 }
      );
    }

    if (profile_name.length > 10) {
      return NextResponse.json(
        { success: false, error: '프로필 이름은 최대 10자까지 입력 가능합니다.' },
        { status: 400 }
      );
    }

    // 1. 다른 사용자의 프로필 이름과 중복 확인
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('profile_name', profile_name.trim())
      .neq('id', user.id)
      .single();

    if (existingUser) {
      return NextResponse.json({
        success: false,
        available: false,
        message: '이미 사용 중인 프로필 이름입니다.',
      });
    }

    // 2. 관리자 닉네임과 중복 확인
    const { data: adminNickname } = await supabase
      .from('admin_nicknames')
      .select('id')
      .eq('nickname', profile_name.trim())
      .single();

    if (adminNickname) {
      return NextResponse.json({
        success: false,
        available: false,
        message: '해당 프로필 이름은 사용할 수 없습니다.',
      });
    }

    // 사용 가능한 프로필 이름
    return NextResponse.json({
      success: true,
      available: true,
      message: '사용 가능한 프로필 이름입니다.',
    });

  } catch (error: any) {
    console.error('프로필 이름 확인 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  }
}
