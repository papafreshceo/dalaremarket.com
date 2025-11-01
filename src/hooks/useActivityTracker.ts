'use client';

import { useEffect, useRef } from 'react';

interface UseActivityTrackerOptions {
  enabled?: boolean;
  onRewardClaimed?: (amount: number, newBalance: number) => void;
  onLimitReached?: () => void;
}

/**
 * 페이지 활동 시간 추적 및 캐시 보상 지급 훅
 * - Page Visibility API를 사용하여 포커스 시간만 추적
 * - 1분마다 누적된 시간을 서버에 전송하여 캐시 보상 지급
 */
export function useActivityTracker(options: UseActivityTrackerOptions = {}) {
  const { enabled = true, onRewardClaimed, onLimitReached } = options;

  const accumulatedMinutes = useRef<number>(0); // 누적 분
  const lastActiveTime = useRef<number | null>(null); // 마지막 활성 시간
  const claimIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // 페이지가 활성화될 때
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // 페이지가 보이면 시작 시간 기록
        lastActiveTime.current = Date.now();
      } else {
        // 페이지가 숨겨지면 경과 시간 누적
        if (lastActiveTime.current !== null) {
          const elapsed = (Date.now() - lastActiveTime.current) / 1000 / 60; // 분 단위
          accumulatedMinutes.current += elapsed;
          lastActiveTime.current = null;
        }
      }
    };

    // 포커스 이벤트 리스너
    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        lastActiveTime.current = Date.now();
      }
    };

    const handleBlur = () => {
      if (lastActiveTime.current !== null) {
        const elapsed = (Date.now() - lastActiveTime.current) / 1000 / 60;
        accumulatedMinutes.current += elapsed;
        lastActiveTime.current = null;
      }
    };

    // 초기 상태 설정
    if (document.visibilityState === 'visible') {
      lastActiveTime.current = Date.now();
    }

    // 이벤트 리스너 등록
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    // 1분마다 누적된 시간을 확인하고 지급 요청
    const claimReward = async () => {
      // 현재 활성 시간도 포함
      let totalMinutes = accumulatedMinutes.current;
      if (lastActiveTime.current !== null && document.visibilityState === 'visible') {
        const currentElapsed = (Date.now() - lastActiveTime.current) / 1000 / 60;
        totalMinutes += currentElapsed;
      }

      // 1분 이상 누적되었으면 지급 요청
      if (totalMinutes >= 1) {
        try {
          const response = await fetch('/api/cash/claim-activity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ minutes: totalMinutes })
          });

          const data = await response.json();

          if (data.success) {
            // 성공 시 누적 시간 초기화 및 콜백 호출
            accumulatedMinutes.current = 0;
            if (lastActiveTime.current !== null) {
              lastActiveTime.current = Date.now(); // 시작 시간 재설정
            }

            if (onRewardClaimed) {
              onRewardClaimed(data.amount, data.newBalance);
            }
          } else if (data.limitReached) {
            // 일일 한도 도달
            if (onLimitReached) {
              onLimitReached();
            }
          }
        } catch (error) {
          console.error('활동 보상 지급 실패:', error);
        }
      }
    };

    // 1분마다 지급 체크
    claimIntervalRef.current = setInterval(claimReward, 60000);

    // cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);

      if (claimIntervalRef.current) {
        clearInterval(claimIntervalRef.current);
      }

      // 컴포넌트 언마운트 시 남은 시간 지급 요청
      if (lastActiveTime.current !== null) {
        const elapsed = (Date.now() - lastActiveTime.current) / 1000 / 60;
        accumulatedMinutes.current += elapsed;
      }

      if (accumulatedMinutes.current >= 1) {
        // 비동기 요청은 보내되 결과는 기다리지 않음
        fetch('/api/cash/claim-activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ minutes: accumulatedMinutes.current })
        }).catch(() => {
          // 에러는 무시 (페이지 이탈 시)
        });
      }
    };
  }, [enabled, onRewardClaimed, onLimitReached]);
}
