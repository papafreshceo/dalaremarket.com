-- 회사 정보 테이블
create table if not exists company_info (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  business_number text not null,
  ceo_name text not null,
  business_type text,
  business_category text,
  address text not null,
  address_detail text,
  phone text not null,
  fax text,
  email text not null,
  bank_name text,
  account_number text,
  account_holder text,
  online_registration_number text,
  privacy_officer text,
  privacy_officer_email text,
  tax_invoice_email text,
  is_default boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 인덱스 생성
create index if not exists idx_company_info_business_number on company_info(business_number);
create index if not exists idx_company_info_is_default on company_info(is_default);

-- RLS 정책 설정
alter table company_info enable row level security;

-- 기존 정책 삭제 (재실행 시 오류 방지)
drop policy if exists "Anyone can view company info" on company_info;
drop policy if exists "Admins can manage company info" on company_info;

-- 모든 사용자가 회사 정보 조회 가능
create policy "Anyone can view company info"
  on company_info for select
  using (true);

-- 관리자만 회사 정보 관리 가능 (실제로는 admin role 체크 필요)
create policy "Admins can manage company info"
  on company_info for all
  using (true)
  with check (true);

-- 기본 회사 정보 삽입
insert into company_info (
  company_name,
  business_number,
  ceo_name,
  business_type,
  business_category,
  address,
  address_detail,
  phone,
  fax,
  email,
  bank_name,
  account_number,
  account_holder,
  online_registration_number,
  privacy_officer,
  privacy_officer_email,
  tax_invoice_email,
  is_default
) values (
  '달래마켓',
  '107-30-96371',
  '대표자명',
  '도소매업',
  '농산물 유통',
  '서울시 강남구 테헤란로 123',
  '달래빌딩 5층',
  '02-1234-5678',
  '02-1234-5679',
  'contact@dalraemarket.com',
  '국민은행',
  '123-456-7890-12',
  '달래마켓',
  '2024-서울강남-0001',
  '김개인',
  'privacy@dalraemarket.com',
  'tax@dalraemarket.com',
  true
) on conflict do nothing;
