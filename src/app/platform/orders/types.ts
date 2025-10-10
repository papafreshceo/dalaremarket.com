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
  // 발주서 업로드 추가 필드
  orderer?: string;
  ordererPhone?: string;
  recipient?: string;
  recipientPhone?: string;
  address?: string;
  deliveryMessage?: string;
  optionName?: string;
  optionCode?: string;
  specialRequest?: string;
  unitPrice?: number; // 공급단가
  supplyPrice?: number; // 공급가 (정산예정금액)
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
