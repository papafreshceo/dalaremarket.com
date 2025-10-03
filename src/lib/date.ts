// src/lib/date.ts
/**
 * 한국 날짜/시간 유틸리티
 */

export const KOREA_TIMEZONE = 'Asia/Seoul';
export const KOREA_LOCALE = 'ko-KR';

export function getKoreanTime(date?: Date | string): Date {
  const inputDate = date ? new Date(date) : new Date();
  return new Date(inputDate.toLocaleString('en-US', { timeZone: KOREA_TIMEZONE }));
}

export function formatDate(date: Date | string, format?: 'short' | 'long' | 'full'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const options: Intl.DateTimeFormatOptions = {
    timeZone: KOREA_TIMEZONE,
    year: 'numeric',
    month: format === 'short' ? 'numeric' : 'long',
    day: 'numeric',
    ...(format === 'full' && { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })
  };

  return new Intl.DateTimeFormat(KOREA_LOCALE, options).format(d);
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat(KOREA_LOCALE, {
    timeZone: KOREA_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(d);
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat(KOREA_LOCALE, {
    timeZone: KOREA_TIMEZONE,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(d);
}

export function getRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = getKoreanTime();
  const diff = now.getTime() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;
  if (days < 30) return `${Math.floor(days / 7)}주 전`;
  return `${Math.floor(days / 30)}개월 전`;
}

export function toDateString(date: Date | string): string {
  const d = getKoreanTime(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function toDateTimeLocal(date: Date | string): string {
  const d = getKoreanTime(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}