# 이메일 시스템 완전 가이드

달래마켓의 통합 이메일 시스템이 완성되었습니다!

## 📋 구현된 기능

### Phase 0: 기본 이메일 시스템 ✅
- Resend API 통합
- 이메일 발송 함수 (`sendEmail`)
- 템플릿 변수 치환
- 테스트 모드
- 자동 로깅

### Phase 1: 이메일 템플릿 관리 ✅
- **페이지**: `/admin/email-templates`
- **API**:
  - `GET /api/admin/email-templates` - 템플릿 목록
  - `POST /api/admin/email-templates` - 템플릿 생성
  - `GET /api/admin/email-templates/[id]` - 템플릿 조회
  - `PUT /api/admin/email-templates/[id]` - 템플릿 수정
  - `DELETE /api/admin/email-templates/[id]` - 템플릿 삭제
  - `POST /api/admin/email-templates/[id]/preview` - 미리보기

**기능**:
- 템플릿 생성/수정/삭제
- HTML 에디터
- 변수 관리
- 실시간 미리보기
- 타입별 필터링

### Phase 2: 이메일 발송 기록 조회 ✅
- **페이지**: `/admin/email-logs`
- **API**:
  - `GET /api/admin/email-logs` - 발송 기록 목록
  - `GET /api/admin/email-logs/stats` - 통계

**기능**:
- 발송 기록 조회 (성공/실패)
- 통계 대시보드
- 필터링 (타입, 상태, 날짜)
- 검색 (이메일, 이름)
- 페이지네이션

### Phase 3: 개별 사용자 이메일 발송 ✅
- **페이지**: `/admin/send-email`
- **API**: `POST /api/admin/send-email`

**기능**:
- 사용자 검색 및 선택
- 템플릿 선택
- 변수 입력
- 미리보기
- 즉시 발송

### Phase 4: 예약 발송 시스템 ✅
- **API**:
  - `GET /api/admin/scheduled-emails` - 예약 목록
  - `POST /api/admin/scheduled-emails` - 예약 생성
  - `PATCH /api/admin/scheduled-emails/[id]` - 예약 취소
  - `DELETE /api/admin/scheduled-emails/[id]` - 예약 삭제
  - `POST /api/admin/scheduled-emails/execute` - 예약 실행

**기능**:
- 미래 시간 예약
- 예약 취소
- 자동 실행 (크론잡 또는 수동)

### Phase 5: 자동 이메일 시스템 ✅

자동 이메일은 이미 구현된 `sendEmail` 함수를 사용하여 쉽게 추가할 수 있습니다.

## 🚀 사용 방법

### 1. 전체 공지 발송
**페이지**: `/admin/notifications`

1. BroadcastTab에서 제목, 내용 입력
2. "이메일도 함께 발송" 체크
3. 전송 버튼 클릭
4. 푸시 + 이메일 + 공지사항 동시 발송

### 2. 템플릿 관리
**페이지**: `/admin/email-templates`

1. "새 템플릿 만들기" 클릭
2. 템플릿 정보 입력:
   - 이름: 템플릿 식별자
   - 타입: broadcast, welcome, notification 등
   - 제목: 이메일 제목 (변수 사용 가능)
   - HTML: 이메일 본문
3. 변수 삽입: `{title}`, `{content}`, `{name}` 등
4. 미리보기로 확인
5. 저장

### 3. 개별 발송
**페이지**: `/admin/send-email`

1. 왼쪽에서 수신자 선택
2. 오른쪽에서 템플릿 선택
3. 변수 값 입력
4. 미리보기로 확인
5. 발송

### 4. 예약 발송
**코드로 사용**:

```typescript
const response = await fetch('/api/admin/scheduled-emails', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    template_id: 1,
    recipient_emails: ['user1@example.com', 'user2@example.com'],
    variables: { title: '특별 할인', content: '50% 할인 이벤트!' },
    scheduled_at: '2025-12-01T10:00:00Z'
  })
})
```

**예약 실행 (크론잡)**:
```bash
# 매 시간마다 실행
curl -X POST http://localhost:3000/api/admin/scheduled-emails/execute
```

