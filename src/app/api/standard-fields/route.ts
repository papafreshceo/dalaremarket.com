import { NextResponse } from 'next/server';

/**
 * GET /api/standard-fields
 * integrated_orders 테이블의 컬럼 목록 반환
 */
export async function GET() {
  try {
    // integrated_orders 테이블의 필드와 한글 라벨 (DB 컬럼 순서대로)
    const fields = [
      { value: 'sheet_date', label: '주문통합일' },
      { value: 'market_name', label: '마켓명' },
      { value: 'sequence_number', label: '연번' },
      { value: 'payment_date', label: '결제일' },
      { value: 'order_number', label: '주문번호' },
      { value: 'buyer_name', label: '주문자' },
      { value: 'buyer_phone', label: '주문자전화번호' },
      { value: 'recipient_name', label: '수령인' },
      { value: 'recipient_phone', label: '수령인전화번호' },
      { value: 'recipient_address', label: '주소' },
      { value: 'delivery_message', label: '배송메세지' },
      { value: 'option_name', label: '옵션명' },
      { value: 'quantity', label: '수량' },
      { value: 'market_check', label: '마켓' },
      { value: 'confirmation', label: '확인' },
      { value: 'special_request', label: '특이/요청사항' },
      { value: 'shipping_request_date', label: '발송요청일' },
      { value: 'seller_id', label: '셀러' },
      { value: 'seller_supply_price', label: '셀러공급가' },
      { value: 'shipping_source', label: '출고처' },
      { value: 'invoice_issuer', label: '송장주체' },
      { value: 'vendor_name', label: '벤더사' },
      { value: 'shipping_location_name', label: '발송지명' },
      { value: 'shipping_location_address', label: '발송지주소' },
      { value: 'shipping_location_contact', label: '발송지연락처' },
      { value: 'shipping_cost', label: '출고비용' },
      { value: 'settlement_amount', label: '정산예정금액' },
      { value: 'settlement_target_amount', label: '정산대상금액' },
      { value: 'product_amount', label: '상품금액' },
      { value: 'final_payment_amount', label: '최종결제금액' },
      { value: 'discount_amount', label: '할인금액' },
      { value: 'platform_discount', label: '마켓부담할인금액' },
      { value: 'seller_discount', label: '판매자할인쿠폰할인' },
      { value: 'buyer_coupon_discount', label: '구매쿠폰적용금액' },
      { value: 'coupon_discount', label: '쿠폰할인금액' },
      { value: 'other_support_discount', label: '기타지원금할인금' },
      { value: 'commission_1', label: '수수료1' },
      { value: 'commission_2', label: '수수료2' },
      { value: 'sell_id', label: '판매아이디' },
      { value: 'shipping_status', label: '발송상태' },
      { value: 'courier_company', label: '택배사' },
      { value: 'tracking_number', label: '송장번호' },
      { value: 'shipped_date', label: '발송일(송장입력일)' },
      { value: 'memo', label: '메모' },
    ];

    // DB 컬럼 순서 그대로 반환 (정렬 안 함)
    return NextResponse.json({
      success: true,
      data: fields,
    });
  } catch (error: any) {
    console.error('GET /api/standard-fields 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
