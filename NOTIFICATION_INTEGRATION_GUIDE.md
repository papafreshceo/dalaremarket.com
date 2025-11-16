# 푸시 알림 연동 가이드

OneSignal 푸시 알림 시스템이 모두 준비되었습니다. 이제 각 API에 알림 함수만 추가하면 됩니다.

## 📋 연동 순서

### ✅ 1. 신규 발주서 등록 → 관리자에게 알림

**파일:** `src/app/api/platform-orders/route.ts`

**1-1. import 추가 (파일 상단 7줄 다음에 추가)**
```typescript
import { notifyAdminNewOrder } from '@/lib/onesignal-notifications';
```

**1-2. 다건 처리 알림 (318줄 다음에 추가)**
```typescript
      // DB에 일괄 저장
      const { data, error } = await supabase
        .from('integrated_orders')
        .insert(ordersWithInfo)
        .select();

      if (error) {
        logger.error('[platform-orders] 주문 저장 실패:', error);
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      // 🔔 관리자에게 신규 발주서 알림 전송
      try {
        for (const order of data) {
          await notifyAdminNewOrder({
            orderId: order.id,
            orderNumber: order.order_number || `주문-${order.id.substring(0, 8)}`,
            sellerName: order.seller_name || '셀러',
            totalAmount: order.total_amount || 0
          });
        }
      } catch (notificationError) {
        logger.error('신규 발주서 알림 전송 실패:', notificationError);
        // 알림 실패해도 주문은 성공으로 처리
      }

      // 첫 주문 업로드 시 show_sample_data를 false로 변경
      await supabase
        .from('users')
        .update({ show_sample_data: false })
        .eq('id', user.id);
```

**1-3. 단건 처리 알림 (370줄 다음에 추가)**
```typescript
      // DB에 저장
      const { data, error } = await supabase
        .from('integrated_orders')
        .insert(orderWithInfo)
        .select()
        .single();

      if (error) {
        logger.error('[platform-orders] 주문 저장 실패:', error);
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      // 🔔 관리자에게 신규 발주서 알림 전송
      try {
        await notifyAdminNewOrder({
          orderId: data.id,
          orderNumber: data.order_number || `주문-${data.id.substring(0, 8)}`,
          sellerName: data.seller_name || '셀러',
          totalAmount: data.total_amount || 0
        });
      } catch (notificationError) {
        logger.error('신규 발주서 알림 전송 실패:', notificationError);
        // 알림 실패해도 주문은 성공으로 처리
      }

      // 첫 주문 업로드 시 show_sample_data를 false로 변경
      await supabase
        .from('users')
        .update({ show_sample_data: false })
        .eq('id', user.id);
```

---

### ✅ 2. 발주서 상태 변경 → 셀러에게 알림

**파일:** `src/app/api/integrated-orders/route.ts`

**2-1. import 추가 (파일 상단 8줄 다음에 추가)**
```typescript
import { notifyOrderStatusChange } from '@/lib/onesignal-notifications';
```

**2-2. PUT 메서드에 알림 추가 (341줄 다음에 추가)**
```typescript
    // 발송완료 상태로 변경된 경우 랭킹 집계
    if (existingOrder && existingOrder.status !== 'shipped' && updateData.status === 'shipped') {
      const { trackOrderShipped } = await import('@/lib/seller-performance');
      await trackOrderShipped(data.created_by, data.amount || 0);
    }

    // 🔔 상태 변경 시 셀러에게 알림 전송
    if (existingOrder && updateData.shipping_status && existingOrder.shipping_status !== updateData.shipping_status) {
      try {
        // organization_id로 조직의 대표 user_id 조회
        if (data.organization_id) {
          const { data: org } = await supabase
            .from('organizations')
            .select('created_by')
            .eq('id', data.organization_id)
            .single();

          if (org?.created_by) {
            // 상태 변경 알림
            const statusMap: Record<string, string> = {
              '접수': '접수',
              '입금확인': '입금확인',
              '상품준비중': '상품준비중',
              '발송완료': '발송완료',
            };

            await notifyOrderStatusChange({
              userId: org.created_by,
              orderId: data.id,
              orderNumber: data.order_number || `주문-${data.id.substring(0, 8)}`,
              oldStatus: statusMap[existingOrder.shipping_status] || existingOrder.shipping_status,
              newStatus: statusMap[updateData.shipping_status] || updateData.shipping_status,
              trackingNumber: updateData.tracking_number
            });
          }
        }
      } catch (notificationError) {
        logger.error('발주서 상태 변경 알림 전송 실패:', notificationError);
        // 알림 실패해도 주문 수정은 성공으로 처리
      }
    }

    return NextResponse.json({ success: true, data });
```

