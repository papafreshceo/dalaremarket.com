import { createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-security';
import logger from '@/lib/logger';

/**
 * GET /api/admin/email-templates
 * 이메일 템플릿 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.error;

    const adminClient = createAdminClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const isActive = searchParams.get('is_active');

    let query = adminClient
      .from('email_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    const { data, error } = await query;

    if (error) {
      logger.error('템플릿 목록 조회 오류:', error);
      return NextResponse.json(
        { success: false, error: '템플릿 목록 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error: any) {
    logger.error('GET /api/admin/email-templates 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/email-templates
 * 새 이메일 템플릿 생성
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.error;

    const body = await request.json();
    const { name, type, subject, html_content, variables, description, is_active } = body;

    if (!name || !type || !subject || !html_content) {
      return NextResponse.json(
        { success: false, error: '필수 필드를 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    const { data, error } = await adminClient
      .from('email_templates')
      .insert({
        name,
        type,
        subject,
        html_content,
        variables: variables || {},
        description,
        is_active: is_active !== undefined ? is_active : true,
        created_by: auth.user.id
      })
      .select()
      .single();

    if (error) {
      logger.error('템플릿 생성 오류:', error);
      return NextResponse.json(
        { success: false, error: '템플릿 생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    logger.info(`템플릿 생성됨: ${name} (${type}) by ${auth.user.email}`);

    return NextResponse.json({
      success: true,
      message: '템플릿이 생성되었습니다.',
      data
    });

  } catch (error: any) {
    logger.error('POST /api/admin/email-templates 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
