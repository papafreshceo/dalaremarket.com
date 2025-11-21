import { createClient } from '@/lib/supabase/client';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

/**
 * 통합 로그아웃 함수
 * - OneSignal Player ID 비활성화
 * - Supabase 인증 로그아웃
 * - 로컬 스토리지 정리
 * - 세션 스토리지 정리
 */
export async function logout(router: AppRouterInstance, redirectTo: string = '/platform') {
  try {
    const supabase = createClient();

    // 세션 토큰 가져오기
    const { data: { session } } = await supabase.auth.getSession();

    // 1. OneSignal Player ID 비활성화 (선택적)
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Authorization 헤더 우선 사용 (있으면 CSRF 토큰 불필요)
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      } else {
        // 세션이 없으면 CSRF 토큰 사용
        const csrfToken = getCsrfToken();
        if (csrfToken) {
          headers['X-CSRF-Token'] = csrfToken;
        }
      }

      const response = await fetch('/api/notifications/player-id', {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        console.warn('OneSignal Player ID 비활성화 실패 (무시)');
      }
    } catch (error) {
      console.warn('OneSignal Player ID 비활성화 실패 (무시):', error);
    }

    // 2. Supabase 인증 로그아웃 (OneSignal logout은 OneSignalProvider에서 자동 처리)
    await supabase.auth.signOut();

    // 2-1. OneSignal IndexedDB 정리 (로그아웃 시에만)
    try {
      const databases = await indexedDB.databases();
      for (const db of databases) {
        if (db.name?.includes('OneSignal')) {
          indexedDB.deleteDatabase(db.name);
          console.log('OneSignal DB 삭제:', db.name);
        }
      }
    } catch (error) {
      console.warn('OneSignal IndexedDB 정리 실패 (무시):', error);
    }

    // 3. 로컬 스토리지 정리
    const keysToRemove = [
      'ordersActiveTab',
      'openChatWithUser', // 메시지 알림 관련
    ];

    // 로그인 보상 관련 키 + OneSignal 관련 키 찾기
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (
        key.startsWith('login_reward_claimed_') ||
        key.startsWith('activity_') ||
        key.includes('onesignal') ||
        key.includes('OneSignal')
      ) {
        keysToRemove.push(key);
      }
    });

    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`localStorage.removeItem('${key}') 실패:`, error);
      }
    });

    // 4. 세션 스토리지 정리
    try {
      sessionStorage.clear();
    } catch (error) {
      console.warn('sessionStorage.clear() 실패:', error);
    }

    // 5. 완전한 페이지 초기화를 위해 window.location.href 사용
    // (router.push는 React 상태가 남아있을 수 있음)
    setTimeout(() => {
      window.location.href = redirectTo;
    }, 100);

    return { success: true };
  } catch (error) {
    console.error('로그아웃 중 오류:', error);
    return { success: false, error };
  }
}

/**
 * CSRF 토큰 가져오기
 */
function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'csrf-token') {
      return decodeURIComponent(value);
    }
  }

  return null;
}
