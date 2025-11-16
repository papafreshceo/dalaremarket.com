# OneSignal 푸시 알림 시스템 설정 가이드

## 📋 완료된 작업

✅ 데이터베이스 스키마 생성 (`database/migrations/create_notifications_system.sql`)
✅ OneSignal 알림 유틸리티 (`src/lib/onesignal-notifications.ts`)
✅ Player ID 관리 API (`src/app/api/notifications/player-id/route.ts`)
✅ OneSignal Provider 컴포넌트 (`src/components/OneSignalProvider.tsx`)
✅ RootLayout에 OneSignalProvider 추가됨

## 🚀 설정 단계

### 1단계: 환경 변수 설정

`.env.local` 파일에 다음을 추가하세요:

```bash
# OneSignal Configuration
NEXT_PUBLIC_ONESIGNAL_APP_ID=your_onesignal_app_id_here
ONESIGNAL_REST_API_KEY=your_onesignal_rest_api_key_here
```

### 2단계: 데이터베이스 마이그레이션 실행

Supabase 대시보드 SQL 에디터에서 다음 파일을 실행하세요:
- `database/migrations/create_notifications_system.sql`

이 마이그레이션은 다음 테이블을 생성합니다:
- `notifications` - 알림 기록
- `notification_settings` - 셀러 알림 설정
- `admin_notification_settings` - 관리자 알림 설정
- `onesignal_player_ids` - 사용자-디바이스 매핑

### 3단계: OneSignal 대시보드 설정

1. https://app.onesignal.com 로그인
2. **Settings** > **All Browsers** 클릭
3. **Site URL** 추가:
   - 개발: `http://localhost:3000`
   - 프로덕션: `https://your-domain.com`
4. **Auto Resubscribe** 옵션 활성화
5. **저장**

## 📱 API에 알림 연결하는 방법

### 예시 1: 발주서 상태 변경 알림

```typescript
// src/app/api/orders/[id]/status/route.ts
import { notifyOrderStatusChange } from '@/lib/onesignal-notifications';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  // ... 기존 코드 ...

  // 발주서 상태 업데이트
  const { data: order, error } = await supabase
    .from('integrated_orders')
    .update({ status: newStatus, tracking_number: trackingNumber })
    .eq('id', params.id)
    .select('*, user:users(id, name, email)')
    .single();

  if (!error && order) {
    // 🔔 푸시 알림 전송
    await notifyOrderStatusChange({
      userId: order.user.id,
      orderId: order.id,
      orderNumber: order.order_number,
      oldStatus: order.status,
      newStatus: newStatus,
      trackingNumber: trackingNumber,
    });
  }

  return NextResponse.json({ success: true, data: order });
}
```

### 예시 2: 공지사항 알림 (전체 발송)

```typescript
// src/app/api/announcements/route.ts
import { notifyAnnouncement } from '@/lib/onesignal-notifications';

export async function POST(request: NextRequest) {
  // ... 기존 코드 ...

  const { data: announcement, error } = await supabase
    .from('announcements')
    .insert({ title, content, category })
    .select()
    .single();

  if (!error && announcement) {
    // 🔔 전체 셀러에게 푸시 알림 전송
    await notifyAnnouncement({
      announcementId: announcement.id,
      category: category, // 'shipping_holiday' | 'harvest_news' | 'price_change' | 'out_of_stock' | 'general'
      title: title,
      body: content.substring(0, 100), // 첫 100자
      sentByUserId: user.id,
    });
  }

  return NextResponse.json({ success: true, data: announcement });
}
```

### 예시 3: 댓글 알림

```typescript
// src/app/api/posts/[id]/comments/route.ts
import { notifyCommentReply } from '@/lib/onesignal-notifications';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  // ... 기존 코드 ...

  // 댓글 작성
  const { data: comment, error } = await supabase
    .from('comments')
    .insert({ post_id: params.id, user_id: user.id, content })
    .select()
    .single();

  if (!error && comment) {
    // 원글 작성자 조회
    const { data: post } = await supabase
      .from('posts')
      .select('user_id, title, user:users(name)')
      .eq('id', params.id)
      .single();

    if (post && post.user_id !== user.id) {
      // 🔔 원글 작성자에게 알림
      await notifyCommentReply({
        userId: post.user_id,
        postId: params.id,
        postTitle: post.title,
        commenterName: user.user_metadata?.name || user.email,
        commentPreview: content.substring(0, 50),
      });
    }
  }

  return NextResponse.json({ success: true, data: comment });
}
```

### 예시 4: 예치금 입금 확인 알림

```typescript
// src/app/api/admin/deposits/confirm/route.ts
import { notifyDepositConfirm } from '@/lib/onesignal-notifications';

export async function POST(request: NextRequest) {
  // ... 기존 코드 ...

  // 입금 확인 처리
  const { data: deposit, error } = await supabase
    .from('deposits')
    .update({ status: 'confirmed' })
    .eq('id', depositId)
    .select('*, user:users(id), organization:organizations(cash_balance)')
    .single();

  if (!error && deposit) {
    // 🔔 셀러에게 입금 확인 알림
    await notifyDepositConfirm({
      userId: deposit.user.id,
      depositId: deposit.id,
      amount: deposit.amount,
      newBalance: deposit.organization.cash_balance,
    });
  }

  return NextResponse.json({ success: true, data: deposit });
}
```

