/**
 * Rate Limiting 유틸리티
 *
 * API 요청 속도 제한을 위한 헬퍼 함수들
 */

import { NextRequest, NextResponse } from 'next/server';
import { LRUCache } from 'lru-cache';

// Rate limit 설정
interface RateLimitOptions {
  interval: number;  // 시간 윈도우 (밀리초)
  uniqueTokenPerInterval: number;  // 시간 윈도우당 허용 토큰 수
}

// 캐시 인스턴스들 (서로 다른 제한을 위해 분리)
const caches = new Map<string, LRUCache<string, number>>();

function getCache(name: string, options: RateLimitOptions): LRUCache<string, number> {
  if (!caches.has(name)) {
    caches.set(name, new LRUCache({
      max: options.uniqueTokenPerInterval,
      ttl: options.interval,
    }));
  }
  return caches.get(name)!;
}

/**
 * IP 주소 추출
 */
function getIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  return 'anonymous';
}

/**
 * Rate Limiting 체크
 */
export async function rateLimit(
  request: NextRequest,
  limit: number = 10,
  interval: number = 60000 // 기본 1분
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const ip = getIP(request);
  const cache = getCache('default', {
    interval,
    uniqueTokenPerInterval: 500
  });

  const tokenCount = cache.get(ip) || 0;

  if (tokenCount >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: Date.now() + interval
    };
  }

  cache.set(ip, tokenCount + 1);

  return {
    success: true,
    limit,
    remaining: limit - tokenCount - 1,
    reset: Date.now() + interval
  };
}

/**
 * Rate Limiting 응답 헤더 추가
 */
export function addRateLimitHeaders(
  response: NextResponse,
  result: { limit: number; remaining: number; reset: number }
): NextResponse {
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', new Date(result.reset).toISOString());
  return response;
}

/**
 * Rate Limiting 미들웨어 (API 라우트용)
 */
export async function withRateLimit(
  request: NextRequest,
  handler: () => Promise<NextResponse>,
  limit: number = 10,
  interval: number = 60000
): Promise<NextResponse> {
  const result = await rateLimit(request, limit, interval);

  if (!result.success) {
    const response = NextResponse.json(
      {
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((result.reset - Date.now()) / 1000)
      },
      { status: 429 }
    );
    return addRateLimitHeaders(response, result);
  }

  const response = await handler();
  return addRateLimitHeaders(response, result);
}

/**
 * 엄격한 Rate Limiting (파일 업로드, 결제 등)
 */
export async function strictRateLimit(request: NextRequest): Promise<{ success: boolean; error?: NextResponse }> {
  const result = await rateLimit(request, 5, 60000); // 1분에 5회

  if (!result.success) {
    return {
      success: false,
      error: addRateLimitHeaders(
        NextResponse.json(
          { error: 'Too many requests. Please wait before trying again.' },
          { status: 429 }
        ),
        result
      )
    };
  }

  return { success: true };
}

/**
 * 관대한 Rate Limiting (조회 API)
 */
export async function lenientRateLimit(request: NextRequest): Promise<{ success: boolean; error?: NextResponse }> {
  const result = await rateLimit(request, 60, 60000); // 1분에 60회

  if (!result.success) {
    return {
      success: false,
      error: addRateLimitHeaders(
        NextResponse.json(
          { error: 'Too many requests.' },
          { status: 429 }
        ),
        result
      )
    };
  }

  return { success: true };
}
