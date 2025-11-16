'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import logger from '@/lib/logger';

// OneSignal 타입 정의
declare global {
  interface Window {
    OneSignalDeferred?: any[];
    OneSignal?: any;
  }
}

export default function OneSignalProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const supabase = createClientComponentClient();

  useEffect(() => {
    // OneSignal 초기화
    const initOneSignal = async () => {
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

        window.OneSignalDeferred.push(async function (OneSignal: any) {
          // OneSignal 대시보드 설정만 사용 (코드에서 아무것도 오버라이드 안 함)
          await OneSignal.init({
            appId: appId,
            allowLocalhostAsSecureOrigin: true,
          });

          logger.info('OneSignal SDK 초기화 완료');

          // 알림 클릭 이벤트 핸들러
          OneSignal.Notifications.addEventListener('click', (event: any) => {
            logger.info('알림 클릭', event);

            // 알림에 포함된 URL로 이동
            if (event.notification?.data?.actionUrl) {
              window.location.href = event.notification.data.actionUrl;
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

          // 로그인한 사용자 확인 및 연결
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
                logger.info('푸시 알림 구독 대기 중', { userId: user.id });
              }
            } catch (error) {
              logger.error('OneSignal 사용자 연결 오류', error);
            }
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
  }, []);

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
