import { useEffect, useRef, useState } from 'react';

/**
 * 시간당 크레딧 차감 훅
 * billing_type이 'hourly'인 도구에서 사용
 *
 * 사용 예시:
 * const { isActive, remainingMinutes } = useHourlyCredit('margin-calculator', 60, onClose);
 *
 * @param toolId - 도구 ID
 * @param intervalMinutes - 차감 간격 (분)
 * @param onClose - 크레딧 부족 시 모달 닫기 콜백
 */
export function useHourlyCredit(
  toolId: string,
  intervalMinutes: number = 60,
  onClose?: () => void
) {
  const [isActive, setIsActive] = useState(false);
  const [remainingMinutes, setRemainingMinutes] = useState(intervalMinutes);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // 크레딧 차감 함수
  const deductCredit = async () => {
    try {
      const response = await fetch('/api/user/use-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ toolId }),
      });

      const data = await response.json();

      if (!data.success) {
        // 크레딧 부족 시 타이머 중지
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
        }
        setIsActive(false);

        // 모달 닫기
        if (onClose) {
          alert(data.error || '크레딧이 부족하여 도구 사용이 중지됩니다.');
          onClose();
        } else {
          alert(data.error || '크레딧이 부족하여 도구 사용이 중지됩니다.');
        }

        return false;
      }

      // 다음 차감까지 남은 시간 리셋
      setRemainingMinutes(intervalMinutes);
      return true;
    } catch (error) {
      console.error('Error using credits:', error);
      return false;
    }
  };

  // 모달이 열릴 때 시작
  useEffect(() => {
    // 첫 크레딧 차감 및 타이머 시작
    const startTimer = async () => {
      // 첫 차감
      const success = await deductCredit();
      if (!success) return;

      setIsActive(true);

      // 정기 차감 타이머 (intervalMinutes마다)
      timerRef.current = setInterval(async () => {
        await deductCredit();
      }, intervalMinutes * 60 * 1000);

      // 남은 시간 카운트다운 (1분마다)
      countdownRef.current = setInterval(() => {
        setRemainingMinutes((prev) => {
          if (prev <= 1) return intervalMinutes;
          return prev - 1;
        });
      }, 60 * 1000);
    };

    startTimer();

    // 클린업
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [toolId, intervalMinutes]);

  return {
    isActive,
    remainingMinutes,
  };
}
