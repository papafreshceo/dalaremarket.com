import { Resend } from 'resend';

// Resend 클라이언트 초기화
// 빌드 타임에도 에러가 나지 않도록 fallback 제공
export const resend = new Resend(process.env.RESEND_API_KEY || 'dummy_key_for_build');

// 발신자 정보
export const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';
export const FROM_NAME = process.env.FROM_NAME || '달래마켓';

// 앱 URL
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// 테스트 모드 설정
export const isTestMode = process.env.EMAIL_TEST_MODE === 'true';
export const testEmail = process.env.TEST_EMAIL;

// 테스트 모드 체크
if (isTestMode && !testEmail) {
  console.warn('⚠️  EMAIL_TEST_MODE가 활성화되어 있지만 TEST_EMAIL이 설정되지 않았습니다.');
}

// From 주소 포맷
export const getFromAddress = () => `${FROM_NAME} <${FROM_EMAIL}>`;
