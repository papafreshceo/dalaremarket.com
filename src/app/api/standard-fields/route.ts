import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/standard-fields
 * integrated_orders 테이블의 컬럼 목록 반환
 * field_45~50은 DB의 표준필드 설정에서 실제 한글명을 가져옴
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // 기본 필드 (field_1 ~ field_44)
    // SearchTab.tsx의 fieldToColumnMap과 동일한 순서
    const baseFields = [
      { value: 'market_name', label: '마켓명' },              // field_1
      { value: 'sequence_number', label: '연번' },            // field_2
      { value: 'payment_date', label: '결제일' },             // field_3
      { value: 'order_number', label: '주문번호' },           // field_4
      { value: 'buyer_name', label: '주문자' },               // field_5
      { value: 'buyer_phone', label: '주문자전화번호' },      // field_6
      { value: 'recipient_name', label: '수령인' },           // field_7
      { value: 'recipient_phone', label: '수령인전화번호' },  // field_8
      { value: 'recipient_address', label: '주소' },          // field_9
      { value: 'delivery_message', label: '배송메세지' },     // field_10
      { value: 'option_name', label: '옵션명' },              // field_11
      { value: 'quantity', label: '수량' },                   // field_12
      { value: 'market_check', label: '마켓' },               // field_13
      { value: 'confirmation', label: '확인' },               // field_14
      { value: 'special_request', label: '특이/요청사항' },   // field_15
      { value: 'shipping_request_date', label: '발송요청일' }, // field_16
      { value: 'option_code', label: '옵션코드' },            // field_17
      { value: 'seller_id', label: '셀러ID' },                // field_18
      { value: 'seller_supply_price', label: '셀러공급가' },  // field_19
      { value: 'shipping_source', label: '출고처' },          // field_20
      { value: 'invoice_issuer', label: '송장주체' },         // field_21
      { value: 'vendor_name', label: '벤더사' },              // field_22
      { value: 'shipping_location_name', label: '발송지명' }, // field_23
      { value: 'shipping_location_address', label: '발송지주소' }, // field_24
      { value: 'shipping_location_contact', label: '발송지연락처' }, // field_25
      { value: 'shipping_cost', label: '출고비용' },          // field_26
      { value: 'settlement_amount', label: '정산예정금액' },  // field_27
      { value: 'settlement_target_amount', label: '정산대상금액' }, // field_28
      { value: 'product_amount', label: '상품금액' },         // field_29
      { value: 'final_payment_amount', label: '최종결제금액' }, // field_30
      { value: 'discount_amount', label: '할인금액' },        // field_31
      { value: 'platform_discount', label: '마켓부담할인금액' }, // field_32
      { value: 'seller_discount', label: '판매자할인쿠폰할인' }, // field_33
      { value: 'buyer_coupon_discount', label: '구매쿠폰적용금액' }, // field_34
      { value: 'coupon_discount', label: '쿠폰할인금액' },    // field_35
      { value: 'other_support_discount', label: '기타지원금할인금' }, // field_36
      { value: 'commission_1', label: '수수료1' },            // field_37
      { value: 'commission_2', label: '수수료2' },            // field_38
      { value: 'sell_id', label: '판매아이디' },             // field_39
      { value: 'separate_shipping', label: '분리배송 Y/N' },  // field_40
      { value: 'delivery_fee', label: '택배비' },             // field_41
      { value: 'shipped_date', label: '발송일(송장입력일)' }, // field_42
      { value: 'courier_company', label: '택배사' },          // field_43
      { value: 'tracking_number', label: '송장번호' },        // field_44
    ];

    // 표준필드 설정에서 field_45~50의 한글명 가져오기
    const { data: standardFieldsData, error } = await supabase
      .from('mapping_settings_standard_fields')
      .select('field_45, field_46, field_47, field_48, field_49, field_50')
      .eq('market_name', '표준필드')
      .single();

    const additionalFields = [];
    if (!error && standardFieldsData) {
      // field_45~50의 실제 한글명을 사용 (없으면 기본값)
      for (let i = 45; i <= 50; i++) {
        const fieldKey = `field_${i}`;
        const fieldValue = standardFieldsData[fieldKey];
        additionalFields.push({
          value: fieldKey,
          label: fieldValue && fieldValue.trim() ? fieldValue.trim() : `추가필드${i - 44}`,
        });
      }
    } else {
      // DB 조회 실패 시 기본값 사용
      for (let i = 45; i <= 50; i++) {
        additionalFields.push({
          value: `field_${i}`,
          label: `추가필드${i - 44}`,
        });
      }
    }

    const fields = [...baseFields, ...additionalFields];

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
