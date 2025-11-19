/**
 * OneSignal 푸시 알림 유틸리티
 * 농산물 B2B 플랫폼 전용 알림 시스템
 */

import { createClient } from '@supabase/supabase-js';
import logger from './logger';

// Supabase 서비스 클라이언트 (서버 사이드 전용)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// OneSignal REST API 설정
const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY!;
const ONESIGNAL_API_URL = 'https://onesignal.com/api/v1';

// =====================================================
// 타입 정의
// =====================================================

export type NotificationType =
  // 셀러 알림
  | 'order_status'          // 발주서 상태 변경
  | 'announcement'          // 공지사항
  | 'comment_reply'         // 댓글 답글
  | 'deposit_confirm'       // 예치금 입금 확인
  | 'new_message'           // 새 메시지
  // 관리자 알림
  | 'admin_new_order'       // 신규 발주서
  | 'admin_support_post'    // 질문/건의 게시글
  | 'admin_new_member';     // 신규 회원 가입

export type NotificationCategory = 'seller' | 'admin';
export type NotificationPriority = 'low' | 'normal' | 'high';

export interface CreateNotificationParams {
  // 수신자
  userId?: string;                    // 특정 사용자
  userIds?: string[];                 // 여러 사용자
  sendToAll?: boolean;                // 전체 발송 (셀러 전체)
  sendToAdmins?: boolean;             // 관리자에게만

  // 알림 내용
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  body: string;

  // 관련 리소스
  resourceType?: string;
  resourceId?: string;

  // 액션
  actionUrl?: string;

  // 추가 데이터
  data?: Record<string, any>;

  // 발송자
  sentByUserId?: string;

  // 우선순위
  priority?: NotificationPriority;
}

// =====================================================
// OneSignal 푸시 전송 핵심 함수
// =====================================================

/**
 * OneSignal을 통해 특정 사용자들에게 푸시 알림 전송
 */
