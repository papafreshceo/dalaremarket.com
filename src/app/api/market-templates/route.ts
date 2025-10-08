import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // 1. 마켓 기본 설정 가져오기
    const { data: settings, error: settingsError } = await supabase
      .from('mapping_settings')
      .select('*')
      .order('display_order', { ascending: true });

    if (settingsError) throw settingsError;

    // 2. 표준필드 매핑 가져오기
    const { data: fields, error: fieldsError } = await supabase
      .from('mapping_settings_standard_fields')
      .select('*')
      .order('market_name', { ascending: true });

    if (fieldsError) throw fieldsError;

    // 3. 표준필드명 추출 (첫 번째 행에서)
    const standardFieldRow = fields?.find((f: any) => f.market_name === '표준필드');
    const standardFields: string[] = [];
    const standardFieldKeys: string[] = [];

    if (standardFieldRow) {
      for (let i = 1; i <= 43; i++) {
        const fieldKey = `field_${i}`;
        const fieldName = standardFieldRow[fieldKey];
        if (fieldName) {
          standardFieldKeys.push(fieldKey);
          standardFields.push(fieldName);
        }
      }
    }

    // 4. 각 마켓별로 필드 매핑 생성
    const templates = settings?.map((setting: any) => {
      const marketFieldRow = fields?.find((f: any) => f.market_name === setting.market_name);
      const fieldMappings: Record<string, string> = {};

      if (marketFieldRow) {
        standardFieldKeys.forEach((fieldKey, index) => {
          const standardFieldName = standardFields[index];
          const marketFieldName = marketFieldRow[fieldKey];

          if (standardFieldName && marketFieldName) {
            // 표준필드명을 영문 snake_case로 변환
            const standardFieldKey = convertToSnakeCase(standardFieldName);
            fieldMappings[standardFieldKey] = marketFieldName;
          }
        });
      }

      return {
        id: setting.id,
        market_name: setting.market_name,
        initial: setting.market_initial,
        color_rgb: setting.market_color,
        detect_string1: setting.detect_string1,
        detect_string2: setting.detect_string2,
        settlement_method: 'formula',
        settlement_formula: setting.settlement_formula,
        header_row: setting.header_row,
        display_order: setting.display_order,
        field_mappings: fieldMappings,
      };
    }) || [];

    return NextResponse.json({
      success: true,
      data: templates,
    });
  } catch (error: any) {
    console.error('마켓 템플릿 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// 한글 표준필드명을 snake_case로 변환
function convertToSnakeCase(koreanName: string): string {
  const mappings: Record<string, string> = {
    '마켓명': 'market_name',
    '연번': 'sequence_number',
    '결제일': 'payment_date',
    '주문번호': 'order_number',
    '주문자': 'buyer_name',
    '주문자전화번호': 'buyer_phone',
    '수령인': 'recipient_name',
    '수령인전화번호': 'recipient_phone',
    '주소': 'recipient_address',
    '배송메세지': 'delivery_message',
    '옵션명': 'option_name',
    '수량': 'quantity',
    '마켓': 'market',
    '확인': 'confirmation',
    '특이/요청사항': 'special_request',
    '발송요청일': 'shipping_request_date',
    '셀러': 'seller_name',
    '셀러공급가': 'seller_supply_price',
    '출고처': 'warehouse',
    '송장주체': 'invoice_owner',
    '벤더사': 'vendor_company',
    '발송지명': 'shipping_location_name',
    '발송지주소': 'shipping_location_address',
    '발송지연락처': 'shipping_location_phone',
    '출고비용': 'shipping_cost',
    '정산예정금액': 'settlement_amount',
    '정산대상금액': 'settlement_target_amount',
    '상품금액': 'product_amount',
    '최종결제금액': 'final_payment_amount',
    '할인금액': 'discount_amount',
    '마켓부담할인금액': 'platform_discount',
    '판매자할인쿠폰할인': 'seller_discount',
    '구매쿠폰적용금액': 'buyer_coupon_discount',
    '쿠폰할인금액': 'coupon_discount',
    '기타지원금할인금': 'other_support_discount',
    '수수료1': 'commission1',
    '수수료2': 'commission2',
    '판매아이디': 'seller_id',
    '분리배송 Y/N': 'separate_shipping',
    '택배비': 'shipping_fee',
    '발송일(송장입력일)': 'shipping_date',
    '택배사': 'courier_company',
    '송장번호': 'tracking_number',
  };

  return mappings[koreanName] || koreanName.toLowerCase().replace(/\s+/g, '_');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { data, error } = await supabase
      .from('market_upload_templates')
      .insert(body)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('마켓 템플릿 등록 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
