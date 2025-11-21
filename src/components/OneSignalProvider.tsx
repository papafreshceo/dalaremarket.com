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
let isOneSignalInitializing = false;
// OneSignal 로그인 중복 방지 (전역)
let oneSignalLoginInProgress = false;
let lastLoginUserId: string | null = null;

export default function OneSignalProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    // 개발 환경 콘솔 에러 필터링
    if (process.env.NODE_ENV === 'development') {
      const originalError = console.error;
      const originalWarn = console.warn;

      console.error = (...args: any[]) => {
        const errorMsg = args[0]?.toString() || '';

        // React Portal removeChild 에러 억제
        if (
          errorMsg.includes('removeChild') ||
          (errorMsg.includes('TypeError') && args[0]?.stack?.includes('removeChild'))
        ) {
          return;
        }

        // OneSignal 409 Conflict 에러 억제
        if (errorMsg.includes('409') || errorMsg.includes('Conflict')) {
          // URL을 확인해서 OneSignal API인지 체크
          if (args.some((arg: any) =>
            arg?.toString().includes('onesignal.com') ||
            arg?.toString().includes('identity')
          )) {
            return;
          }
        }

        originalError(...args);
      };

      // OneSignal 409 Conflict 경고 억제
      console.warn = (...args: any[]) => {
        const msg = args.join(' ');
        if (msg.includes('409') && msg.includes('onesignal')) {
          return;
        }
        originalWarn(...args);
      };
    }

    // OneSignal /identity 409 에러 fetch intercept로 필터링 (개발 환경만)
    let originalFetch: typeof window.fetch | null = null;

    if (process.env.NODE_ENV === 'development') {
      originalFetch = window.fetch;
      window.fetch = async (...args: any[]) => {
        const response = await originalFetch!(...args);

        // OneSignal /identity PATCH 409 응답 필터링
        if (
          args[0]?.toString().includes('onesignal.com') &&
          args[0]?.toString().includes('/identity') &&
          response.status === 409
        ) {
          // 409 응답을 복제하되 콘솔에 로그 안 남김
          return response.clone();
        }

        return response;
      };
    }

    const initOneSignal = async () => {
      // 이미 초기화되었거나 초기화 진행 중이면 스킵
      if (isOneSignalInitialized || isOneSignalInitializing || window.OneSignal) {
        logger.info('OneSignal은 이미 초기화되었거나 진행 중입니다.');
        isOneSignalInitialized = true;
        return;
      }

      isOneSignalInitializing = true;

      const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

      if (!appId) {
        logger.warn('OneSignal App ID가 설정되지 않았습니다.');
        isOneSignalInitializing = false;
        return;
      }

      try {
        // OneSignal SDK가 이미 로드되어 있으면 스킵
        if (document.getElementById('onesignal-script')) {
          logger.info('OneSignal SDK는 이미 로드되었습니다.');
          isOneSignalInitialized = true;
          isOneSignalInitializing = false;
          return;
        }

        // OneSignal SDK 로드 준비
        if (!window.OneSignalDeferred) {
          window.OneSignalDeferred = [];
        }

        const shouldShowNotifyButton = true;

        window.OneSignalDeferred.push(async function (OneSignal: any) {
          try {
            isOneSignalInitialized = true;

            // OneSignal 초기화
            await OneSignal.init({
              appId: appId,
              allowLocalhostAsSecureOrigin: process.env.NODE_ENV === 'development',
              notifyButton: {
                enable: shouldShowNotifyButton,
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

            isOneSignalInitializing = false;
            logger.info('OneSignal SDK 초기화 완료');

            // 권한 변경 감지
            OneSignal.Notifications.addEventListener('permissionChange', (permission: boolean) => {
              logger.info('알림 권한 변경:', permission ? '허용됨' : '거부됨');
            });

            // 알림 클릭 이벤트
            OneSignal.Notifications.addEventListener('click', async (event: any) => {
              const notificationData = event.notification?.additionalData;

              if (notificationData?.actionUrl && notificationData.actionUrl !== '#') {
                const screenWidth = window.screen.width;
                const screenHeight = window.screen.height;
                const windowFeatures = `width=${screenWidth},height=${screenHeight},left=0,top=0,resizable=yes,scrollbars=yes,toolbar=no,menubar=no,location=no,status=no`;
                window.open(notificationData.actionUrl, 'dalrea_orders', windowFeatures);
              }
            });

            // 푸시 구독 상태 변경 이벤트 (Player ID 저장만)
            OneSignal.User.PushSubscription.addEventListener('change', async (event: any) => {
              logger.info('푸시 구독 상태 변경', event);

              const { data: { user } } = await supabase.auth.getUser();

              // Player ID만 저장 (external_id는 건드리지 않음)
              if (user && event.current?.id) {
                await savePlayerIdToDatabase(user.id, event.current.id);
                logger.info('Player ID 저장 완료', { userId: user.id });
              }
            });
          } catch (error: any) {
            isOneSignalInitializing = false;

            const isAlreadyInitialized = error.message?.includes('already initialized');

            if (isAlreadyInitialized) {
              logger.debug('OneSignal이 이미 초기화되어 있습니다.');
              isOneSignalInitialized = true;
            } else {
              logger.error('OneSignal 초기화 에러:', error);
              isOneSignalInitialized = false;
            }

            if (error.message?.includes('Permission') || error.message?.includes('blocked')) {
              logger.warn('알림 권한이 차단되었습니다. 브라우저 설정에서 허용해주세요.');
            }
          }

          // 초기 Player ID 저장 (login은 Supabase auth 이벤트에서만)
          try {
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
              try {
                const isSubscribed = await OneSignal.User.PushSubscription.optedIn;

                if (isSubscribed) {
                  const playerId = await OneSignal.User.PushSubscription.id;

                  if (playerId) {
                    // Player ID만 저장 (external_id login은 SIGNED_IN 이벤트에서)
                    await savePlayerIdToDatabase(user.id, playerId);
                    logger.info('초기 Player ID 저장 완료', {
                      userId: user.id,
                      playerId: playerId.substring(0, 20) + '...',
                    });
                  }
                } else {
                  logger.info('푸시 알림 구독 대기 중 (Subscription Bell 사용)', { userId: user.id });
                }
              } catch (error) {
                logger.error('Player ID 저장 오류', error);
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
        isOneSignalInitializing = false;
      }
    };

    initOneSignal();

    // Cleanup: fetch 복원 (개발 환경에서만)
    return () => {
      if (originalFetch) {
        window.fetch = originalFetch;
      }
    };
  }, []);

  // Supabase 인증 상태 변경 이벤트
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!window.OneSignal || !isOneSignalInitialized) {
        logger.debug('OneSignal 아직 초기화되지 않음 (인증 이벤트 대기)');
        return;
      }

      if (event === 'SIGNED_IN' && session?.user) {
        try {
          const isSubscribed = await window.OneSignal.User.PushSubscription.optedIn;

          if (isSubscribed) {
            const playerId = await window.OneSignal.User.PushSubscription.id;

            if (playerId) {
              const loginSuccess = await safeOneSignalLogin(window.OneSignal, session.user.id);
              if (loginSuccess) {
                await savePlayerIdToDatabase(session.user.id, playerId);
                logger.info('로그인 시 OneSignal 연결 완료');
              }
            }
          }
        } catch (error) {
          logger.error('로그인 시 OneSignal 연결 오류', error);
        }
      } else if (event === 'SIGNED_OUT') {
        try {
          await window.OneSignal.logout();
          lastLoginUserId = null;
          logger.info('OneSignal 로그아웃 완료');
        } catch (error) {
          logger.error('OneSignal 로그아웃 오류', error);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return <>{children}</>;
}

// OneSignal 로그인을 안전하게 처리하는 함수 (중복 방지)
async function safeOneSignalLogin(OneSignal: any, userId: string): Promise<boolean> {
  try {
    // 1단계: 현재 external_id 확인 (가장 먼저)
    const currentUserId = await OneSignal.User?.getExternalId?.();

    if (currentUserId === userId) {
      logger.debug('이미 OneSignal에 로그인되어 있습니다 (스킵):', userId);
      lastLoginUserId = userId;
      return true; // 이미 같은 유저면 아무것도 안 함
    }

    // 2단계: 메모리 캐시 체크
    if (lastLoginUserId === userId) {
      logger.debug('메모리 캐시에 동일 사용자 (스킵):', userId);
      return true;
    }

    // 3단계: 로그인 진행 중이면 대기
    if (oneSignalLoginInProgress) {
      logger.debug('OneSignal 로그인이 이미 진행 중입니다 (대기)');
      for (let i = 0; i < 50; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (!oneSignalLoginInProgress) break;
      }
      if (lastLoginUserId === userId) {
        return true;
      }
    }

    oneSignalLoginInProgress = true;

    // 4단계: 다른 사용자로 로그인되어 있으면 로그아웃 후 로그인
    if (currentUserId && currentUserId !== userId) {
      logger.info('다른 사용자 세션 감지, 로그아웃 후 재로그인:', { currentUserId, newUserId: userId });
      try {
        await OneSignal.logout();
        logger.debug('이전 사용자 로그아웃 완료');
      } catch (logoutError) {
        logger.warn('로그아웃 실패 (계속 진행):', logoutError);
      }
    }

    // 5단계: 로그인 시도
    await OneSignal.login(userId);
    lastLoginUserId = userId;
    logger.info('OneSignal 로그인 성공:', userId);
    return true;
  } catch (error: any) {
    const errorMsg = error?.message || '';
    const errorCode = error?.code || error?.status;

    // user-2 (External ID 충돌): 조용히 성공으로 처리 (기능은 유지)
    if (errorCode === 'user-2' || errorMsg.includes('claimed by another User')) {
      logger.warn('OneSignal External ID 충돌 (user-2) - 성공으로 간주:', {
        userId,
        note: '기능은 정상 작동, 서버에서 중복 정리 필요'
      });
      lastLoginUserId = userId; // 캐시에 저장
      return true; // 성공으로 처리
    }

    // 기타 409 에러: 로그만 남기고 성공 처리
    if (errorCode === 409 || errorMsg.includes('409') || errorMsg.includes('Conflict')) {
      logger.warn('OneSignal 로그인 충돌 (409) - 성공으로 간주:', errorMsg);
      lastLoginUserId = userId;
      return true;
    }

    logger.error('OneSignal 로그인 실패:', error);
    return false;
  } finally {
    oneSignalLoginInProgress = false;
  }
}

// Player ID를 데이터베이스에 저장
async function savePlayerIdToDatabase(userId: string, playerId: string, retryCount = 0) {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000;

  try {
    // Supabase 클라이언트 생성 (Authorization 헤더용)
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Authorization 헤더 추가
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const response = await fetch('/api/notifications/player-id', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        player_id: playerId,
        device_type: 'web',
        device_model: navigator.userAgent,
      }),
    });

    if (!response.ok) {
      throw new Error(`Player ID 저장 실패: ${response.status}`);
    }

    const data = await response.json();
    logger.info('Player ID 저장 완료', data);
  } catch (error) {
    logger.error('Player ID 저장 오류', error);

    if (retryCount < MAX_RETRIES) {
      logger.info(`Player ID 저장 재시도 (${retryCount + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      await savePlayerIdToDatabase(userId, playerId, retryCount + 1);
    }
  }
}
