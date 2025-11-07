/**
 * Next.js Middleware
 *
 * 모든 요청에 대해 실행되는 전역 미들웨어
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 🔒 보안 헤더 추가 (추가 레이어)
  response.headers.set('X-Robots-Tag', 'index, follow');

  // API 요청에 대한 추가 보안 헤더
  if (request.nextUrl.pathname.startsWith('/api')) {
    response.headers.set('Cache-Control', 'no-store, max-age=0');
  }

  // 로깅 (프로덕션에서는 필요시 제거)
  if (process.env.NODE_ENV === 'development') {
    const timestamp = new Date().toISOString();
    const method = request.method;
    const path = request.nextUrl.pathname;
    console.log(`[${timestamp}] ${method} ${path}`);
  }

  return response;
}

// Middleware가 실행될 경로 설정
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
