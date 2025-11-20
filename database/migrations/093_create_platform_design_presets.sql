-- =====================================================
-- platform 디자인 프리셋 테이블 생성
-- =====================================================
-- 작성일: 2025-01-20
-- 설명:
--   관리자가 등록한 디자인 프리셋을 저장
--   모든 사용자가 선택하여 사용 가능
-- =====================================================

-- 1. platform_design_presets 테이블 생성
CREATE TABLE IF NOT EXISTS platform_design_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,

  -- 모든 디자인 설정을 JSONB로 저장
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- 메타 정보
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false, -- 기본 프리셋 여부
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 인덱스 생성
CREATE INDEX idx_platform_design_presets_active ON platform_design_presets(is_active);
CREATE INDEX idx_platform_design_presets_default ON platform_design_presets(is_default);

-- 3. 기본 프리셋 데이터 삽입
INSERT INTO platform_design_presets (name, description, settings, is_default)
VALUES
  (
    'Modern',
    '현대적이고 세련된 디자인',
    '{"colors":{"palette_100":[],"primary":{"base":"#2563eb","opacity":100,"tones":{}},"secondary":{"base":"#10b981","opacity":100,"tones":{}},"success":{"base":"#22c55e","opacity":100,"tones":{}},"warning":{"base":"#f59e0b","opacity":100,"tones":{}},"error":{"base":"#ef4444","opacity":100,"tones":{}},"info":{"base":"#3b82f6","opacity":100,"tones":{}},"neutral":{"base":"#6b7280","opacity":100,"tones":{}},"tone_adjustments":{"saturation":0,"lightness":0,"temperature":0},"preset_tone":"vibrant"},"background":{"light":{"type":"solid","solid":{"color":"#ffffff","opacity":100},"gradient":{"enabled":false,"colors":[],"direction":"to bottom","angle":180}},"medium":{"type":"solid","solid":{"color":"#f3f4f6","opacity":100},"gradient":{"enabled":false,"colors":[],"direction":"to bottom","angle":180}},"dark":{"type":"solid","solid":{"color":"#1f2937","opacity":100},"gradient":{"enabled":false,"colors":[],"direction":"to bottom","angle":180}}},"typography":{"base_size":16,"base_weight":400,"sizes":{},"weights":{},"color":{}},"border":{},"shadow":{},"spacing":{},"animation":{},"layout":{},"components":{}}'::jsonb,
    true
  ),
  (
    'Sharp',
    '각진 미니멀 디자인',
    '{"colors":{"palette_100":[],"primary":{"base":"#1f2937","opacity":100,"tones":{}},"secondary":{"base":"#374151","opacity":100,"tones":{}},"success":{"base":"#22c55e","opacity":100,"tones":{}},"warning":{"base":"#f59e0b","opacity":100,"tones":{}},"error":{"base":"#ef4444","opacity":100,"tones":{}},"info":{"base":"#3b82f6","opacity":100,"tones":{}},"neutral":{"base":"#6b7280","opacity":100,"tones":{}},"tone_adjustments":{"saturation":0,"lightness":0,"temperature":0},"preset_tone":"vibrant"},"background":{"light":{"type":"solid","solid":{"color":"#ffffff","opacity":100},"gradient":{"enabled":false,"colors":[],"direction":"to bottom","angle":180}},"medium":{"type":"solid","solid":{"color":"#f9fafb","opacity":100},"gradient":{"enabled":false,"colors":[],"direction":"to bottom","angle":180}},"dark":{"type":"solid","solid":{"color":"#111827","opacity":100},"gradient":{"enabled":false,"colors":[],"direction":"to bottom","angle":180}}},"typography":{"base_size":16,"base_weight":400,"sizes":{},"weights":{},"color":{}},"border":{"default":{"radius":0}},"shadow":{},"spacing":{},"animation":{},"layout":{},"components":{}}'::jsonb,
    false
  ),
  (
    'Soft',
    '부드럽고 따뜻한 디자인',
    '{"colors":{"palette_100":[],"primary":{"base":"#10b981","opacity":100,"tones":{}},"secondary":{"base":"#34d399","opacity":100,"tones":{}},"success":{"base":"#22c55e","opacity":100,"tones":{}},"warning":{"base":"#f59e0b","opacity":100,"tones":{}},"error":{"base":"#ef4444","opacity":100,"tones":{}},"info":{"base":"#3b82f6","opacity":100,"tones":{}},"neutral":{"base":"#6b7280","opacity":100,"tones":{}},"tone_adjustments":{"saturation":0,"lightness":0,"temperature":0},"preset_tone":"pastel"},"background":{"light":{"type":"solid","solid":{"color":"#fefefe","opacity":100},"gradient":{"enabled":false,"colors":[],"direction":"to bottom","angle":180}},"medium":{"type":"solid","solid":{"color":"#f0fdf4","opacity":100},"gradient":{"enabled":false,"colors":[],"direction":"to bottom","angle":180}},"dark":{"type":"solid","solid":{"color":"#064e3b","opacity":100},"gradient":{"enabled":false,"colors":[],"direction":"to bottom","angle":180}}},"typography":{"base_size":16,"base_weight":400,"sizes":{},"weights":{},"color":{}},"border":{"default":{"radius":16}},"shadow":{},"spacing":{},"animation":{},"layout":{},"components":{}}'::jsonb,
    false
  ),
  (
    'Minimal',
    '최소한의 깔끔한 디자인',
    '{"colors":{"palette_100":[],"primary":{"base":"#6b7280","opacity":100,"tones":{}},"secondary":{"base":"#9ca3af","opacity":100,"tones":{}},"success":{"base":"#22c55e","opacity":100,"tones":{}},"warning":{"base":"#f59e0b","opacity":100,"tones":{}},"error":{"base":"#ef4444","opacity":100,"tones":{}},"info":{"base":"#3b82f6","opacity":100,"tones":{}},"neutral":{"base":"#6b7280","opacity":100,"tones":{}},"tone_adjustments":{"saturation":0,"lightness":0,"temperature":0},"preset_tone":"monochrome"},"background":{"light":{"type":"solid","solid":{"color":"#ffffff","opacity":100},"gradient":{"enabled":false,"colors":[],"direction":"to bottom","angle":180}},"medium":{"type":"solid","solid":{"color":"#fafafa","opacity":100},"gradient":{"enabled":false,"colors":[],"direction":"to bottom","angle":180}},"dark":{"type":"solid","solid":{"color":"#18181b","opacity":100},"gradient":{"enabled":false,"colors":[],"direction":"to bottom","angle":180}}},"typography":{"base_size":16,"base_weight":400,"sizes":{},"weights":{},"color":{}},"border":{"default":{"radius":4}},"shadow":{"default":{"enabled":false}},"spacing":{},"animation":{},"layout":{},"components":{}}'::jsonb,
    false
  )
