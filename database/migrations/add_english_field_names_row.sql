-- ===========================
-- 영문필드명 행 추가
-- ===========================
-- mapping_settings_standard_fields 테이블에 영문 필드명 행을 추가하여
-- 한글 표준필드명을 영문 snake_case로 자동 변환할 수 있도록 함

-- 영문필드명 행 추가 (이미 있으면 업데이트)
INSERT INTO mapping_settings_standard_fields (
  market_name,
  field_1, field_2, field_3, field_4, field_5, field_6, field_7, field_8, field_9, field_10,
  field_11, field_12, field_13, field_14, field_15, field_16, field_17, field_18, field_19, field_20,
  field_21, field_22, field_23, field_24, field_25, field_26, field_27, field_28, field_29, field_30,
  field_31, field_32, field_33, field_34, field_35, field_36, field_37, field_38, field_39, field_40,
  field_41, field_42, field_43
) VALUES (
  '영문필드명',
  'market_name', 'sequence_number', 'payment_date', 'order_number', 'buyer_name', 'buyer_phone',
  'recipient_name', 'recipient_phone', 'recipient_address', 'delivery_message',
  'option_name', 'quantity', 'market_seq', 'confirmation', 'special_request', 'shipping_request_date',
  'seller_name', 'seller_supply_price', 'shipping_entity', 'invoice_entity',
  'shipping_vendor_id', 'shipping_location_name', 'shipping_location_address', 'shipping_location_contact',
  'shipping_cost', 'settlement_amount', 'settlement_target_amount', 'product_amount', 'final_payment_amount', 'discount_amount',
  'platform_discount', 'seller_discount', 'buyer_coupon_discount', 'coupon_discount', 'other_support_discount',
  'commission1', 'commission2', 'seller_id', 'separate_shipping', 'shipping_fee',
  'shipping_date', 'courier_company', 'tracking_number'
)
ON CONFLICT (market_name)
DO UPDATE SET
  field_1 = EXCLUDED.field_1,
  field_2 = EXCLUDED.field_2,
  field_3 = EXCLUDED.field_3,
  field_4 = EXCLUDED.field_4,
  field_5 = EXCLUDED.field_5,
  field_6 = EXCLUDED.field_6,
  field_7 = EXCLUDED.field_7,
  field_8 = EXCLUDED.field_8,
  field_9 = EXCLUDED.field_9,
  field_10 = EXCLUDED.field_10,
  field_11 = EXCLUDED.field_11,
  field_12 = EXCLUDED.field_12,
  field_13 = EXCLUDED.field_13,
  field_14 = EXCLUDED.field_14,
  field_15 = EXCLUDED.field_15,
  field_16 = EXCLUDED.field_16,
  field_17 = EXCLUDED.field_17,
  field_18 = EXCLUDED.field_18,
  field_19 = EXCLUDED.field_19,
  field_20 = EXCLUDED.field_20,
  field_21 = EXCLUDED.field_21,
  field_22 = EXCLUDED.field_22,
  field_23 = EXCLUDED.field_23,
  field_24 = EXCLUDED.field_24,
  field_25 = EXCLUDED.field_25,
  field_26 = EXCLUDED.field_26,
  field_27 = EXCLUDED.field_27,
  field_28 = EXCLUDED.field_28,
  field_29 = EXCLUDED.field_29,
  field_30 = EXCLUDED.field_30,
  field_31 = EXCLUDED.field_31,
  field_32 = EXCLUDED.field_32,
  field_33 = EXCLUDED.field_33,
  field_34 = EXCLUDED.field_34,
  field_35 = EXCLUDED.field_35,
  field_36 = EXCLUDED.field_36,
  field_37 = EXCLUDED.field_37,
  field_38 = EXCLUDED.field_38,
  field_39 = EXCLUDED.field_39,
  field_40 = EXCLUDED.field_40,
  field_41 = EXCLUDED.field_41,
  field_42 = EXCLUDED.field_42,
  field_43 = EXCLUDED.field_43;

COMMENT ON TABLE mapping_settings_standard_fields IS '마켓별 표준필드 매핑 (1행: 표준필드명(한글), 2행: 영문필드명, 3행~: 마켓별 매핑값)';
