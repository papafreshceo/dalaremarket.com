import { createClientForRouteHandler, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-security';
import logger from '@/lib/logger';
import { notifyDepositConfirm } from '@/lib/onesignal-notifications';

/**
 * POST /api/admin/organizations/[id]/cash
 * 관리자가 조직에 캐시를 지급/회수
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 관리자 권한 확인
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.error;

    const { id: organizationId } = await params;
    const { cash, description } = await request.json();

    // 캐시 값 검증 (음수 허용 - 회수)
    if (!cash || typeof cash !== 'number' || cash === 0) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 캐시 값입니다.' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // 1. 조직의 현재 캐시 잔액 조회 또는 생성
    let { data: cashRecord, error: fetchError } = await adminClient
      .from('organization_cash')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    // 캐시 레코드가 없으면 생성
    if (fetchError && fetchError.code === 'PGRST116') {
      const { data: newRecord, error: insertError } = await adminClient
        .from('organization_cash')
        .insert({
          organization_id: organizationId,
          balance: 0
        })
        .select()
        .single();

      if (insertError) {
        logger.error('캐시 레코드 생성 오류:', insertError);
        return NextResponse.json(
          { success: false, error: '캐시 레코드 생성에 실패했습니다.' },
          { status: 500 }
        );
      }

      cashRecord = newRecord;
    } else if (fetchError) {
      logger.error('캐시 조회 오류:', fetchError);
      return NextResponse.json(
        { success: false, error: '캐시 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 2. 잔액 검증 (회수 시)
    const currentBalance = cashRecord?.balance || 0;
    const newBalance = currentBalance + cash;

    if (newBalance < 0) {
      return NextResponse.json(
        { success: false, error: `잔액이 부족합니다. (현재: ${currentBalance.toLocaleString()}원, 요청: ${Math.abs(cash).toLocaleString()}원)` },
        { status: 400 }
      );
    }

    // 3. 잔액 업데이트
    const { error: updateError } = await adminClient
      .from('organization_cash')
      .update({ balance: newBalance })
      .eq('organization_id', organizationId);

    if (updateError) {
      logger.error('캐시 업데이트 오류:', updateError);
      return NextResponse.json(
        { success: false, error: '캐시 업데이트에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 4. 히스토리 기록
    const { error: historyError } = await adminClient
      .from('organization_cash_history')
      .insert({
        organization_id: organizationId,
        amount: cash,
        balance_before: currentBalance,
        balance_after: newBalance,
        admin_id: auth.user.id,
        description: description || (cash > 0 ? '관리자 지급' : '관리자 회수'),
        is_revoked: false
      });

    if (historyError) {
      logger.error('히스토리 기록 오류:', historyError);
      // 히스토리 실패는 치명적이지 않으므로 계속 진행
    }

    // 🔔 조직의 소유자와 멤버 전체에게 예치금 입금확인 알림 (지급 시에만)
    if (cash > 0) {
      try {
        // 조직의 소유자 조회
        const { data: org } = await adminClient
          .from('organizations')
          .select('created_by')
          .eq('id', organizationId)
          .single();

        // 조직의 멤버 조회
        const { data: members } = await adminClient
          .from('organization_members')
          .select('user_id')
          .eq('organization_id', organizationId)
          .eq('status', 'active');

        // 소유자 + 멤버 리스트 생성 (중복 제거)
        const userIds = new Set<string>();
        if (org?.created_by) {
          userIds.add(org.created_by);
        }
        if (members) {
          members.forEach(member => userIds.add(member.user_id));
        }

        // 모든 사용자에게 알림 전송
        const notificationPromises = Array.from(userIds).map(userId =>
          notifyDepositConfirm({
            userId: userId,
            depositId: organizationId,
            amount: cash,
            newBalance: newBalance
          })
        );

        await Promise.allSettled(notificationPromises);
      } catch (notificationError) {
        logger.error('예치금 입금확인 알림 전송 실패:', notificationError);
        // 알림 실패해도 입금확인은 성공으로 처리
      }
    }

    const actionType = cash > 0 ? '지급' : '회수';
    return NextResponse.json({
      success: true,
      message: `${Math.abs(cash).toLocaleString()}원이 ${actionType}되었습니다. (잔액: ${newBalance.toLocaleString()}원)`,
      data: {
        balance_before: currentBalance,
        balance_after: newBalance,
        amount: cash
      }
    });

  } catch (error: any) {
    logger.error('POST /api/admin/organizations/[id]/cash 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
