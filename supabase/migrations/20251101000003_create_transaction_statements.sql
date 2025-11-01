-- 거래명세서 저장 테이블
create table if not exists transaction_statements (
  id text primary key,
  doc_number text unique not null,
  seller_id uuid references auth.users(id),
  buyer_id uuid references auth.users(id),
  seller_name text not null,
  seller_business_number text,
  seller_representative text,
  seller_address text,
  seller_phone text,
  seller_email text,
  buyer_name text not null,
  buyer_business_number text,
  buyer_representative text,
  buyer_address text,
  buyer_phone text,
  buyer_email text,
  items jsonb not null,
  supply_amount integer not null,
  vat_amount integer not null,
  total_amount integer not null,
  notes text,
  created_at timestamp with time zone default now(),
  status text default 'issued',
  verified_count integer default 0
);

-- 인덱스 생성
create index if not exists idx_statements_seller on transaction_statements(seller_id);
create index if not exists idx_statements_buyer on transaction_statements(buyer_id);
create index if not exists idx_statements_doc_number on transaction_statements(doc_number);
create index if not exists idx_statements_created_at on transaction_statements(created_at desc);

-- RLS 정책 설정
alter table transaction_statements enable row level security;

-- 기존 정책 삭제 (재실행 시 오류 방지)
drop policy if exists "Sellers can view their statements" on transaction_statements;
drop policy if exists "Buyers can view their statements" on transaction_statements;
drop policy if exists "Sellers can create statements" on transaction_statements;
drop policy if exists "Anyone can update verified count" on transaction_statements;

-- 판매자는 자신이 발행한 명세서 조회 가능
create policy "Sellers can view their statements"
  on transaction_statements for select
  using (auth.uid() = seller_id);

-- 구매자는 자신이 받은 명세서 조회 가능
create policy "Buyers can view their statements"
  on transaction_statements for select
  using (auth.uid() = buyer_id);

-- 판매자는 명세서 생성 가능
create policy "Sellers can create statements"
  on transaction_statements for insert
  with check (auth.uid() = seller_id);

-- 명세서 생성 카운트 업데이트는 모두 가능 (검증용)
create policy "Anyone can update verified count"
  on transaction_statements for update
  using (true)
  with check (true);
