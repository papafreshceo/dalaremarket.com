import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { resend } from '@/lib/email/resend'

export async function POST(request: NextRequest) {
  try {
    // Service role client to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 요청 데이터
    const { userId, email, name } = await request.json()

    if (!userId || !email) {
      return NextResponse.json(
        { success: false, error: '필수 파라미터 누락' },
        { status: 400 }
      )
    }

    // 최고 관리자 조회
    const { data: superAdmins, error: adminError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('role', 'super_admin')

    if (adminError) {
      console.error('[Admin Notification] Error fetching super admins:', adminError)
      return NextResponse.json(
        { success: false, error: '관리자 조회 실패' },
        { status: 500 }
      )
    }

    if (!superAdmins || superAdmins.length === 0) {
      console.log('[Admin Notification] No super admins found')
      return NextResponse.json({
        success: true,
        message: '최고 관리자가 없어 알림을 발송하지 않았습니다',
      })
    }

    // 각 최고 관리자에게 이메일 발송
    const emailPromises = superAdmins.map(async (admin) => {
      try {
        const { data, error } = await resend.emails.send({
          from: '달래마켓 <noreply@dalraemarket.com>',
          to: [admin.email],
          subject: `🎉 신규 회원 가입 알림 - ${name}`,
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
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: white;
                    padding: 40px 20px;
                    text-align: center;
                    border-radius: 10px 10px 0 0;
                  }
                  .content {
                    background: #f8f9fa;
                    padding: 30px 20px;
                  }
                  .info-box {
                    background: white;
                    border-left: 4px solid #10b981;
                    padding: 15px;
                    margin: 20px 0;
                    border-radius: 4px;
                  }
                  .button {
                    display: inline-block;
                    padding: 12px 30px;
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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
                  <h1>🎉 신규 회원 가입</h1>
                </div>
                <div class="content">
                  <h2>안녕하세요, ${admin.name || '관리자'}님!</h2>
                  <p>새로운 회원이 달래마켓에 가입했습니다.</p>

                  <div class="info-box">
                    <h3>신규 회원 정보</h3>
                    <p><strong>이름:</strong> ${name}</p>
                    <p><strong>이메일:</strong> ${email}</p>
                    <p><strong>가입 시간:</strong> ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}</p>
                  </div>

                  <p style="text-align: center;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/customers" class="button">
                      회원 관리 페이지로 이동
                    </a>
                  </p>

                  <p>회원 관리 페이지에서 더 자세한 정보를 확인하실 수 있습니다.</p>
                </div>
                <div class="footer">
                  <p>이 이메일은 신규 회원 가입 시 자동으로 발송되었습니다.</p>
                  <p>© 2025 달래마켓. All rights reserved.</p>
                </div>
              </body>
            </html>
          `,
        })

        if (error) {
          console.error(`[Admin Notification] Send error to ${admin.email}:`, error)
          return { success: false, admin: admin.email, error }
        }

        // 이메일 로그 저장
        await supabase.from('email_logs').insert({
          user_id: admin.id,
          email_to: admin.email,
          subject: `🎉 신규 회원 가입 알림 - ${name}`,
          template_type: 'admin_new_user',
          status: 'sent',
          sent_at: new Date().toISOString(),
          resend_id: data?.id,
        })

        return { success: true, admin: admin.email, emailId: data?.id }
      } catch (error) {
        console.error(`[Admin Notification] Error sending to ${admin.email}:`, error)
        return { success: false, admin: admin.email, error }
      }
    })

    const results = await Promise.all(emailPromises)
    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length

    return NextResponse.json({
      success: true,
      message: `${successCount}명의 관리자에게 알림 발송 완료 (실패: ${failCount})`,
      results,
    })

  } catch (error) {
    console.error('[Admin Notification] Error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
