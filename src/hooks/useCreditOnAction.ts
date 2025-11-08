import { useState } from 'react';

/**
 * 실행 버튼 클릭 시 크레딧 차감 훅
 * billing_type이 'on_action'인 도구에서 사용
 *
 * 사용 예시:
 * const { executeWithCredit, isProcessing } = useCreditOnAction('order-integration');
 *
 * const handleIntegrate = async () => {
 *   const canProceed = await executeWithCredit('integrate'); // buttonId 전달
 *   if (!canProceed) return;
 *
 *   // 실제 통합 로직 실행...
 * }
 *
 * @param toolId - 도구 ID
 */
export function useCreditOnAction(toolId: string) {
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * 크레딧 차감 후 작업 실행
   * @param buttonId - 버튼 ID (선택사항, action_buttons에 여러 버튼이 있을 경우 필수)
   * @returns 실행 가능 여부
   */
  const executeWithCredit = async (buttonId?: string): Promise<boolean> => {
    if (isProcessing) return false;

    setIsProcessing(true);

    try {
      // 크레딧 차감 API 호출
      const response = await fetch('/api/user/use-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ toolId, buttonId }),
      });

      const data = await response.json();

      if (!data.success) {
        alert(data.error || '크레딧 차감에 실패했습니다.');
        return false;
      }

      // 성공
      return true;
    } catch (error) {
      console.error('Error using credits:', error);
      alert('크레딧 차감 중 오류가 발생했습니다.');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    executeWithCredit,
    isProcessing,
  };
}
