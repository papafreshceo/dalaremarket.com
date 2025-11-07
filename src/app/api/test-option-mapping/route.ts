import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { enrichOrdersWithOptionInfo } from '@/lib/order-utils';

export async function GET() {
  const supabase = await createClient();

  // 1. option_products에서 데이터 조회
  const { data: options, error: optError } = await supabase
    .from('option_products')
    .select('option_name, seller_supply_price, shipping_entity, invoice_entity, vendor_name')
    .limit(3);

  if (optError) {
    return NextResponse.json({ error: 'option_products 조회 실패', details: optError });
  }

  if (!options || options.length === 0) {
    return NextResponse.json({ error: 'option_products에 데이터가 없습니다' });
  }

  // 2. 테스트 주문 생성
  const testOrders = [
    {
      option_name: options[0].option_name,
      quantity: '2',
      recipient_name: '테스트',
      seller_market_name: '쿠팡'
    }
  ];


  // 3. enrichOrdersWithOptionInfo 실행
  const enrichedOrders = await enrichOrdersWithOptionInfo(testOrders);


  return NextResponse.json({
    message: '테스트 성공',
    originalOrder: testOrders[0],
    enrichedOrder: enrichedOrders[0],
    optionProductsData: options[0],
    fieldsAdded: {
      seller_supply_price: enrichedOrders[0].seller_supply_price,
      shipping_source: enrichedOrders[0].shipping_source,
      invoice_issuer: enrichedOrders[0].invoice_issuer,
      vendor_name: enrichedOrders[0].vendor_name,
      settlement_amount: enrichedOrders[0].settlement_amount
    }
  });
}