---

### ✅ 3. 공지사항 등록 → 전체 셀러에게 알림

**파일:** `src/app/api/announcements/route.ts` 또는 `src/app/api/platform-notices/route.ts`

**3-1. import 추가 (파일 상단)**
```typescript
import { notifyAnnouncement } from '@/lib/onesignal-notifications';
```

**3-2. POST 메서드 내 DB 저장 후 알림 추가**
```typescript
// 공지사항 DB 저장
const { data: announcement, error } = await supabase
  .from('announcements')
  .insert({ title, content, category })
  .select()
  .single();

if (error) {
  return NextResponse.json({ success: false, error: error.message }, { status: 500 });
}

// 🔔 전체 셀러에게 공지사항 알림 전송
try {
  // category 매핑
  const categoryMap: Record<string, any> = {
    'shipping_holiday': 'shipping_holiday',
    'harvest_news': 'harvest_news',
    'price_change': 'price_change',
    'out_of_stock': 'out_of_stock',
  };

  await notifyAnnouncement({
    announcementId: announcement.id,
    category: categoryMap[category] || 'general',
    title: title,
    body: content,
    sentByUserId: user.id
  });
} catch (notificationError) {
  logger.error('공지사항 알림 전송 실패:', notificationError);
  // 알림 실패해도 공지사항 등록은 성공으로 처리
}

return NextResponse.json({ success: true, data: announcement });
```

---

### ✅ 4. 댓글 작성 → 게시글 작성자에게 알림

**파일:** `src/app/api/seller-feed/posts/[id]/comments/route.ts`

**4-1. import 추가**
```typescript
import { notifyCommentReply } from '@/lib/onesignal-notifications';
```

**4-2. POST 메서드 내 댓글 저장 후 알림 추가**
```typescript
// 댓글 저장
const { data: comment, error } = await supabase
  .from('comments')
  .insert({ post_id: postId, content, user_id: user.id })
  .select()
  .single();

if (error) {
  return NextResponse.json({ success: false, error: error.message }, { status: 500 });
}

// 🔔 게시글 작성자에게 댓글 알림
try {
  // 게시글 정보 조회
  const { data: post } = await supabase
    .from('posts')
    .select('user_id, title')
    .eq('id', postId)
    .single();

  // 본인 댓글은 알림 안 보냄
  if (post && post.user_id !== user.id) {
    // 댓글 작성자 이름 조회
    const { data: commenter } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', user.id)
      .single();

    await notifyCommentReply({
      userId: post.user_id,
      postId: postId,
      postTitle: post.title,
      commenterName: commenter?.name || commenter?.email || '익명',
      commentPreview: content.substring(0, 50)
    });
  }
} catch (notificationError) {
  logger.error('댓글 알림 전송 실패:', notificationError);
  // 알림 실패해도 댓글 작성은 성공으로 처리
}

return NextResponse.json({ success: true, data: comment });
```

---

### ✅ 5. 예치금 입금확인 → 셀러에게 알림

**파일:** `src/app/api/admin/organizations/[id]/cash/route.ts` 또는 예치금 입금확인 처리 API

**5-1. import 추가**
```typescript
import { notifyDepositConfirm } from '@/lib/onesignal-notifications';
```

