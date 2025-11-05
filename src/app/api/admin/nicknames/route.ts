import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 관리자 권한 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 관리자 닉네임 목록 조회
    const { data: nicknames, error } = await supabase
      .from('admin_nicknames')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('관리자 닉네임 조회 오류:', error);
      return NextResponse.json(
        { success: false, error: '관리자 닉네임을 불러올 수 없습니다.', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      nicknames: nicknames || [],
    });

  } catch (error: any) {
    console.error('관리자 닉네임 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 관리자 권한 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { nickname, description } = body;

    if (!nickname || !nickname.trim()) {
      return NextResponse.json(
        { success: false, error: '닉네임을 입력해주세요.' },
        { status: 400 }
      );
    }

    if (nickname.length > 20) {
      return NextResponse.json(
        { success: false, error: '닉네임은 최대 20자까지 입력 가능합니다.' },
        { status: 400 }
      );
    }

    // 닉네임 중복 체크 (admin_nicknames와 users 테이블 모두)
    const { data: existingAdminNickname } = await supabase
      .from('admin_nicknames')
      .select('id')
      .eq('nickname', nickname.trim())
      .single();

    if (existingAdminNickname) {
      return NextResponse.json(
        { success: false, error: '이미 사용 중인 관리자 닉네임입니다.' },
        { status: 400 }
      );
    }

    const { data: existingUserNickname } = await supabase
      .from('users')
      .select('id')
      .eq('nickname', nickname.trim())
      .single();

    if (existingUserNickname) {
      return NextResponse.json(
        { success: false, error: '이미 사용 중인 닉네임입니다. (일반 사용자)' },
        { status: 400 }
      );
    }

    // 관리자 닉네임 추가
    const { data: newNickname, error: insertError } = await supabase
      .from('admin_nicknames')
      .insert({
        nickname: nickname.trim(),
        description: description?.trim() || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('관리자 닉네임 추가 오류:', insertError);
      return NextResponse.json(
        { success: false, error: '관리자 닉네임 추가에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      nickname: newNickname,
    });

  } catch (error: any) {
    console.error('관리자 닉네임 추가 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  }
}
