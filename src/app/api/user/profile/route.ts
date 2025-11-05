import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    // 사용자 정보 조회 (모든 판매자 정보 포함)
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('사용자 정보 조회 오류:', error);
      return NextResponse.json(
        { success: false, error: '사용자 정보를 불러올 수 없습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: userData,
    });

  } catch (error: any) {
    console.error('프로필 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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
    const {
      profile_name,
      name,
      phone,
      business_name,
      business_address,
      business_number,
      business_email,
      representative_name,
      representative_phone,
      manager_name,
      manager_phone,
      bank_account,
      bank_name,
      account_holder,
      depositor_name,
      store_name,
      store_phone,
    } = body;

    // 프로필 이름 유효성 검사
    if (profile_name && profile_name.length > 10) {
      return NextResponse.json(
        { success: false, error: '프로필 이름은 최대 10자까지 입력 가능합니다.' },
        { status: 400 }
      );
    }

    // 프로필 이름 중복 체크 (프로필 이름이 변경되는 경우에만)
    if (profile_name && profile_name.trim()) {
      // 1. 다른 사용자의 프로필 이름과 중복 확인
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('profile_name', profile_name.trim())
        .neq('id', user.id)
        .single();

      if (existingUser) {
        return NextResponse.json(
          { success: false, error: '이미 사용 중인 프로필 이름입니다.' },
          { status: 400 }
        );
      }

      // 2. 관리자 닉네임과 중복 확인
      const { data: adminNickname } = await supabase
        .from('admin_nicknames')
        .select('id')
        .eq('nickname', profile_name.trim())
        .single();

      if (adminNickname) {
        return NextResponse.json(
          { success: false, error: '해당 프로필 이름은 사용할 수 없습니다.' },
          { status: 400 }
        );
      }
    }

    // 업데이트할 데이터 준비
    const updateData: any = {
      profile_name: profile_name?.trim() || null,
      name: name || null,
      phone: phone || null,
      business_name: business_name || null,
      business_address: business_address || null,
      business_number: business_number || null,
      business_email: business_email || null,
      representative_name: representative_name || null,
      representative_phone: representative_phone || null,
      manager_name: manager_name || null,
      manager_phone: manager_phone || null,
      bank_account: bank_account || null,
      bank_name: bank_name || null,
      account_holder: account_holder || null,
      depositor_name: depositor_name || null,
      store_name: store_name || null,
      store_phone: store_phone || null,
    };

    // 프로필 업데이트
    const { error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id);

    if (updateError) {
      console.error('프로필 업데이트 오류:', updateError);

      return NextResponse.json(
        { success: false, error: '프로필 업데이트에 실패했습니다.', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '프로필이 저장되었습니다.',
    });

  } catch (error: any) {
    console.error('프로필 업데이트 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  }
}
