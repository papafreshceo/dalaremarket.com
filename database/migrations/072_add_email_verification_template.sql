-- Migration 072: Add email verification template
-- 이메일 인증 템플릿 추가

INSERT INTO email_templates (name, type, subject, html_content, variables, description, is_active)
VALUES (
  '이메일 인증',
  'transactional',
  '[달래마켓] 이메일 인증 코드',
  '<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', ''Roboto'', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
    <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">이메일 인증</h1>
      </div>

      <div style="padding: 40px 30px;">
        <h2 style="color: #212529; margin-top: 0;">안녕하세요! 👋</h2>
        <p>달래마켓 회원가입을 위한 이메일 인증 코드입니다.</p>

        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px; margin: 30px 0;">
          <div style="font-size: 14px; margin-bottom: 10px;">인증 코드</div>
          <div style="font-size: 48px; font-weight: bold; letter-spacing: 8px; font-family: ''Courier New'', monospace;">{code}</div>
        </div>

        <p style="text-align: center; color: #666; font-size: 14px;">
          위 코드를 회원가입 페이지에 입력해주세요.
        </p>

        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; font-size: 14px; color: #856404;">
          ⏰ <strong>5분 내에 입력해주세요.</strong><br>
          시간이 지나면 새로운 인증 코드를 요청하셔야 합니다.
        </div>

        <p style="font-size: 13px; color: #666;">
          본인이 요청하지 않았다면 이 이메일을 무시하셔도 됩니다.
        </p>
      </div>

      <div style="text-align: center; padding: 20px; color: #666; font-size: 12px; background: #f8f9fa;">
        <p style="margin: 5px 0;">이 이메일은 달래마켓 회원가입 시 자동으로 발송되었습니다.</p>
        <p style="margin: 5px 0;">© 2025 달래마켓. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>',
  '{"code": "6자리 인증 코드"}',
  '회원가입 시 이메일 인증을 위한 6자리 코드 발송',
  true
)
ON CONFLICT DO NOTHING;

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ 이메일 인증 템플릿 추가 완료';
END $$;
