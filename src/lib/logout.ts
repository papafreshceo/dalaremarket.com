import { createClient } from '@/lib/supabase/client';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

/**
 * 통합 로그아웃 함수
 * - OneSignal Player ID 비활성화
 * - Supabase 인증 로그아웃
 * - 서버 세션 정리
 */
export async function logout(router: AppRouterInstance, redirectTo: string = '/') {
  try {
    const supabase = createClient();

    // 1. Supabase 클라이언트 로그아웃
    await supabase.auth.signOut();

    // 2. OneSignal Player ID 비활성화 (백그라운드 처리, 에러 무시)
    handleOneSignalLogout().catch(err =>
      console.warn('OneSignal logout background error:', err)
    );

    // 3. 완전한 페이지 새로고침으로 이동 (중요!)
    // router.push()가 아닌 window.location.href 사용
    window.location.href = redirectTo;
    
    return { success: true };
  } catch (error) {
    console.error('로그아웃 중 오류:', error);
    // 오류 발생 시에도 강제 새로고침
    window.location.href = redirectTo;
    return { success: false, error };
  }
}

/**
 * OneSignal 로그아웃 처리 (별도 함수로 분리)
 */
async function handleOneSignalLogout() {
  try {
    // 클라이언트 SDK 로그아웃만 수행 (API 호출 제거)
    if (window.OneSignal) {
      await window.OneSignal.logout();
    }
    // Player ID 매핑 제거 API 호출 제거 (CSRF 에러 방지)
  } catch (e: any) {
    // OneSignal 관련 에러는 로그아웃 전체를 막지 않도록 경고만 출력
    console.warn('OneSignal logout warning:', e.message);
  }
}
