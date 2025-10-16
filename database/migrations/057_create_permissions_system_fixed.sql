-- =====================================================
-- 권한 관리 시스템 생성 (수정 버전)
-- =====================================================
-- 작성일: 2025-01-16
-- 설명: 역할별 페이지 접근 권한 관리 테이블 생성
-- =====================================================

-- 기존 테이블이 있으면 삭제
DROP TABLE IF EXISTS permissions CASCADE;

-- UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 권한 테이블 생성
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role VARCHAR(50) NOT NULL,
  page_path VARCHAR(200) NOT NULL,
  can_access BOOLEAN DEFAULT true,
  can_create BOOLEAN DEFAULT false,
  can_read BOOLEAN DEFAULT false,
  can_update BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role, page_path)
);

-- 인덱스 생성
CREATE INDEX idx_permissions_role ON permissions(role);
CREATE INDEX idx_permissions_page_path ON permissions(page_path);
CREATE INDEX idx_permissions_role_page ON permissions(role, page_path);

-- RLS 비활성화 (관리자만 접근하는 테이블)
ALTER TABLE permissions DISABLE ROW LEVEL SECURITY;

-- 기본 권한 데이터 삽입 (최고관리자는 모든 권한)
INSERT INTO permissions (role, page_path, can_access, can_create, can_read, can_update, can_delete)
VALUES
  -- 최고관리자 (모든 페이지 접근 가능)
  ('super_admin', '/admin/dashboard', true, true, true, true, true),
  ('super_admin', '/admin/products', true, true, true, true, true),
  ('super_admin', '/admin/order-platform', true, true, true, true, true),
  ('super_admin', '/admin/order-integration', true, true, true, true, true),
  ('super_admin', '/admin/purchase', true, true, true, true, true),
  ('super_admin', '/admin/farms', true, true, true, true, true),
  ('super_admin', '/admin/inventory', true, true, true, true, true),
  ('super_admin', '/admin/customers', true, true, true, true, true),
  ('super_admin', '/admin/partners', true, true, true, true, true),
  ('super_admin', '/admin/expense', true, true, true, true, true),
  ('super_admin', '/admin/workers', true, true, true, true, true),
  ('super_admin', '/admin/documents', true, true, true, true, true),
  ('super_admin', '/admin/planning', true, true, true, true, true),
  ('super_admin', '/admin/settings', true, true, true, true, true),

  -- 관리자 (대부분 접근 가능, 설정은 제한적)
  ('admin', '/admin/dashboard', true, true, true, true, false),
  ('admin', '/admin/products', true, true, true, true, false),
  ('admin', '/admin/order-platform', true, true, true, true, true),
  ('admin', '/admin/order-integration', true, true, true, true, true),
  ('admin', '/admin/purchase', true, true, true, true, true),
  ('admin', '/admin/farms', true, true, true, true, true),
  ('admin', '/admin/inventory', true, true, true, true, false),
  ('admin', '/admin/customers', true, true, true, true, false),
  ('admin', '/admin/partners', true, true, true, true, false),
  ('admin', '/admin/expense', true, true, true, true, false),
  ('admin', '/admin/workers', true, true, true, true, false),
  ('admin', '/admin/documents', true, true, true, true, false),
  ('admin', '/admin/planning', true, true, true, true, true),
  ('admin', '/admin/settings', true, false, true, true, false),

  -- 직원 (기본 업무만 가능)
  ('employee', '/admin/dashboard', true, false, true, false, false),
  ('employee', '/admin/products', true, false, true, true, false),
  ('employee', '/admin/order-platform', true, true, true, true, false),
  ('employee', '/admin/order-integration', true, true, true, true, false),
  ('employee', '/admin/purchase', true, true, true, true, false),
  ('employee', '/admin/inventory', true, false, true, true, false),
  ('employee', '/admin/customers', true, false, true, false, false),
  ('employee', '/admin/documents', true, true, true, false, false),
  ('employee', '/admin/planning', true, true, true, true, false);

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '권한 관리 시스템 생성 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '테이블: permissions';
  RAISE NOTICE '기본 역할: super_admin, admin, employee';
  RAISE NOTICE '테이블 생성 및 데이터 삽입 성공!';
  RAISE NOTICE '=================================================';
END $$;