### 예시 5: 관리자 알림 - 신규 발주서

```typescript
// src/app/api/orders/route.ts
import { notifyAdminNewOrder } from '@/lib/onesignal-notifications';

export async function POST(request: NextRequest) {
  // ... 기존 코드 ...

  // 발주서 생성
  const { data: order, error } = await supabase
    .from('integrated_orders')
    .insert(orderData)
    .select('*, user:users(name)')
    .single();

  if (!error && order) {
    // 🔔 관리자에게 알림
    await notifyAdminNewOrder({
      orderId: order.id,
      orderNumber: order.order_number,
      sellerName: order.user.name,
      totalAmount: order.total_amount,
    });
  }

  return NextResponse.json({ success: true, data: order });
}
```

### 예시 6: 관리자 알림 - 신규 회원 가입

```typescript
// src/app/api/auth/signup/route.ts
import { notifyAdminNewMember } from '@/lib/onesignal-notifications';

export async function POST(request: NextRequest) {
  // ... 기존 코드 ...

  // 회원가입 후
  if (newUser) {
    // 🔔 관리자에게 신규 회원 알림
    await notifyAdminNewMember({
      userId: newUser.id,
      userName: newUser.user_metadata?.name || '신규 회원',
      userEmail: newUser.email,
      organizationName: organization?.name,
    });
  }

  return NextResponse.json({ success: true, data: newUser });
}
```

### 예시 7: 관리자 알림 - 질문/건의 게시글

```typescript
// src/app/api/support/route.ts
import { notifyAdminSupportPost } from '@/lib/onesignal-notifications';

export async function POST(request: NextRequest) {
  // ... 기존 코드 ...

  // 질문/건의 게시글 작성
  const { data: post, error } = await supabase
    .from('support_posts')
    .insert({ title, content, type, user_id: user.id })
    .select('*, user:users(name)')
    .single();

  if (!error && post) {
    // 🔔 관리자에게 알림
    await notifyAdminSupportPost({
      postId: post.id,
      postType: type, // 'question' | 'suggestion'
      title: title,
      authorName: post.user.name,
    });
  }

  return NextResponse.json({ success: true, data: post });
}
```

## 📊 알림 타입 정리

### 셀러 알림 (category: 'seller')
- `order_status` - 발주서 상태 변경
- `announcement` - 공지사항 (발송휴무일, 출하소식, 가격, 품절)
- `comment_reply` - 댓글 답글
- `deposit_confirm` - 예치금 입금 확인

### 관리자 알림 (category: 'admin')
- `admin_new_order` - 신규 발주서
- `admin_support_post` - 질문/건의 게시글
- `admin_new_member` - 신규 회원 가입

## 🎨 사용자 알림 설정 UI

셀러는 다음 페이지에서 알림 설정을 변경할 수 있습니다:
- `/settings/notifications`

관리자는 다음 페이지에서 알림 설정을 변경할 수 있습니다:
- `/admin/settings/notifications`

각 사용자는 다음을 설정할 수 있습니다:
- ✅ 전체 푸시 알림 on/off
- ✅ 카테고리별 알림 on/off
- ✅ 방해 금지 시간 설정 (예: 밤 10시 ~ 아침 8시)

## 🧪 테스트 방법

### 1. 로컬 테스트
```bash
npm run dev
```

### 2. 브라우저에서 알림 권한 허용
- 사이트 접속 시 알림 권한 요청 팝업이 뜹니다
- "허용" 클릭

### 3. Player ID 확인
개발자 도구 콘솔에서 다음 메시지를 확인:
```
OneSignal 초기화 완료 { userId: '...', playerId: '...' }
```

### 4. 테스트 알림 발송
OneSignal 대시보드에서:
1. **Messages** > **New Push** 클릭
2. 테스트 메시지 작성
3. **Send to Test Users** 선택
4. Player ID 입력
5. **Send Message**

## 🔧 문제 해결

### 알림이 오지 않을 때
1. `.env.local`에 OneSignal 키가 올바르게 설정되었는지 확인
2. 브라우저에서 알림 권한이 허용되었는지 확인
3. OneSignal Player ID가 DB에 저장되었는지 확인:
   ```sql
   SELECT * FROM onesignal_player_ids WHERE user_id = 'your-user-id';
   ```
4. 알림 설정이 활성화되어 있는지 확인:
   ```sql
   SELECT * FROM notification_settings WHERE user_id = 'your-user-id';
   ```

### HTTPS 필요
OneSignal은 HTTPS에서만 작동합니다.
- 로컬 개발: `localhost`는 예외
- 프로덕션: HTTPS 필수

## ✨ 다음 단계

1. **환경 변수 설정** (.env.local에 OneSignal 키 추가)
2. **마이그레이션 실행** (Supabase에서 SQL 실행)
3. **API 연결** (위 예시 코드 참고하여 각 API에 알림 함수 추가)
4. **테스트** (실제 알림 발송 확인)
5. **UI 구현** (알림 설정 페이지 생성 - 필요 시)

모든 준비가 완료되었습니다! 🎉
