import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import logger from '@/lib/logger';

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

    logger.info('🗑️ 회원 탈퇴 시작 (Soft Delete):', { userId: user.id });

    const now = new Date().toISOString();

    // 1. 소유한 조직 확인
    const { data: ownedOrgs, error: orgsError } = await adminClient
      .from('organizations')
      .select('id')
      .eq('owner_id', user.id)
      .eq('is_deleted', false);

    if (orgsError) {
      logger.error('❌ 조직 조회 오류:', orgsError);
      return NextResponse.json(
        { error: '조직 조회 중 오류가 발생했습니다.', details: orgsError.message },
        { status: 500 }
      );
    }

    // 2. 소유한 조직이 있으면 조직 및 모든 하위 데이터 삭제
    if (ownedOrgs && ownedOrgs.length > 0) {
      const orgIds = ownedOrgs.map(org => org.id);
      logger.info('🏢 소유 조직 삭제:', { orgIds });

      // 2-1. 조직의 모든 서브계정 삭제
      const { error: subAccountsError } = await adminClient
        .from('sub_accounts')
        .update({ deleted_at: now, is_deleted: true })
        .in('organization_id', orgIds)
        .eq('is_deleted', false);

      if (subAccountsError) {
        logger.error('❌ 서브계정 삭제 오류:', subAccountsError);
      } else {
        logger.info('✅ 서브계정 삭제 완료');
      }

      // 2-2. 조직 캐시 삭제
      const { error: cashError } = await adminClient
        .from('organization_cash')
        .update({ deleted_at: now, is_deleted: true })
        .in('organization_id', orgIds)
        .eq('is_deleted', false);

      if (cashError) {
        logger.error('❌ 조직 캐시 삭제 오류:', cashError);
      } else {
        logger.info('✅ 조직 캐시 삭제 완료');
      }

      // 2-3. 조직 크레딧 삭제
      const { error: creditsError } = await adminClient
        .from('organization_credits')
        .update({ deleted_at: now, is_deleted: true })
        .in('organization_id', orgIds)
        .eq('is_deleted', false);

      if (creditsError) {
        logger.error('❌ 조직 크레딧 삭제 오류:', creditsError);
      } else {
        logger.info('✅ 조직 크레딧 삭제 완료');
      }

      // 2-4. 조직의 모든 멤버 삭제
      const { error: membersError } = await adminClient
        .from('organization_members')
        .update({ deleted_at: now, is_deleted: true })
        .in('organization_id', orgIds)
        .eq('is_deleted', false);

      if (membersError) {
        logger.error('❌ 조직 멤버 삭제 오류:', membersError);
      } else {
        logger.info('✅ 조직 멤버 삭제 완료');
      }

      // 2-5. 조직 삭제
      const { error: deleteOrgsError } = await adminClient
        .from('organizations')
        .update({ deleted_at: now, is_deleted: true })
        .in('id', orgIds);

      if (deleteOrgsError) {
        logger.error('❌ 조직 삭제 오류:', deleteOrgsError);
      } else {
        logger.info('✅ 소유 조직 삭제 완료');
      }
    }

    // 3. 멤버로 속한 조직에서 탈퇴
    const { error: leaveMembersError } = await adminClient
      .from('organization_members')
      .update({ deleted_at: now, is_deleted: true })
      .eq('user_id', user.id)
      .eq('is_deleted', false);

    if (leaveMembersError) {
      logger.error('❌ 조직 멤버 탈퇴 오류:', leaveMembersError);
    } else {
      logger.info('✅ 조직 멤버 탈퇴 완료');
    }

    // 4. 사용자 계정 탈퇴 처리 (public.users soft delete)
    const { error: updateError } = await adminClient
      .from('users')
      .update({
        deleted_at: now,
        is_deleted: true,
        primary_organization_id: null,
      })
      .eq('id', user.id);

    if (updateError) {
      logger.error('❌ 회원 탈퇴 오류:', updateError);
      return NextResponse.json(
        {
          error: '회원 탈퇴 중 오류가 발생했습니다.',
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    // 5. auth.users에서 삭제 (재가입 가능하도록)
    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(user.id);

    if (authDeleteError) {
      logger.error('❌ Auth 사용자 삭제 오류:', authDeleteError);
      // Auth 삭제 실패는 치명적이지 않으므로 로그만 남김
    } else {
      logger.info('✅ Auth 사용자 삭제 완료');
    }

    logger.info('✅ 회원 탈퇴 완료:', { userId: user.id, deletedAt: now });

    return NextResponse.json({
      success: true,
      message: '회원 탈퇴가 완료되었습니다.'
    });
  } catch (error: any) {
    logger.error('❌ 회원 탈퇴 처리 오류:', error);
    return NextResponse.json(
      {
        error: error.message || '회원 탈퇴 중 오류가 발생했습니다.',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
