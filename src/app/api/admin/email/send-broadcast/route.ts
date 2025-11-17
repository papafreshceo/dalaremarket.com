import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-security'
import { Resend } from 'resend'
import logger from '@/lib/logger'

const resend = new Resend(process.env.RESEND_API_KEY)

// 템플릿 변수 치환 함수
function replaceTemplateVariables(template: string, variables: Record<string, string>): string {
  let result = template
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{${key}}`, 'g'), value)
  }
  return result
}

/**
 * POST /api/admin/email/send-broadcast
 * 템플릿을 선택해서 이메일 발송
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.authorized) return auth.error

    const body = await request.json()
    const {
      templateId,
      recipients, // 'all' | 'role' | 'custom'
      recipientRole, // 'seller' | 'buyer' 등
      customEmails, // 개별 이메일 배열
      variables // 템플릿 변수 값
    } = body

    if (!templateId) {
      return NextResponse.json(
        { success: false, error: '템플릿을 선택해주세요' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // 템플릿 가져오기
    const { data: template, error: templateError } = await adminClient
      .from('email_templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (templateError || !template) {
      logger.error('템플릿 조회 오류:', templateError)
      return NextResponse.json(
        { success: false, error: '템플릿을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 수신자 목록 가져오기
    let recipientList: { email: string; name: string }[] = []

    if (recipients === 'all') {
      // 전체 회원
      const { data: users } = await adminClient
        .from('users')
        .select('email, name')
        .not('email', 'is', null)

      recipientList = users || []
    } else if (recipients === 'role' && recipientRole) {
      // 특정 역할
      const { data: users } = await adminClient
        .from('users')
        .select('email, name')
        .eq('role', recipientRole)
        .not('email', 'is', null)

      recipientList = users || []
    } else if (recipients === 'custom' && customEmails) {
      // 개별 이메일
      recipientList = customEmails.map((email: string) => ({
        email,
        name: email.split('@')[0]
      }))
    }

    if (recipientList.length === 0) {
      return NextResponse.json(
        { success: false, error: '수신자가 없습니다' },
        { status: 400 }
      )
    }

    // 템플릿 변수 치환
    const subject = replaceTemplateVariables(template.subject, variables || {})
    const htmlContent = replaceTemplateVariables(template.html_content, variables || {})

    // 이메일 발송
    let successCount = 0
    let failCount = 0
    const errors: string[] = []

    for (const recipient of recipientList) {
      try {
        // 개인화된 변수 추가
        const personalizedVariables = {
          ...variables,
          name: recipient.name,
          email: recipient.email
        }
        const personalizedHtml = replaceTemplateVariables(template.html_content, personalizedVariables)
        const personalizedSubject = replaceTemplateVariables(template.subject, personalizedVariables)

        const { data: emailData, error: emailError } = await resend.emails.send({
          from: '달래마켓 <notify@dalraemarket.com>',
          to: [recipient.email],
          subject: personalizedSubject,
          html: personalizedHtml,
        })

        // 로그 저장
        await adminClient.from('email_logs').insert({
          email_type: template.type,
          recipient_email: recipient.email,
          recipient_name: recipient.name,
          subject: personalizedSubject,
          html_content: personalizedHtml,
          status: emailError ? 'failed' : 'sent',
          resend_id: emailData?.id,
          error_message: emailError?.message,
          metadata: {
            template_id: templateId,
            template_name: template.name,
            sent_by: auth.user.id
          }
        })

        if (emailError) {
          failCount++
          errors.push(`${recipient.email}: ${emailError.message}`)
        } else {
          successCount++
        }
      } catch (err: any) {
        failCount++
        errors.push(`${recipient.email}: ${err.message}`)
        logger.error(`이메일 발송 실패 (${recipient.email}):`, err)
      }
    }

    logger.info(`이메일 발송 완료: ${successCount}/${recipientList.length} by ${auth.user.email}`)

    return NextResponse.json({
      success: true,
      message: `${successCount}/${recipientList.length}건 발송 완료`,
      data: {
        total: recipientList.length,
        success: successCount,
        failed: failCount,
        errors: errors.length > 0 ? errors.slice(0, 10) : [] // 최대 10개만
      }
    })

  } catch (error: any) {
    logger.error('POST /api/admin/email/send-broadcast 오류:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