async function sendOneSignalPush(params: {
  playerIds: string[];
  title: string;
  body: string;
  actionUrl?: string;
  data?: Record<string, any>;
  priority?: NotificationPriority;
}): Promise<{ success: boolean; notificationId?: string; error?: string }> {
  const { playerIds, title, body, actionUrl, data, priority = 'normal' } = params;

  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    logger.error('OneSignal 환경 변수가 설정되지 않았습니다.');
    return { success: false, error: 'OneSignal not configured' };
  }

  if (playerIds.length === 0) {
    return { success: false, error: 'No player IDs provided' };
  }

  try {
    const payload: any = {
      app_id: ONESIGNAL_APP_ID,
      include_player_ids: playerIds,
      headings: { en: title },
      contents: { en: body },
      data: {
        ...data,
        timestamp: new Date().toISOString(),
      },
      priority: priority === 'high' ? 10 : 5,
      // iOS/Android 설정
      ios_badgeType: 'Increase',
      ios_badgeCount: 1,
    };

    // actionUrl이 있을 때만 URL 설정 (사용자 간 채팅은 URL 없음)
    if (actionUrl) {
      payload.url = actionUrl;
      payload.data.actionUrl = actionUrl;
    }

    const response = await fetch(`${ONESIGNAL_API_URL}/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok || result.errors) {
      logger.error('OneSignal 푸시 전송 실패', result);
      return { success: false, error: JSON.stringify(result.errors) };
    }

    logger.info('OneSignal 푸시 전송 성공', {
      notificationId: result.id,
      recipients: result.recipients,
    });

    return {
      success: true,
      notificationId: result.id,
    };
  } catch (error: any) {
    logger.error('OneSignal 푸시 전송 오류', error);
    return { success: false, error: error.message };
  }
}

// =====================================================
// 알림 생성 및 푸시 전송 (통합)
// =====================================================

/**
 * 알림을 DB에 저장하고 OneSignal로 푸시 전송
 */
export async function createNotification(params: CreateNotificationParams): Promise<{
  success: boolean;
  notificationIds?: string[];
  error?: string;
}> {
  const {
    userId,
    userIds,
    sendToAll,
    sendToAdmins,
    type,
    category,
    title,
    body,
    resourceType,
    resourceId,
    actionUrl,
    data,
    sentByUserId,
    priority = 'normal',
  } = params;

  try {
    // 1. 수신자 목록 결정
    let targetUserIds: string[] = [];

    if (sendToAdmins) {
      // 관리자에게만
      const { data: admins } = await supabaseAdmin
        .from('users')
        .select('id')
        .in('role', ['admin', 'super_admin', 'employee']);

      targetUserIds = admins?.map((u) => u.id) || [];
    } else if (sendToAll) {
      // 전체 셀러에게
      const { data: sellers } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('is_active', true);

      targetUserIds = sellers?.map((u) => u.id) || [];
    } else if (userIds && userIds.length > 0) {
      targetUserIds = userIds;
    } else if (userId) {
      targetUserIds = [userId];
    } else {
      return { success: false, error: '수신자를 지정해주세요.' };
    }

    if (targetUserIds.length === 0) {
      return { success: false, error: '수신자가 없습니다.' };
    }

    // 2. 각 사용자별 알림 설정 확인 및 필터링
    const filteredUserIds: string[] = [];

    for (const targetUserId of targetUserIds) {
      // 알림 설정 확인
      const settingsTable = category === 'admin' ? 'admin_notification_settings' : 'notification_settings';

      const { data: settings } = await supabaseAdmin
        .from(settingsTable)
        .select('*')
        .eq('user_id', targetUserId)
        .single();

      // 전체 알림 비활성화 (설정이 없으면 기본적으로 활성화)
      if (settings && settings.push_enabled === false) {
        continue;
      }

      // 카테고리별 알림 설정 확인 (설정이 없으면 기본적으로 활성화)
      if (category === 'seller' && settings) {
        if (type === 'order_status' && settings.order_status_enabled === false) continue;
        if (type === 'announcement' && settings.announcements_enabled === false) continue;
        if (type === 'comment_reply' && settings.comment_reply_enabled === false) continue;
        if (type === 'deposit_confirm' && settings.deposit_confirm_enabled === false) continue;
        if (type === 'new_message' && settings.new_message_enabled === false) continue;
      }

      if (category === 'admin' && settings) {
        if (type === 'admin_new_order' && settings.new_order_enabled === false) continue;
        if (type === 'admin_support_post' && settings.support_post_enabled === false) continue;
        if (type === 'admin_new_member' && settings.new_member_enabled === false) continue;
      }

      // 방해 금지 시간 확인
      if (settings?.quiet_hours_enabled && priority !== 'high') {
        const now = new Date();
        const currentTime = now.toTimeString().substring(0, 5);
        const start = settings.quiet_hours_start;
        const end = settings.quiet_hours_end;

        if (start && end) {
          if (start < end && currentTime >= start && currentTime < end) {
            continue;
          } else if (start > end && (currentTime >= start || currentTime < end)) {
            continue;
          }
        }
      }

      filteredUserIds.push(targetUserId);
    }

    if (filteredUserIds.length === 0) {
      return { success: false, error: '알림을 받을 사용자가 없습니다.' };
    }

    // 3. DB에 알림 저장
    const notifications = filteredUserIds.map((targetUserId) => ({
      user_id: targetUserId,
      type,
      category,
      title,
      body,
      resource_type: resourceType,
      resource_id: resourceId,
      action_url: actionUrl,
      data,
      sent_by_user_id: sentByUserId,
      priority,
      is_sent: false,
    }));

    const { data: createdNotifications, error: insertError } = await supabaseAdmin
      .from('notifications')
      .insert(notifications)
      .select('id, user_id');

    if (insertError) {
      logger.error('알림 DB 저장 실패', insertError);
      return { success: false, error: insertError.message };
    }

    const notificationIds = createdNotifications?.map((n) => n.id) || [];

    // 4. OneSignal Player IDs 수집
    const { data: playerRecords } = await supabaseAdmin
      .from('onesignal_player_ids')
      .select('player_id, user_id')
      .in('user_id', filteredUserIds)
      .eq('is_active', true);

    if (!playerRecords || playerRecords.length === 0) {
      logger.warn('OneSignal Player ID가 없는 사용자들', { userIds: filteredUserIds });
      return {
        success: true,
        notificationIds,
      };
    }

    const playerIds = playerRecords.map((r) => r.player_id);

    // 5. OneSignal 푸시 전송
    const pushResult = await sendOneSignalPush({
      playerIds,
      title,
      body,
      actionUrl,
      data,
      priority,
    });

    // 6. 알림 전송 상태 업데이트
    await supabaseAdmin
      .from('notifications')
      .update({
        is_sent: pushResult.success,
        sent_at: pushResult.success ? new Date().toISOString() : null,
        onesignal_notification_id: pushResult.notificationId,
        send_error: pushResult.error,
      })
      .in('id', notificationIds);

    logger.info('알림 전송 완료', {
      type,
      category,
      recipientCount: filteredUserIds.length,
      playerCount: playerIds.length,
      pushSuccess: pushResult.success,
    });

    return {
      success: true,
      notificationIds,
    };
  } catch (error: any) {
    logger.error('알림 생성 오류', error);
    return { success: false, error: error.message };
  }
}

// =====================================================
// 셀러 알림 헬퍼 함수들
// =====================================================

/**
 * 발주서 상태 변경 알림
 */
export async function notifyOrderStatusChange(params: {
  userId: string;
  orderId: string;
  orderNumber: string;
  oldStatus: string;
  newStatus: string;
  trackingNumber?: string;
}) {
  const statusLabels: Record<string, string> = {
    pending: '접수 대기',
    confirmed: '접수 완료',
    payment_confirmed: '입금 확인',
    processing: '상품 준비 중',
    shipped: '출하 완료',
    delivered: '배송 완료',
    cancelled: '취소',
  };

  const statusLabel = statusLabels[params.newStatus] || params.newStatus;
  let bodyText = `발주서 ${params.orderNumber}이(가) "${statusLabel}" 상태로 변경되었습니다.`;

  if (params.newStatus === 'shipped' && params.trackingNumber) {
    bodyText += `\n송장번호: ${params.trackingNumber}`;
  }

  return createNotification({
    userId: params.userId,
    type: 'order_status',
    category: 'seller',
    title: '📦 발주서 상태 변경',
    body: bodyText,
    resourceType: 'order',
    resourceId: params.orderId,
    actionUrl: `/orders/${params.orderId}`,
    data: {
      order_id: params.orderId,
      order_number: params.orderNumber,
      old_status: params.oldStatus,
      new_status: params.newStatus,
      tracking_number: params.trackingNumber,
    },
    priority: 'normal',
  });
}

/**
 * 공지사항 알림 (발송휴무일, 출하소식, 가격, 품절 등)
 */
export async function notifyAnnouncement(params: {
  announcementId: string;
  category: 'shipping_holiday' | 'harvest_news' | 'price_change' | 'out_of_stock' | 'general';
  title: string;
  body: string;
  sentByUserId?: string;
}) {
  const categoryIcons: Record<string, string> = {
    shipping_holiday: '🚫',
    harvest_news: '🌾',
    price_change: '💰',
    out_of_stock: '⚠️',
    general: '📢',
  };

  const icon = categoryIcons[params.category] || '📢';

  return createNotification({
    sendToAll: true,  // 전체 셀러에게 발송
    type: 'announcement',
    category: 'seller',
    title: `${icon} ${params.title}`,
    body: params.body,
    resourceType: 'announcement',
    resourceId: params.announcementId,
    actionUrl: `/announcements/${params.announcementId}`,
    data: {
      announcement_category: params.category,
    },
    sentByUserId: params.sentByUserId,
    priority: params.category === 'out_of_stock' ? 'high' : 'normal',
  });
}

/**
 * 댓글 답글 알림
 */
export async function notifyCommentReply(params: {
  userId: string;
  postId: string;
  postTitle: string;
  commenterName: string;
  commentPreview: string;
}) {
  return createNotification({
    userId: params.userId,
    type: 'comment_reply',
    category: 'seller',
    title: '💬 새 댓글이 달렸습니다',
    body: `${params.commenterName}님이 "${params.postTitle}"에 댓글을 남겼습니다: ${params.commentPreview}`,
    resourceType: 'post',
    resourceId: params.postId,
    actionUrl: `/posts/${params.postId}`,
    data: {
      post_id: params.postId,
      commenter_name: params.commenterName,
    },
    priority: 'normal',
  });
}

/**
 * 예치금 입금 확인 알림
 */
export async function notifyDepositConfirm(params: {
  userId: string;
  depositId: string;
  amount: number;
  newBalance: number;
}) {
  return createNotification({
    userId: params.userId,
    type: 'deposit_confirm',
    category: 'seller',
    title: '💰 예치금 입금 확인',
    body: `${params.amount.toLocaleString()}원이 입금 확인되었습니다.\n현재 잔액: ${params.newBalance.toLocaleString()}원`,
    resourceType: 'deposit',
    resourceId: params.depositId,
    actionUrl: '/cash',
    data: {
      deposit_id: params.depositId,
      amount: params.amount,
      new_balance: params.newBalance,
    },
    priority: 'normal',
  });
}

/**
 * 새 메시지 알림
 */
export async function notifyNewMessage(params: {
  receiverId: string;
  senderId: string;
  senderName: string;
  messagePreview: string;
  threadId: string;
}) {
  return createNotification({
    userId: params.receiverId,
    type: 'new_message',
    category: 'seller',
    title: `💬 ${params.senderName}님의 메시지`,
    body: params.messagePreview,
    resourceType: 'message_thread',
    resourceId: params.threadId,
    actionUrl: `/platform/messages?userId=${params.senderId}`, // 채팅 페이지 열기
    data: {
      sender_id: params.senderId,
      sender_name: params.senderName,
      thread_id: params.threadId,
    },
    priority: 'normal',
  });
}

// =====================================================
// 관리자 알림 헬퍼 함수들
// =====================================================

/**
 * 관리자 알림: 신규 발주서 등록 (배치)
 */
export async function notifyAdminNewOrder(params: {
  organizationName: string;
  orderCount: number;
  totalAmount: number;
  batchId?: string;
}) {
  // 기본 URL (환경변수에서 가져오거나 기본값 사용)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dalreamarket.com';

  // 배치 ID가 있으면 배치 전용 페이지로, 없으면 일반 주문 페이지로
  const actionUrl = params.batchId
    ? `${baseUrl}/admin/order-batch/${params.batchId}`
    : `${baseUrl}/admin/order-platform`;

  return createNotification({
    sendToAdmins: true,
    type: 'admin_new_order',
    category: 'admin',
    title: '🆕 신규 발주서 등록',
    body: `${params.organizationName}님이 발주서 ${params.orderCount}건을 등록했습니다.\n최종입금액: ${params.totalAmount.toLocaleString()}원`,
    resourceType: 'order_batch',
    resourceId: params.batchId || 'single',
    actionUrl,
    data: {
      organization_name: params.organizationName,
      order_count: params.orderCount,
      total_amount: params.totalAmount,
      batch_id: params.batchId,
    },
    priority: 'high',
  });
}

/**
 * 관리자 알림: 질문/건의 게시글 등록
 */
export async function notifyAdminSupportPost(params: {
  postId: string;
  postType: 'question' | 'suggestion';
  title: string;
  authorName: string;
}) {
  const typeLabel = params.postType === 'question' ? '질문' : '건의';
  const icon = params.postType === 'question' ? '❓' : '💡';

  return createNotification({
    sendToAdmins: true,
    type: 'admin_support_post',
    category: 'admin',
    title: `${icon} 새 ${typeLabel} 게시글`,
    body: `${params.authorName}님이 ${typeLabel} 게시글을 작성했습니다.\n제목: ${params.title}`,
    resourceType: 'post',
    resourceId: params.postId,
    actionUrl: `/admin/support/${params.postId}`,
    data: {
      post_id: params.postId,
      post_type: params.postType,
      author_name: params.authorName,
    },
    priority: 'normal',
  });
}

/**
 * 관리자 알림: 신규 회원 가입
 */
export async function notifyAdminNewMember(params: {
  userId: string;
  userName: string;
  userEmail: string;
  organizationName?: string;
}) {
  return createNotification({
    sendToAdmins: true,
    type: 'admin_new_member',
    category: 'admin',
    title: '👤 신규 회원 가입',
    body: `${params.userName}님이 회원가입했습니다.\n이메일: ${params.userEmail}${params.organizationName ? `\n업체: ${params.organizationName}` : ''}`,
    resourceType: 'user',
    resourceId: params.userId,
    actionUrl: `/admin/members/${params.userId}`,
    data: {
      user_id: params.userId,
      user_name: params.userName,
      user_email: params.userEmail,
      organization_name: params.organizationName,
    },
    priority: 'normal',
  });
}

/**
 * 관리자 알림: 주문 상태 변경 (사용자 액션)
 * 발주서확정, 취소요청 등 사용자가 변경한 상태를 관리자에게 알림
 */
export async function notifyAdminOrderStatusChange(params: {
  orderId: string;
  orderNumber: string;
  organizationName: string;
  newStatus: string;
}) {
  const statusLabels: Record<string, { icon: string; label: string }> = {
    '발주서확정': { icon: '✅', label: '발주서 확정' },
    '취소요청': { icon: '🚫', label: '취소 요청' },
  };

  const statusInfo = statusLabels[params.newStatus] || { icon: '📝', label: params.newStatus };

  return createNotification({
    sendToAdmins: true,
    type: 'admin_new_order',
    category: 'admin',
    title: `${statusInfo.icon} ${statusInfo.label}`,
    body: `${params.organizationName}님이 발주서를 "${statusInfo.label}" 상태로 변경했습니다.\n주문번호: ${params.orderNumber}`,
    resourceType: 'order',
    resourceId: params.orderId,
    actionUrl: `/admin/order-platform`,
    data: {
      order_id: params.orderId,
      order_number: params.orderNumber,
      organization_name: params.organizationName,
      new_status: params.newStatus,
    },
    priority: 'high',
  });
}
