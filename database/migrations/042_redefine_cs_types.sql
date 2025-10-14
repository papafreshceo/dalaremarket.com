-- =====================================================
-- CS 유형 재정의 (8개로 정리)
-- =====================================================
-- 작성일: 2025-10-14
-- 설명: CS 유형을 실무에 맞게 8개로 정리
-- =====================================================

-- 1. 기존 데이터 삭제
DELETE FROM cs_types;

-- 2. 새로운 CS 유형 8개 삽입
INSERT INTO cs_types (code, name, description, display_order, is_active) VALUES
  ('site_refund', '사이트 환불', '사이트 결제 환불 처리', 1, true),
  ('exchange', '교환', '상품 교환 처리', 2, true),
  ('return', '반품', '상품 반품 처리', 3, true),
  ('partial_refund', '부분 환불', '일부 금액 환불', 4, true),
  ('full_refund', '전체 환불', '전체 금액 환불', 5, true),
  ('partial_resend', '부분 재발송', '일부 상품 재발송', 6, true),
  ('full_resend', '전체 재발송', '전체 상품 재발송', 7, true),
  ('other_action', '기타 조치', '기타 고객 서비스 조치', 8, true)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active;

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'CS 유형 재정의 완료 (8개)';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '1. 사이트 환불 (site_refund)';
  RAISE NOTICE '2. 교환 (exchange)';
  RAISE NOTICE '3. 반품 (return)';
  RAISE NOTICE '4. 부분 환불 (partial_refund)';
  RAISE NOTICE '5. 전체 환불 (full_refund)';
  RAISE NOTICE '6. 부분 재발송 (partial_resend)';
  RAISE NOTICE '7. 전체 재발송 (full_resend)';
  RAISE NOTICE '8. 기타 조치 (other_action)';
  RAISE NOTICE '=================================================';
END $$;
