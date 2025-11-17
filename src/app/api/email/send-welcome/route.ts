import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { resend } from '@/lib/email/resend'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 요청 데이터
    const { userId, email, name } = await request.json()

    if (!userId || !email) {
      return NextResponse.json(
        { success: false, error: '필수 파라미터 누락' },
        { status: 400 }
      )
    }

    // 환영 이메일 발송
    const { data, error } = await resend.emails.send({
      from: '달래마켓 <noreply@dalreamarket.com>',
      to: [email],
      subject: `${name || ''}님, 달래마켓에 오신 것을 환영합니다! 🎉`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 40px 20px;
                text-align: center;
                border-radius: 10px 10px 0 0;
              }
              .content {
                background: #f8f9fa;
                padding: 30px 20px;
              }
              .button {
                display: inline-block;
                padding: 12px 30px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
              }
              .footer {
                text-align: center;
                padding: 20px;
                color: #666;
                font-size: 12px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>달래마켓에 오신 것을 환영합니다!</h1>
            </div>
            <div class="content">
              <h2>안녕하세요, ${name || '고객'}님! 👋</h2>
              <p>달래마켓 회원가입을 진심으로 축하드립니다.</p>
              <p>달래마켓은 농산물 B2B 거래를 위한 스마트한 플랫폼입니다.</p>

              <h3>✨ 주요 기능</h3>
              <ul>
                <li>실시간 주문 관리</li>
                <li>통합 발주 시스템</li>
                <li>셀러 랭킹 및 리워드</li>
                <li>AI 챗봇 상담</li>
              </ul>

              <p style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_SITE_URL}/platform" class="button">
                  지금 시작하기
                </a>
              </p>

              <p>궁금한 점이 있으시면 언제든지 문의해주세요.</p>
              <p>감사합니다! 🙏</p>
            </div>
            <div class="footer">
              <p>이 이메일은 달래마켓 회원가입 시 자동으로 발송되었습니다.</p>
              <p>© 2025 달래마켓. All rights reserved.</p>
            </div>
          </body>
        </html>
      `,
    })

    if (error) {
      console.error('[Welcome Email] Send error:', error)
      return NextResponse.json(
        { success: false, error: '이메일 발송 실패' },
        { status: 500 }
      )
    }

    // 이메일 로그 저장
    await supabase.from('email_logs').insert({
      user_id: userId,
      email_to: email,
      subject: `${name || ''}님, 달래마켓에 오신 것을 환영합니다! 🎉`,
      template_type: 'welcome',
      status: 'sent',
      sent_at: new Date().toISOString(),
      resend_id: data?.id,
    })

    return NextResponse.json({
      success: true,
      message: '환영 이메일이 발송되었습니다',
      emailId: data?.id,
    })

  } catch (error) {
    console.error('[Welcome Email] Error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
