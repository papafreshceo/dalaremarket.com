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

    // 1. OneSignal Player ID 비활성화 (백그라운드 실행 - 기다리지 않음)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    } else {
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }
    }

    // 백그라운드에서 실행 (await 제거)
    fetch('/api/notifications/player-id', {
      method: 'DELETE',
      headers,
    }).catch(() => {
      // 에러 무시
    });

    // 2. Supabase 인증 로그아웃 (이것만 기다림)
    await supabase.auth.signOut();

    // 3. 로컬 스토리지 정리 (빠른 작업)
    const keysToRemove = [
      'ordersActiveTab',
      'openChatWithUser',
    ];

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
        // 에러 무시
      }
    });

    // 4. 세션 스토리지 정리 (빠른 작업)
    try {
      sessionStorage.clear();
    } catch (error) {
      // 에러 무시
    }

    // 5. OneSignal IndexedDB 정리 (백그라운드 실행 - 기다리지 않음)
    indexedDB.databases().then(databases => {
      for (const db of databases) {
        if (db.name?.includes('OneSignal')) {
          indexedDB.deleteDatabase(db.name);
        }
      }
    }).catch(() => {
      // 에러 무시
    });

    // 6. 즉시 리다이렉트 (setTimeout 제거)
    window.location.href = redirectTo;

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
