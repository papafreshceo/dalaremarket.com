import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * CSRF 토큰 생성
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * CSRF 토큰 검증 (Double Submit Cookie 패턴)
 * @param request - NextRequest 객체
 * @returns 검증 성공 여부
 */
export function verifyCsrfToken(request: NextRequest): boolean {
  // GET, HEAD, OPTIONS 요청은 CSRF 검증 제외
  const method = request.method;
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return true;
  }

  // 쿠키에서 토큰 가져오기
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;

  // 헤더에서 토큰 가져오기
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  // 둘 다 존재하지 않으면 실패
  if (!cookieToken || !headerToken) {
    return false;
  }

  // 토큰 비교 (timing attack 방지를 위한 constant-time 비교)
  return crypto.timingSafeEqual(
    Buffer.from(cookieToken),
    Buffer.from(headerToken)
  );
}

/**
 * CSRF 토큰을 쿠키에 설정
 */
export function setCsrfToken(response: NextResponse, token: string): void {
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // JavaScript에서 읽을 수 있도록 허용
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 24시간
  });
}

/**
 * 미들웨어에서 CSRF 토큰 자동 생성 및 설정
 */
export function handleCsrfToken(request: NextRequest, response: NextResponse): NextResponse {
  // 기존 토큰 확인
  const existingToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;

  // 없으면 새로 생성
  if (!existingToken) {
    const newToken = generateCsrfToken();
    setCsrfToken(response, newToken);
  }

  return response;
}

/**
 * API 라우트에서 사용할 CSRF 검증 헬퍼
 */
export function requireCsrfToken(request: NextRequest): NextResponse | null {
  if (!verifyCsrfToken(request)) {
    return NextResponse.json(
      {
        success: false,
        error: 'CSRF token validation failed. Please refresh the page and try again.',
      },
      { status: 403 }
    );
  }

  return null; // 검증 성공
}
