import { createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-security';
import logger from '@/lib/logger';

/**
 * GET /api/admin/email-templates/[id]
 * 이메일 템플릿 상세 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.error;

    const adminClient = createAdminClient();

    const { data, error } = await adminClient
      .from('email_templates')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      logger.error('템플릿 조회 오류:', error);
      return NextResponse.json(
        { success: false, error: '템플릿 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: '템플릿을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error: any) {
    logger.error('GET /api/admin/email-templates/[id] 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/email-templates/[id]
 * 이메일 템플릿 수정
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.error;

    const body = await request.json();
    const { name, type, subject, html_content, variables, description, is_active } = body;

    const adminClient = createAdminClient();

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (subject !== undefined) updateData.subject = subject;
    if (html_content !== undefined) updateData.html_content = html_content;
    if (variables !== undefined) updateData.variables = variables;
    if (description !== undefined) updateData.description = description;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await adminClient
      .from('email_templates')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      logger.error('템플릿 수정 오류:', error);
      return NextResponse.json(
        { success: false, error: '템플릿 수정에 실패했습니다.' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: '템플릿을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    logger.info(`템플릿 수정됨: ${data.name} (ID: ${params.id}) by ${auth.user.email}`);

    return NextResponse.json({
      success: true,
      message: '템플릿이 수정되었습니다.',
      data
    });

  } catch (error: any) {
    logger.error('PUT /api/admin/email-templates/[id] 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/email-templates/[id]
 * 이메일 템플릿 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.error;

    const adminClient = createAdminClient();

    // 먼저 템플릿 조회
    const { data: template } = await adminClient
      .from('email_templates')
      .select('name')
      .eq('id', params.id)
      .single();

    if (!template) {
      return NextResponse.json(
        { success: false, error: '템플릿을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const { error } = await adminClient
      .from('email_templates')
      .delete()
      .eq('id', params.id);

    if (error) {
      logger.error('템플릿 삭제 오류:', error);
      return NextResponse.json(
        { success: false, error: '템플릿 삭제에 실패했습니다.' },
        { status: 500 }
      );
    }

    logger.info(`템플릿 삭제됨: ${template.name} (ID: ${params.id}) by ${auth.user.email}`);

    return NextResponse.json({
      success: true,
      message: '템플릿이 삭제되었습니다.'
    });

  } catch (error: any) {
    logger.error('DELETE /api/admin/email-templates/[id] 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