ON CONFLICT (name) DO NOTHING;

-- 4. RLS 정책 설정
ALTER TABLE platform_design_presets ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 조회 가능
CREATE POLICY "Anyone can view active presets"
  ON platform_design_presets
  FOR SELECT
  USING (is_active = true);

-- 관리자만 생성/수정/삭제 가능
CREATE POLICY "Only admins can insert presets"
  ON platform_design_presets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Only admins can update presets"
  ON platform_design_presets
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Only admins can delete presets"
  ON platform_design_presets
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- 5. 업데이트 시간 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_platform_design_presets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_platform_design_presets_updated_at
  BEFORE UPDATE ON platform_design_presets
  FOR EACH ROW
  EXECUTE FUNCTION update_platform_design_presets_updated_at();

-- 6. 사용자별 선택된 프리셋 및 배경 테마 저장 테이블
CREATE TABLE IF NOT EXISTS user_theme_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  preset_id UUID REFERENCES platform_design_presets(id) ON DELETE SET NULL,
  background_theme VARCHAR(20) DEFAULT 'light' CHECK (background_theme IN ('light', 'medium', 'dark')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_user_theme_preferences_user_id ON user_theme_preferences(user_id);

-- RLS 정책
ALTER TABLE user_theme_preferences ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 설정만 조회/수정 가능
CREATE POLICY "Users can view own preferences"
  ON user_theme_preferences
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own preferences"
  ON user_theme_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own preferences"
  ON user_theme_preferences
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- 업데이트 시간 자동 갱신 트리거
CREATE TRIGGER trigger_update_user_theme_preferences_updated_at
  BEFORE UPDATE ON user_theme_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_platform_design_presets_updated_at();
