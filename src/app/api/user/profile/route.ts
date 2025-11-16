import { NextRequest, NextResponse } from 'next/server';
import { createClientForRouteHandler } from '@/lib/supabase/server';
import { autoCreateOrganizationFromUser, syncOrganizationFromUser } from '@/lib/auto-create-organization';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClientForRouteHandler();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    // 사용자 기본 정보 조회
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      logger.error('사용자 정보 조회 오류:', error);
      return NextResponse.json(
        { success: false, error: '사용자 정보를 불러올 수 없습니다.' },
        { status: 500 }
      );
    }

    // 조직 티어 정보만 추가 (나머지는 프론트엔드에서 직접 가져옴)
    if (userData.primary_organization_id) {
      const { data: orgData } = await supabase
        .from('organizations')
        .select('tier, tier_updated_at, is_manual_tier')
        .eq('id', userData.primary_organization_id)
        .single();

      if (orgData) {
        userData.tier = orgData.tier;
        userData.tier_updated_at = orgData.tier_updated_at;
        userData.is_manual_tier = orgData.is_manual_tier;
      }
    }

    return NextResponse.json({
      success: true,
      user: userData,
    });

  } catch (error: any) {
    logger.error('프로필 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClientForRouteHandler();
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

    // 사용자 기본 정보 조회
    const { data: userData } = await supabase
      .from('users')
      .select('primary_organization_id')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json(
        { success: false, error: '사용자 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 1. users 테이블 업데이트 (개인 정보만)
    const userUpdateData: any = {
      profile_name: profile_name?.trim() || null,
      name: name || null,
      phone: phone || null,
    };

    const { error: userUpdateError } = await supabase
      .from('users')
      .update(userUpdateData)
      .eq('id', user.id);

    if (userUpdateError) {
      logger.error('사용자 정보 업데이트 오류:', userUpdateError);
      return NextResponse.json(
        { success: false, error: '프로필 업데이트에 실패했습니다.', details: userUpdateError.message },
        { status: 500 }
      );
    }

    // 2. 셀러계정 정보가 있으면 organizations 테이블 업데이트
    const hasBusinessInfo =
      business_name ||
      business_number ||
      representative_name ||
      business_address ||
      business_email ||
      manager_name ||
      manager_phone ||
      bank_account ||
      bank_name ||
      account_holder ||
      store_name ||
      store_phone;

    if (hasBusinessInfo) {
      // 조직이 없으면 생성
      if (!userData.primary_organization_id) {
        try {
          await autoCreateOrganizationFromUser(user.id);
          // 생성 후 다시 조회
          const { data: newUserData } = await supabase
            .from('users')
            .select('primary_organization_id')
            .eq('id', user.id)
            .single();

          if (newUserData?.primary_organization_id) {
            userData.primary_organization_id = newUserData.primary_organization_id;
          }
        } catch (error) {
          logger.error('조직 자동 생성 오류:', error);
          return NextResponse.json(
            { success: false, error: '조직 생성에 실패했습니다.' },
            { status: 500 }
          );
        }
      }

      // 조직 정보 업데이트
      if (userData.primary_organization_id) {
        const orgUpdateData: any = {
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
          store_name: store_name || null,
          store_phone: store_phone || null,
        };

        const { error: orgUpdateError } = await supabase
          .from('organizations')
          .update(orgUpdateData)
          .eq('id', userData.primary_organization_id);

        if (orgUpdateError) {
          logger.error('조직 정보 업데이트 오류:', orgUpdateError);
          return NextResponse.json(
            { success: false, error: '셀러계정 정보 업데이트에 실패했습니다.', details: orgUpdateError.message },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: '프로필이 저장되었습니다.',
    });

  } catch (error: any) {
    logger.error('프로필 업데이트 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  }
}
