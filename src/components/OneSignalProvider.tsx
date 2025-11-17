'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import logger from '@/lib/logger';

// OneSignal 타입 정의
declare global {
  interface Window {
    OneSignalDeferred?: any[];
    OneSignal?: any;
  }
}

// OneSignal 초기화 상태 추적 (전역)
let isOneSignalInitialized = false;

export default function OneSignalProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // 싱글톤 Supabase 클라이언트 사용
  const supabase = createClient();

  useEffect(() => {
    // OneSignal 초기화
    const initOneSignal = async () => {
      // 이미 초기화되었으면 스킵
      if (isOneSignalInitialized) {
        logger.info('OneSignal은 이미 초기화되었습니다.');
        return;
      }

      const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

      if (!appId) {
        logger.warn('OneSignal App ID가 설정되지 않았습니다.');
        return;
      }

      try {
        // OneSignal SDK 로드
        if (!window.OneSignalDeferred) {
          window.OneSignalDeferred = [];
        }

        // 회원가입 페이지에서는 알림 버튼 비활성화
        const shouldShowNotifyButton = !pathname.startsWith('/register');

        window.OneSignalDeferred.push(async function (OneSignal: any) {
          try {
            // 초기화 상태 플래그 설정
            isOneSignalInitialized = true;

            // OneSignal 초기화 및 아이콘 설정
            await OneSignal.init({
              appId: appId,
              allowLocalhostAsSecureOrigin: true,
              notifyButton: {
                enable: shouldShowNotifyButton,  // Subscription Bell 조건부 활성화
                text: {
                  'tip.state.unsubscribed': '알림 받기',
                  'tip.state.subscribed': '알림 받는 중',
                  'tip.state.blocked': '알림 차단됨 - 브라우저 설정에서 허용해주세요',
                  'message.prenotify': '알림을 받으시겠습니까?',
                  'message.action.subscribed': '알림을 받고 있습니다!',
                  'message.action.resubscribed': '다시 알림을 받습니다!',
                  'message.action.unsubscribed': '더 이상 알림을 받지 않습니다.',
                  'dialog.main.title': '알림 설정',
                  'dialog.main.button.subscribe': '구독하기',
                  'dialog.main.button.unsubscribe': '구독 취소',
                  'dialog.blocked.title': '알림이 차단되었습니다',
                  'dialog.blocked.message': '브라우저 설정에서 알림을 허용해주세요.\n\n1. 주소창 왼쪽 아이콘 클릭 (또는 F12 → Application → Notifications)\n2. 알림 → 허용으로 변경\n3. 페이지 새로고침',
                },
                size: 'medium',
                position: 'bottom-right',
                offset: {
                  bottom: '20px',
                  right: '20px',
                },
                showCredit: false,
              },
            });

            // 알림 기본 설정
            await OneSignal.Notifications.setDefaultUrl(window.location.origin);
            await OneSignal.Notifications.setDefaultTitle('달래마켓');

            logger.info('OneSignal SDK 초기화 완료');

            // 권한 변경 감지 (차단 → 허용 등)
            OneSignal.Notifications.addEventListener('permissionChange', (permission: boolean) => {
              logger.info('알림 권한 변경:', permission ? '허용됨' : '거부됨');
            });

            // 알림 클릭 이벤트 핸들러
            OneSignal.Notifications.addEventListener('click', (event: any) => {
              logger.info('알림 클릭', event);

              const notificationData = event.notification?.data;

              // 메시지 알림인 경우 localStorage에 저장 (채팅 페이지에서 사용)
              if (notificationData?.sender_id) {
                localStorage.setItem('openChatWithUser', notificationData.sender_id);
              }

              // actionUrl이 있으면 해당 URL로 이동 (OneSignal 기본 동작 사용)
              if (notificationData?.actionUrl && notificationData.actionUrl !== '#') {
                window.location.href = notificationData.actionUrl;
              }
            });

            // 푸시 구독 상태 변경 이벤트
            OneSignal.User.PushSubscription.addEventListener('change', async (event: any) => {
              logger.info('푸시 구독 상태 변경', event);

              const { data: { user } } = await supabase.auth.getUser();

              if (user && event.current?.id) {
                try {
                  await OneSignal.login(user.id);
                  await savePlayerIdToDatabase(user.id, event.current.id);
                  logger.info('사용자 연결 완료', { userId: user.id });
                } catch (error) {
                  logger.error('사용자 연결 실패', error);
                }
              }
            });
          } catch (error: any) {
            // OneSignal 초기화 중 에러 발생 시
            logger.error('OneSignal 초기화 에러:', error);

            // 이미 초기화된 에러가 아니면 플래그 리셋 (재시도 가능하게)
            if (!error.message?.includes('already initialized')) {
              isOneSignalInitialized = false;
            }

            // 권한 차단 에러일 경우 사용자에게 안내
            if (error.message?.includes('Permission') || error.message?.includes('blocked')) {
              logger.warn('알림 권한이 차단되었습니다. 브라우저 설정에서 허용해주세요.');
            }
          }

          // 로그인한 사용자 확인 및 연결
          try {
            const {
              data: { user },
            } = await supabase.auth.getUser();

            if (user) {
              // 푸시 구독 상태 확인 후 사용자 연결
              try {
                const isSubscribed = await OneSignal.User.PushSubscription.optedIn;

                if (isSubscribed) {
                  const playerId = await OneSignal.User.PushSubscription.id;

                  if (playerId) {
                    await OneSignal.login(user.id);
                    await savePlayerIdToDatabase(user.id, playerId);
                    logger.info('OneSignal 사용자 연결 완료', {
                      userId: user.id,
                      playerId: playerId.substring(0, 20) + '...',
                    });
                  }
                } else {
                  logger.info('푸시 알림 구독 대기 중 (Subscription Bell 사용)', { userId: user.id });
                  // Push Slide Prompt 대신 Subscription Bell 사용
                  // 사용자가 직접 벨 아이콘을 클릭해서 구독
                }
              } catch (error) {
                logger.error('OneSignal 사용자 연결 오류', error);
              }
            }
          } catch (error) {
            logger.error('사용자 정보 조회 오류', error);
          }
        });

        // OneSignal SDK 스크립트 로드
        if (!document.getElementById('onesignal-script')) {
          const script = document.createElement('script');
          script.id = 'onesignal-script';
          script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
          script.async = true;
          document.head.appendChild(script);
        }
      } catch (error) {
        logger.error('OneSignal 초기화 오류', error);
      }
    };

    initOneSignal();
  }, [pathname]);

  // 사용자 로그인/로그아웃 시 OneSignal 상태 업데이트
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // 로그인 시 OneSignal에 사용자 ID 설정
        if (window.OneSignal) {
          const playerId = await window.OneSignal.User.PushSubscription.id;

          if (playerId) {
            await window.OneSignal.login(session.user.id);
            await savePlayerIdToDatabase(session.user.id, playerId);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        // 로그아웃 시 OneSignal 로그아웃
        if (window.OneSignal) {
          await window.OneSignal.logout();
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return <>{children}</>;
}

// Player ID를 데이터베이스에 저장
async function savePlayerIdToDatabase(userId: string, playerId: string) {
  try {
    const response = await fetch('/api/notifications/player-id', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        player_id: playerId,
        device_type: getDeviceType(),
        device_model: getDeviceModel(),
      }),
    });

    if (!response.ok) {
      throw new Error('Player ID 저장 실패');
    }

    logger.debug('Player ID 저장 완료', { userId, playerId: playerId.substring(0, 20) + '...' });
  } catch (error) {
    logger.error('Player ID 저장 오류', error);
  }
}

// 디바이스 타입 감지
function getDeviceType(): string {
  const userAgent = navigator.userAgent.toLowerCase();

  if (/android/.test(userAgent)) {
    return 'android';
  } else if (/iphone|ipad|ipod/.test(userAgent)) {
    return 'ios';
  } else {
    return 'web';
  }
}

// 디바이스 모델 감지
function getDeviceModel(): string {
  const userAgent = navigator.userAgent;

  // 브라우저 감지
  if (userAgent.indexOf('Chrome') > -1) return 'Chrome';
  if (userAgent.indexOf('Safari') > -1) return 'Safari';
  if (userAgent.indexOf('Firefox') > -1) return 'Firefox';
  if (userAgent.indexOf('Edge') > -1) return 'Edge';

  return 'Unknown';
}
