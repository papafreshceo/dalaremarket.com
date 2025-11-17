import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-security';
import { createAdminClient } from '@/lib/supabase/server';
import logger from '@/lib/logger';

/**
 * GET /api/admin/members/[id]
 * 특정 회원 상세 정보 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 관리자 권한 확인
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.error;

    const memberId = params.id;
    const adminClient = createAdminClient();

    // 회원 정보 조회
    const { data: member, error: memberError } = await adminClient
      .from('users')
      .select(`
        id,
        email,
        name,
        phone,
        role,
        approved,
        is_deleted,
        created_at,
        updated_at,
        deleted_at,
        primary_organization_id,
        email_verified,
        marketing_consent
      `)
      .eq('id', memberId)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { success: false, error: '회원을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 소속 조직 정보 조회 (primary_organization)
    let organization = null;
    if (member.primary_organization_id) {
      const { data: orgData } = await adminClient
        .from('organizations')
        .select('id, business_name, representative_name, owner_id')
        .eq('id', member.primary_organization_id)
        .eq('is_deleted', false)
        .single();

      if (orgData) {
        organization = {
          id: orgData.id,
          business_name: orgData.business_name,
          representative_name: orgData.representative_name,
          role: orgData.owner_id === member.id ? 'owner' : 'member'
        };
      }
    }

    return NextResponse.json({
      success: true,
      member: {
        ...member,
        organization
      }
    });

  } catch (error: any) {
    logger.error('GET /api/admin/members/[id] 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/members/[id]
 * 회원 정보 수정 (승인/거부 등)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 관리자 권한 확인
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.error;

    const memberId = params.id;
    const body = await request.json();
    const adminClient = createAdminClient();

    // 수정 가능한 필드만 추출
    const updateData: any = {};
    if (typeof body.approved === 'boolean') {
      updateData.approved = body.approved;
    }
    if (typeof body.role === 'string') {
      updateData.role = body.role;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: '수정할 데이터가 없습니다.' },
        { status: 400 }
      );
    }

    // 회원 정보 업데이트
    const { data: updatedMember, error: updateError } = await adminClient
      .from('users')
      .update(updateData)
      .eq('id', memberId)
      .select()
      .single();

    if (updateError) {
      logger.error('회원 정보 수정 오류:', updateError);
      return NextResponse.json(
        { success: false, error: '회원 정보 수정에 실패했습니다.' },
        { status: 500 }
      );
    }

    logger.info('회원 정보 수정 완료:', { memberId, updateData, adminUser: auth.userData.email });

    return NextResponse.json({
      success: true,
      member: updatedMember
    });

  } catch (error: any) {
    logger.error('PATCH /api/admin/members/[id] 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/members/[id]
 * 회원 삭제 (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 관리자 권한 확인
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.error;

    const memberId = params.id;
    const adminClient = createAdminClient();

    const now = new Date().toISOString();

    // 소유한 조직 확인 및 삭제
    const { data: ownedOrgs } = await adminClient
      .from('organizations')
      .select('id')
      .eq('owner_id', memberId)
      .eq('is_deleted', false);

    if (ownedOrgs && ownedOrgs.length > 0) {
      const orgIds = ownedOrgs.map(org => org.id);

      // 조직 관련 데이터 soft delete
      await adminClient.from('sub_accounts').update({ deleted_at: now, is_deleted: true })
        .in('organization_id', orgIds).eq('is_deleted', false);

      await adminClient.from('organization_cash').update({ deleted_at: now, is_deleted: true })
        .in('organization_id', orgIds).eq('is_deleted', false);

      await adminClient.from('organization_credits').update({ deleted_at: now, is_deleted: true })
        .in('organization_id', orgIds).eq('is_deleted', false);

      await adminClient.from('organization_members').update({ deleted_at: now, is_deleted: true })
        .in('organization_id', orgIds).eq('is_deleted', false);

      await adminClient.from('organizations').update({ deleted_at: now, is_deleted: true })
        .in('id', orgIds);
    }

    // 멤버로 속한 조직에서 탈퇴
    await adminClient.from('organization_members').update({ deleted_at: now, is_deleted: true })
      .eq('user_id', memberId).eq('is_deleted', false);

    // 회원 soft delete
    const { error: deleteError } = await adminClient
      .from('users')
      .update({
        deleted_at: now,
        is_deleted: true,
        primary_organization_id: null
      })
      .eq('id', memberId);

    if (deleteError) {
      logger.error('회원 삭제 오류:', deleteError);
      return NextResponse.json(
        { success: false, error: '회원 삭제에 실패했습니다.' },
        { status: 500 }
      );
    }

    // auth.users에서도 삭제 (재가입 가능하도록)
    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(memberId);
    if (authDeleteError) {
      logger.error('Auth 사용자 삭제 오류:', authDeleteError);
    }

    logger.info('회원 삭제 완료:', { memberId, adminUser: auth.userData.email });

    return NextResponse.json({
      success: true,
      message: '회원이 삭제되었습니다.'
    });

  } catch (error: any) {
    logger.error('DELETE /api/admin/members/[id] 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  }
}
