/**
 * Simple in-memory rate limiter
 * For production, consider using Redis-based solution like @upstash/ratelimit
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private requests: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // 주기적으로 만료된 항목 정리 (5분마다)
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Rate limit 체크
   * @param identifier - IP 주소, 사용자 ID 등 고유 식별자
   * @param maxRequests - 윈도우 내 최대 요청 수
   * @param windowMs - 시간 윈도우 (밀리초)
   * @returns { success: boolean, remaining: number, resetTime: number }
   */
  check(
    identifier: string,
    maxRequests: number = 10,
    windowMs: number = 60 * 1000 // 기본 1분
  ): { success: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const entry = this.requests.get(identifier);

    // 항목이 없거나 시간 윈도우가 만료됨 → 새로 생성
    if (!entry || now > entry.resetTime) {
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + windowMs,
      };
      this.requests.set(identifier, newEntry);

      return {
        success: true,
        remaining: maxRequests - 1,
        resetTime: newEntry.resetTime,
      };
    }

    // 한도 초과
    if (entry.count >= maxRequests) {
      return {
        success: false,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }

    // 카운트 증가
    entry.count++;
    this.requests.set(identifier, entry);

    return {
      success: true,
      remaining: maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  /**
   * 만료된 항목 정리
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.requests.entries()) {
      if (now > entry.resetTime) {
        this.requests.delete(key);
      }
    }
  }

  /**
   * 특정 식별자의 rate limit 초기화
   */
  reset(identifier: string): void {
    this.requests.delete(identifier);
  }

  /**
   * 인스턴스 정리
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.requests.clear();
  }
}

// 싱글톤 인스턴스
const rateLimiter = new RateLimiter();

export default rateLimiter;

/**
 * API Route에서 사용할 간편한 헬퍼 함수
 */
export function rateLimit(
  identifier: string,
  options: {
    maxRequests?: number;
    windowMs?: number;
  } = {}
) {
  const { maxRequests = 10, windowMs = 60 * 1000 } = options;
  return rateLimiter.check(identifier, maxRequests, windowMs);
}

/**
 * IP 주소 추출 헬퍼
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  // 프록시 환경에서 첫 번째 IP를 반환
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  return realIp || 'unknown';
}
