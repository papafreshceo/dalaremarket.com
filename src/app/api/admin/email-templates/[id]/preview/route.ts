import { createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-security';
import { replaceVariables } from '@/lib/email/send-email';
import logger from '@/lib/logger';

/**
 * POST /api/admin/email-templates/[id]/preview
 * 이메일 템플릿 미리보기 (변수 치환)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.error;

    const { variables } = await request.json();

    const adminClient = createAdminClient();

    // 템플릿 조회
    const { data: template, error } = await adminClient
      .from('email_templates')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !template) {
      return NextResponse.json(
        { success: false, error: '템플릿을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 변수 치환
    const previewHtml = replaceVariables(
      template.html_content,
      variables || {}
    );

    const previewSubject = replaceVariables(
      template.subject,
      variables || {}
    );

    return NextResponse.json({
      success: true,
      data: {
        subject: previewSubject,
        html: previewHtml,
        original_subject: template.subject,
        original_html: template.html_content,
        variables_used: template.variables
      }
    });

  } catch (error: any) {
    logger.error('POST /api/admin/email-templates/[id]/preview 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
