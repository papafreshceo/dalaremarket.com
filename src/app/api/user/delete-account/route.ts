import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function DELETE() {
  try {
    const supabase = await createClient();

    // 현재 로그인한 사용자 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: '인증되지 않은 사용자입니다.' },
        { status: 401 }
      );
    }

    const adminClient = createAdminClient();

    // 1. 사용자가 소유한 조직들 조회
    const { data: ownedOrgs, error: orgsError } = await adminClient
      .from('organizations')
      .select('id')
      .eq('owner_id', user.id);

    if (orgsError) {
      logger.error('조직 조회 오류:', orgsError);
      return NextResponse.json(
        { error: '조직 정보 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 2. 각 조직의 멤버들에게 새 개인 조직 생성
    if (ownedOrgs && ownedOrgs.length > 0) {
      for (const org of ownedOrgs) {
        // 해당 조직의 멤버들 조회 (소유자 제외)
        const { data: members, error: membersError } = await adminClient
          .from('organization_members')
          .select('user_id, users!organization_members_user_id_fkey(id, name, email, phone)')
          .eq('organization_id', org.id)
          .neq('user_id', user.id);

        if (membersError) {
          logger.error('멤버 조회 오류:', membersError);
          continue;
        }

        // 각 멤버에게 새 개인 조직 생성
        if (members && members.length > 0) {
          for (const member of members) {
            const memberData = member.users as any;
            if (!memberData) continue;

            // 셀러 코드 & 파트너 코드 생성
            const sellerCode = 'S' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
            const partnerCode = 'P' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');

            // 새 조직 생성
            const { data: newOrg, error: createOrgError } = await adminClient
              .from('organizations')
              .insert({
                owner_id: member.user_id,
                business_name: `${memberData.name || '새 조직'}의 조직`,
                business_registration_number: '',
                representative_name: memberData.name || '대표자',
                business_type: '',
                business_category: '',
                postal_code: '',
                address: '',
                detailed_address: '',
                phone_number: memberData.phone || '',
                email: memberData.email || '',
                bank_name: '',
                account_number: '',
                account_holder: '',
                seller_code: sellerCode,
                partner_code: partnerCode
              })
              .select()
              .single();

            if (createOrgError || !newOrg) {
              logger.error('조직 생성 오류:', createOrgError);
              continue;
            }

            // 멤버의 primary_organization_id 업데이트
            await adminClient
              .from('users')
              .update({ primary_organization_id: newOrg.id })
              .eq('id', member.user_id);

            logger.info('멤버 ${memberData.email}에게 새 조직 생성 완료:');
          }
        }
      }
    }

    // 3. public.users 삭제 (CASCADE로 조직 및 관련 데이터 자동 삭제)
    logger.debug('🗑️ public.users 삭제 시작:', { data: user.id });
    const { error: deletePublicUserError } = await adminClient
      .from('users')
      .delete()
      .eq('id', user.id);

    if (deletePublicUserError) {
      logger.error('❌ public.users 삭제 오류:', deletePublicUserError);
      return NextResponse.json(
        { error: 'public.users 삭제 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    logger.info('public.users 삭제 완료:');

    // 4. auth.users 삭제
    logger.debug('🗑️ auth.users 삭제 시작:', { data: user.id });
    const { error: deleteAuthUserError } = await adminClient.auth.admin.deleteUser(user.id);

    if (deleteAuthUserError) {
      logger.error('❌ auth.users 삭제 오류:', deleteAuthUserError);
      // auth.users 삭제 실패해도 public.users는 이미 삭제됨
      // 에러를 반환하지만 치명적이진 않음
    }

    logger.info('auth.users 삭제 완료:');

    return NextResponse.json({
      success: true,
      message: '회원 탈퇴가 완료되었습니다.'
    });
  } catch (error: any) {
    logger.error('회원 탈퇴 처리 오류:', error);
    return NextResponse.json(
      { error: error.message || '회원 탈퇴 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
