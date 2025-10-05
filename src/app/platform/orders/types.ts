export interface Order {
  id: number;
  orderNo: string;
  products: string;
  amount: number;
  quantity: number;
  status: 'registered' | 'confirmed' | 'preparing' | 'shipped' | 'cancelRequested' | 'cancelled';
  date: string;
  registeredAt?: string;
  confirmedAt?: string;
  shippedAt?: string;
  cancelRequestedAt?: string;
  cancelledAt?: string;
  paymentMethod?: string;
  trackingNo?: string;
  expectedDelivery?: string;
  cancelReason?: string;
}

export interface StatusConfig {
  label: string;
  color: string;
  bg: string;
}

export interface StatsData {
  status: Order['status'];
  count: number;
  bgGradient: string;
}

export type Tab = '대시보드' | '발주서등록' | '정산관리';