**5-2. 입금 확인 처리 후 알림 추가**
```typescript
// 예치금 업데이트
const { data: deposit, error } = await supabase
  .from('cash_transactions')
  .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
  .eq('id', depositId)
  .select()
  .single();

if (error) {
  return NextResponse.json({ success: false, error: error.message }, { status: 500 });
}

// 🔔 셀러에게 예치금 입금확인 알림
try {
  // 현재 잔액 조회
  const { data: balance } = await supabase
    .from('user_balances')
    .select('cash')
    .eq('user_id', deposit.user_id)
    .single();

  await notifyDepositConfirm({
    userId: deposit.user_id,
    depositId: deposit.id,
    amount: deposit.amount,
    newBalance: balance?.cash || 0
  });
} catch (notificationError) {
  logger.error('예치금 입금확인 알림 전송 실패:', notificationError);
  // 알림 실패해도 입금확인은 성공으로 처리
}

return NextResponse.json({ success: true, data: deposit });
```

---

### ✅ 6. 질문/건의 게시글 → 관리자에게 알림

**파일:** `src/app/api/seller-feed/posts/route.ts` (질문/건의 게시판)

**6-1. import 추가**
```typescript
import { notifyAdminSupportPost } from '@/lib/onesignal-notifications';
```

**6-2. POST 메서드 내 게시글 저장 후 알림 추가**
```typescript
// 게시글 저장
const { data: post, error } = await supabase
  .from('posts')
  .insert({ title, content, type, user_id: user.id })
  .select()
  .single();

if (error) {
  return NextResponse.json({ success: false, error: error.message }, { status: 500 });
}

// 🔔 질문/건의 게시글이면 관리자에게 알림
if (type === 'question' || type === 'suggestion') {
  try {
    // 작성자 이름 조회
    const { data: author } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', user.id)
      .single();

    await notifyAdminSupportPost({
      postId: post.id,
      postType: type,
      title: title,
      authorName: author?.name || author?.email || '익명'
    });
  } catch (notificationError) {
    logger.error('질문/건의 게시글 알림 전송 실패:', notificationError);
    // 알림 실패해도 게시글 작성은 성공으로 처리
  }
}

return NextResponse.json({ success: true, data: post });
```

---

### ✅ 7. 신규 회원 가입 → 관리자에게 알림

**파일:** `src/app/api/auth/signup/route.ts` 또는 회원가입 처리 API

**7-1. import 추가**
```typescript
import { notifyAdminNewMember } from '@/lib/onesignal-notifications';
```

**7-2. 회원가입 완료 후 알림 추가**
```typescript
// 회원가입 처리
const { data: newUser, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      name,
      organization_name: organizationName
    }
  }
});

if (error) {
  return NextResponse.json({ success: false, error: error.message }, { status: 500 });
}

// 🔔 관리자에게 신규 회원 가입 알림
try {
  if (newUser.user) {
    await notifyAdminNewMember({
      userId: newUser.user.id,
      userName: name,
      userEmail: email,
      organizationName: organizationName
    });
  }
} catch (notificationError) {
  logger.error('신규 회원 가입 알림 전송 실패:', notificationError);
  // 알림 실패해도 회원가입은 성공으로 처리
}

return NextResponse.json({ success: true, data: newUser });
```

---

## 🎯 핵심 포인트

1. **try-catch로 감싸기**: 알림 전송 실패해도 주요 기능(주문/가입 등)은 성공으로 처리
2. **logger 사용**: 알림 실패 시 로그 남기기
3. **user_id 확인**: 알림 받을 사용자 ID가 있는지 확인
4. **테스트**: 각 기능 실행 후 실제로 알림이 오는지 확인

## 📱 알림 테스트 방법

1. 브라우저에서 Subscription Bell 클릭하여 알림 구독
2. 각 기능 실행 (주문 등록, 공지사항 등록 등)
3. 푸시 알림이 PC/모바일에 도착하는지 확인

## 🔧 문제 해결

알림이 안 오면:
1. OneSignal 대시보드에서 Sent Notifications 확인
2. 브라우저 콘솔에서 에러 확인
3. 서버 로그에서 `logger.error` 메시지 확인

완료!