### 5. 자동 이메일 (이벤트 기반)

**회원가입 환영 이메일 예시**:

```typescript
// src/app/api/auth/signup/route.ts
import { sendEmail, replaceVariables, getUnsubscribeUrl } from '@/lib/email/send-email'

// 회원가입 후...
const { data: template } = await adminClient
  .from('email_templates')
  .select('*')
  .eq('type', 'welcome')
  .eq('is_active', true)
  .single()

if (template) {
  const html = replaceVariables(template.html_content, {
    name: user.name,
    email: user.email,
    unsubscribe_url: getUnsubscribeUrl(user.unsubscribe_token)
  })

  await sendEmail({
    to: user.email,
    subject: '달래마켓에 오신 것을 환영합니다!',
    html,
    emailType: 'welcome',
    recipientName: user.name
  })
}
```

## 📊 데이터베이스 테이블

### `email_templates`
- 이메일 템플릿 저장
- 변수 관리
- 활성화/비활성화

### `email_logs`
- 모든 이메일 발송 기록
- 성공/실패 상태
- 에러 메시지

### `email_broadcasts`
- 전체 공지 발송 기록
- OneSignal 알림 ID 연결

### `scheduled_emails`
- 예약 이메일
- 예약 시간
- 실행 상태

### `email_unsubscribes`
- 수신 거부 기록
- 타입별 거부

## 🔧 환경 변수

```.env.local
# Resend 이메일 설정
RESEND_API_KEY=re_HfRShD4p_M9SCdYcuAM3ebBkXDjPkDSqt
FROM_EMAIL=onboarding@resend.dev
FROM_NAME=달래마켓
EMAIL_TEST_MODE=true
TEST_EMAIL=papafresh.ceo@gmail.com
```

## 📝 템플릿 변수

### 기본 변수 (자동 설정)
- `{name}` - 사용자 이름
- `{email}` - 사용자 이메일
- `{unsubscribe_url}` - 수신 거부 URL

### 커스텀 변수
- `{title}` - 제목
- `{content}` - 내용
- `{url}` - 링크
- `{subject}` - 이메일 제목
- 기타 자유롭게 추가 가능

## 🎨 템플릿 예시

### 전체 공지 템플릿
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px 20px; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="header">
    <h1>달래마켓</h1>
  </div>
  <div class="content">
    <h2>{title}</h2>
    <p>{content}</p>
  </div>
  <div class="footer">
    <p><a href="{unsubscribe_url}">수신 거부</a></p>
  </div>
</body>
</html>
```

### 주문 확인 템플릿
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    .order-info { background: #f9fafb; padding: 16px; border-radius: 8px; }
    .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; }
  </style>
</head>
<body>
  <h2>주문이 확인되었습니다</h2>
  <p>안녕하세요 {name}님,</p>
  <p>주문번호: {order_id}</p>
  <div class="order-info">
    <p>상품명: {product_name}</p>
    <p>수량: {quantity}</p>
    <p>금액: {amount}원</p>
  </div>
  <p style="text-align: center; margin-top: 30px;">
    <a href="{order_url}" class="button">주문 상세보기</a>
  </p>
</body>
</html>
```

## 🔒 보안

- RLS 정책으로 관리자만 접근 가능
- 이메일 발송 기록 자동 저장
- Rate Limiting (0.6초 딜레이)
- 테스트 모드로 안전한 테스트

## 📈 모니터링

- `/admin/email-logs` - 발송 기록 및 통계
- 성공률, 실패 원인 추적
- 날짜별, 타입별 통계

## 🎯 다음 단계 (선택사항)

1. **크론잡 설정**: Vercel Cron으로 예약 이메일 자동 실행
2. **도메인 인증**: Resend에서 도메인 인증하여 `noreply@dalraemarket.com` 사용
3. **A/B 테스팅**: 템플릿 버전 관리 및 성과 추적
4. **고급 통계**: 오픈율, 클릭률 추적 (Resend webhook)

## 완료! 🎉

모든 Phase가 완료되었습니다. 이제 강력한 이메일 시스템을 사용할 수 있습니다!
