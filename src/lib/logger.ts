/**
 * 환경별 로깅 유틸리티
 *
 * 프로덕션 환경에서는 민감한 정보를 로그에 남기지 않습니다.
 * 개발 환경에서만 상세한 로그를 출력합니다.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment: boolean;
  private isProduction: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  /**
   * 민감한 필드를 마스킹 처리
   */
  private sanitize(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'api_key',
      'apiKey',
      'accessToken',
      'refreshToken',
      'authorization',
      'cookie',
      'session',
      'private_key',
      'privateKey',
      'credit_card',
      'creditCard',
      'ssn',
      'phone',
      'email',
      'address',
      'birth',
      'bank_account',
      'bankAccount',
    ];

    const sanitized = Array.isArray(data) ? [...data] : { ...data };

    for (const key in sanitized) {
      const lowerKey = key.toLowerCase();

      // 민감한 필드는 마스킹
      if (sensitiveFields.some(field => lowerKey.includes(field))) {
        sanitized[key] = '***REDACTED***';
      }
      // 중첩 객체도 재귀적으로 처리
      else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitize(sanitized[key]);
      }
    }

    return sanitized;
  }

  /**
   * 로그 포맷팅
   */
  private format(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    if (context) {
      const sanitizedContext = this.sanitize(context);
      return `${prefix} ${message} ${JSON.stringify(sanitizedContext)}`;
    }

    return `${prefix} ${message}`;
  }

  /**
   * DEBUG 레벨 (개발 환경에서만 출력)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(this.format('debug', message, context));
    }
  }

  /**
   * INFO 레벨 (개발 환경에서만 출력)
   */
  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.info(this.format('info', message, context));
    }
  }

  /**
   * WARN 레벨 (모든 환경에서 출력)
   */
  warn(message: string, context?: LogContext): void {
    console.warn(this.format('warn', message, context));
  }

  /**
   * ERROR 레벨 (모든 환경에서 출력, 민감한 정보는 마스킹)
   */
  error(message: string, error?: Error | any, context?: LogContext): void {
    const errorInfo = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: this.isDevelopment ? error.stack : undefined, // 스택은 개발 환경에서만
    } : error;

    console.error(this.format('error', message, {
      ...context,
      error: errorInfo,
    }));
  }

  /**
   * API 요청 로그 (개발 환경에서만)
   */
  apiRequest(method: string, path: string, context?: LogContext): void {
    this.debug(`API Request: ${method} ${path}`, context);
  }

  /**
   * API 응답 로그 (개발 환경에서만)
   */
  apiResponse(method: string, path: string, status: number, context?: LogContext): void {
    this.debug(`API Response: ${method} ${path} - ${status}`, context);
  }

  /**
   * 데이터베이스 쿼리 로그 (개발 환경에서만)
   */
  dbQuery(operation: string, table: string, context?: LogContext): void {
    this.debug(`DB Query: ${operation} on ${table}`, context);
  }

  /**
   * 보안 이벤트 로그 (모든 환경에서 기록)
   */
  security(event: string, context?: LogContext): void {
    // 프로덕션에서도 보안 이벤트는 기록하되, 민감한 정보는 제거
    const sanitizedContext = this.sanitize(context);
    console.warn(this.format('warn', `SECURITY: ${event}`, sanitizedContext));
  }

  /**
   * 성능 측정 시작
   */
  startTimer(label: string): () => void {
    if (!this.isDevelopment) {
      return () => {}; // 프로덕션에서는 아무것도 안함
    }

    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.debug(`Timer: ${label}`, { duration: `${duration}ms` });
    };
  }
}

// 싱글톤 인스턴스
const logger = new Logger();

export default logger;

// 타입 export
export type { LogLevel, LogContext };
