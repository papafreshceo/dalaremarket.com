import { createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-security';
import logger from '@/lib/logger';

/**
 * PATCH /api/admin/scheduled-emails/[id]
 * 예약 이메일 취소
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.error;

    const adminClient = createAdminClient();

    // 먼저 예약 정보 조회
    const { data: scheduled } = await adminClient
      .from('scheduled_emails')
      .select('*')
      .eq('id', params.id)
      .single();

    if (!scheduled) {
      return NextResponse.json(
        { success: false, error: '예약을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (scheduled.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: '이미 발송되었거나 취소된 예약입니다.' },
        { status: 400 }
      );
    }

    const { data, error } = await adminClient
      .from('scheduled_emails')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      logger.error('예약 취소 오류:', error);
      return NextResponse.json(
        { success: false, error: '예약 취소에 실패했습니다.' },
        { status: 500 }
      );
    }

    logger.info(`예약 이메일 취소됨: ID ${params.id} by ${auth.user.email}`);

    return NextResponse.json({
      success: true,
      message: '예약이 취소되었습니다.',
      data
    });

  } catch (error: any) {
    logger.error('PATCH /api/admin/scheduled-emails/[id] 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/scheduled-emails/[id]
 * 예약 이메일 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.error;

    const adminClient = createAdminClient();

    // 먼저 예약 정보 조회
    const { data: scheduled } = await adminClient
      .from('scheduled_emails')
      .select('*')
      .eq('id', params.id)
      .single();

    if (!scheduled) {
      return NextResponse.json(
        { success: false, error: '예약을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const { error } = await adminClient
      .from('scheduled_emails')
      .delete()
      .eq('id', params.id);

    if (error) {
      logger.error('예약 삭제 오류:', error);
      return NextResponse.json(
        { success: false, error: '예약 삭제에 실패했습니다.' },
        { status: 500 }
      );
    }

    logger.info(`예약 이메일 삭제됨: ID ${params.id} by ${auth.user.email}`);

    return NextResponse.json({
      success: true,
      message: '예약이 삭제되었습니다.'
    });

  } catch (error: any) {
    logger.error('DELETE /api/admin/scheduled-emails/[id] 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
