-- 034_create_chatbot_settings.sql
-- 챗봇 설정 테이블 생성

CREATE TABLE IF NOT EXISTS chatbot_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 기본 설정
  is_enabled BOOLEAN DEFAULT true,
  position VARCHAR(20) DEFAULT 'bottom-right', -- 'bottom-right', 'bottom-left'
  theme_color VARCHAR(7) DEFAULT '#16a34a', -- 헥스 컬러 코드

  -- 환영 메시지
  welcome_message TEXT DEFAULT '안녕하세요. 달래마켓 B2B입니다.\n\n상품 문의, 시즌 정보, 배송 등 무엇이든 물어보세요.',

  -- 빠른 답변 버튼 (JSON 배열)
  quick_replies JSONB DEFAULT '[
    {"label": "가격 문의", "message": "가격 알려주세요"},
    {"label": "배송 안내", "message": "배송 정보 알려주세요"}
  ]'::jsonb,

  -- AI 설정
  ai_enabled BOOLEAN DEFAULT true,
  gemini_api_key TEXT,
  ai_model VARCHAR(100) DEFAULT 'gemini-2.0-flash-lite',
  max_tokens INTEGER DEFAULT 500,
  daily_ai_limit INTEGER DEFAULT 1500,

  -- 라우팅 비율 (키워드:데이터:AI = 70:20:10)
  keyword_match_priority INTEGER DEFAULT 70,
  data_query_priority INTEGER DEFAULT 20,
  ai_query_priority INTEGER DEFAULT 10,

  -- 자주 묻는 질문 (FAQ) JSON
  faqs JSONB DEFAULT '[]'::jsonb,

  -- 회사 정보
  company_name VARCHAR(100) DEFAULT '달래마켓',
  company_phone VARCHAR(20) DEFAULT '010-2688-1388',
  business_hours VARCHAR(100) DEFAULT '평일 09:00 - 18:00',

  -- 운영 설정
  offline_message TEXT DEFAULT '현재 상담 시간이 아닙니다. 평일 09:00 - 18:00에 문의해주세요.',
  error_message TEXT DEFAULT '죄송합니다. 일시적인 오류가 발생했습니다.',

  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 기본 설정 데이터 삽입
INSERT INTO chatbot_settings (
  id,
  is_enabled,
  welcome_message,
  gemini_api_key,
  faqs
) VALUES (
  'default'::uuid,
  true,
  '안녕하세요. 달래마켓 B2B입니다.\n\n상품 문의, 시즌 정보, 배송 등 무엇이든 물어보세요.',
  NULL,
  '[
    {
      "question": "배송은 언제 되나요?",
      "keywords": ["배송", "택배", "도착", "언제"],
      "answer": "주문 확인 후 1-2일 내 출하됩니다.\n\n- 수도권: 익일 도착\n- 지방: 2-3일 소요\n- 제주/도서: 3-4일 소요\n\n문의: 010-2688-1388"
    },
    {
      "question": "최소 주문 금액이 있나요?",
      "keywords": ["최소", "주문", "금액", "최저"],
      "answer": "최소 주문 금액은 50,000원입니다.\n\n- 50,000원 이상: 무료 배송\n- 50,000원 미만: 배송비 3,000원\n\n문의: 010-2688-1388"
    },
    {
      "question": "결제 방법은?",
      "keywords": ["결제", "지불", "카드", "현금"],
      "answer": "다양한 결제 방법을 지원합니다.\n\n- 신용카드\n- 계좌이체\n- 무통장입금\n\n문의: 010-2688-1388"
    }
  ]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_chatbot_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_chatbot_settings_updated_at
  BEFORE UPDATE ON chatbot_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_chatbot_settings_updated_at();

-- RLS 비활성화 (관리자만 접근)
ALTER TABLE chatbot_settings DISABLE ROW LEVEL SECURITY;
