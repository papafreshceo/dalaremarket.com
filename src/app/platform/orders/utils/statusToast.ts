// src/app/platform/orders/utils/statusToast.ts
import toast from 'react-hot-toast';

type OrderStatus = 'registered' | 'confirmed' | 'preparing' | 'shipped' | 'cancelRequested' | 'cancelled' | 'refunded';

// 상태별 색상 및 그라데이션 매핑
const statusStyles: Record<OrderStatus, { gradient: string; shadowColor: string }> = {
  registered: {
    gradient: 'linear-gradient(135deg, rgba(37, 99, 235, 0.85) 0%, rgba(96, 165, 250, 0.85) 100%)',
    shadowColor: 'rgba(37, 99, 235, 0.25)',
  },
  confirmed: {
    gradient: 'linear-gradient(135deg, rgba(124, 58, 237, 0.85) 0%, rgba(167, 139, 250, 0.85) 100%)',
    shadowColor: 'rgba(124, 58, 237, 0.25)',
  },
  preparing: {
    gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.85) 0%, rgba(251, 191, 36, 0.85) 100%)',
    shadowColor: 'rgba(245, 158, 11, 0.25)',
  },
  shipped: {
    gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.85) 0%, rgba(52, 211, 153, 0.85) 100%)',
    shadowColor: 'rgba(16, 185, 129, 0.25)',
  },
  cancelRequested: {
    gradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.85) 0%, rgba(248, 113, 113, 0.85) 100%)',
    shadowColor: 'rgba(239, 68, 68, 0.25)',
  },
  cancelled: {
    gradient: 'linear-gradient(135deg, rgba(107, 114, 128, 0.85) 0%, rgba(156, 163, 175, 0.85) 100%)',
    shadowColor: 'rgba(107, 114, 128, 0.25)',
  },
  refunded: {
    gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.85) 0%, rgba(52, 211, 153, 0.85) 100%)',
    shadowColor: 'rgba(16, 185, 129, 0.25)',
  },
};

/**
 * 상태별 색상을 가진 토스트 메시지 표시
 * @param status - 주문 상태 (토스트 색상 결정)
 * @param message - 표시할 메시지
 * @param duration - 표시 시간 (ms, 기본값: 2000)
 */
export function showStatusToast(
  status: OrderStatus,
  message: string,
  duration: number = 2000
) {
  const styles = statusStyles[status];

  return toast.success(message, {
    duration,
    position: 'top-center',
    style: {
      background: styles.gradient,
      backdropFilter: 'blur(10px)',
      color: 'white',
      padding: '14px 28px',
      borderRadius: '12px',
      fontSize: '15px',
      fontWeight: '600',
      boxShadow: `0 8px 24px ${styles.shadowColor}, 0 2px 8px ${styles.shadowColor}`,
      border: 'none',
    },
  });
}

/**
 * 에러 토스트 메시지 표시
 * @param message - 표시할 에러 메시지
 * @param duration - 표시 시간 (ms, 기본값: 3000)
 */
export function showErrorToast(message: string, duration: number = 3000) {
  return toast.error(message, {
    duration,
    position: 'top-center',
    style: {
      background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.85) 0%, rgba(248, 113, 113, 0.85) 100%)',
      backdropFilter: 'blur(10px)',
      color: 'white',
      padding: '14px 28px',
      borderRadius: '12px',
      fontSize: '15px',
      fontWeight: '600',
      boxShadow: '0 8px 24px rgba(239, 68, 68, 0.25), 0 2px 8px rgba(239, 68, 68, 0.25)',
      border: 'none',
    },
  });
}

/**
 * 성공 토스트 메시지 표시
 * @param message - 표시할 성공 메시지
 * @param duration - 표시 시간 (ms, 기본값: 3000)
 */
export function showSuccessToast(message: string, duration: number = 3000) {
  return toast.success(message, {
    duration,
    position: 'top-center',
    style: {
      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.85) 0%, rgba(52, 211, 153, 0.85) 100%)',
      backdropFilter: 'blur(10px)',
      color: 'white',
      padding: '14px 28px',
      borderRadius: '12px',
      fontSize: '15px',
      fontWeight: '600',
      boxShadow: '0 8px 24px rgba(16, 185, 129, 0.25), 0 2px 8px rgba(16, 185, 129, 0.25)',
      border: 'none',
    },
  });
}
