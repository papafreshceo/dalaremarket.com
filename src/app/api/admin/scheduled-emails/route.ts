import { createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-security';
import logger from '@/lib/logger';

/**
 * GET /api/admin/scheduled-emails
 * 예약 이메일 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.error;

    const adminClient = createAdminClient();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    let query = adminClient
      .from('scheduled_emails')
      .select('*, template:email_templates(name, type)', { count: 'exact' })
      .order('scheduled_at', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      logger.error('예약 이메일 조회 오류:', error);
      return NextResponse.json(
        { success: false, error: '예약 이메일 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error: any) {
    logger.error('GET /api/admin/scheduled-emails 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/scheduled-emails
 * 새 예약 이메일 생성
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.error;

    const { template_id, recipient_emails, variables, scheduled_at } = await request.json();

    if (!template_id || !recipient_emails || recipient_emails.length === 0 || !scheduled_at) {
      return NextResponse.json(
        { success: false, error: '필수 필드를 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    // 예약 시간이 현재보다 미래인지 확인
    const scheduledDate = new Date(scheduled_at);
    if (scheduledDate <= new Date()) {
      return NextResponse.json(
        { success: false, error: '예약 시간은 현재 시간보다 미래여야 합니다.' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    const { data, error } = await adminClient
      .from('scheduled_emails')
      .insert({
        template_id,
        recipient_emails,
        variables: variables || {},
        scheduled_at,
        created_by: auth.user.id
      })
      .select()
      .single();

    if (error) {
      logger.error('예약 이메일 생성 오류:', error);
      return NextResponse.json(
        { success: false, error: '예약 이메일 생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    logger.info(`예약 이메일 생성됨: ${recipient_emails.length}명, ${scheduled_at} by ${auth.user.email}`);

    return NextResponse.json({
      success: true,
      message: '이메일 발송이 예약되었습니다.',
      data
    });

  } catch (error: any) {
    logger.error('POST /api/admin/scheduled-emails 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
