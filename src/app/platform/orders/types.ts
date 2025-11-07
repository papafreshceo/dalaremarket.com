export interface Order {
  id: number;
  orderNo: string; // 시스템 발주번호 (발주확정 시 생성)
  orderNumber?: string; // 셀러의 원본 주문번호
  products: string;
  amount: number;
  quantity: number;
  status: 'registered' | 'confirmed' | 'preparing' | 'shipped' | 'cancelRequested' | 'cancelled' | 'refunded';
  date: string;
  registeredAt?: string;
  confirmedAt?: string;
  shippedAt?: string;
  shippedDate?: string; // 발송일
  courier?: string; // 택배사
  cancelRequestedAt?: string;
  cancelledAt?: string;
  cancelApprovedAt?: string; // 취소승인일시
  orderConfirmedAt?: string; // 주문확정일시
  refundAmount?: number; // 환불액
  refundedAt?: string; // 환불일
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
  option_name?: string; // snake_case 버전 (DB/API에서 사용)
  optionCode?: string;
  specialRequest?: string;
  unitPrice?: number; // 공급단가
  supplyPrice?: number; // 공급가 (정산예정금액)
  marketName?: string; // 마켓명
  sellerMarketName?: string; // 셀러 마켓명
  priceUpdatedAt?: string; // 공급가 갱신 일시
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

export type Tab = '대시보드' | '발주서등록' | '건별등록' | '정산관리' | '옵션명매핑' | '판매자정보' | '지갑';

export interface OptionMapping {
  id: number;
  seller_id: string;
  user_option_name: string;
  site_option_name: string;
  created_at: string;
  updated_at: string;
}
