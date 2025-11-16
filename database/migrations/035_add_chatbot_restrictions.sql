-- 035_add_chatbot_restrictions.sql
-- 챗봇에서 공개하지 말아야 할 정보 설정 추가

-- chatbot_settings 테이블에 제한 사항 컬럼 추가
ALTER TABLE chatbot_settings
ADD COLUMN IF NOT EXISTS restricted_info JSONB DEFAULT '{
  "hide_raw_materials": true,
  "show_option_products": true,
  "hide_pricing": false,
  "hide_personal_info": true,
  "hide_admin_info": true,
  "hide_management_systems": [
    "구매관리",
    "농가관리",
    "고객관리",
    "거래처관리",
    "지출관리",
    "근로자관리",
    "전자문서",
    "업무계획",
    "셀러계정관리"
  ]
}'::jsonb;

-- 제한 사항 설명 컬럼 추가
ALTER TABLE chatbot_settings
ADD COLUMN IF NOT EXISTS restriction_message TEXT DEFAULT '해당 정보는 전화 문의로만 안내드립니다. 010-2688-1388로 연락주세요.';

COMMENT ON COLUMN chatbot_settings.restricted_info IS '챗봇이 공개하지 말아야 할 정보 설정 (JSON)';
COMMENT ON COLUMN chatbot_settings.restriction_message IS '제한된 정보 요청 시 표시할 메시지';
