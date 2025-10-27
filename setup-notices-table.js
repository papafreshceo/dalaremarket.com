const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qxhpgjftkkcxdttgjkzj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4aHBnamZ0a2tjeGR0dGdqa3pqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjcwNDE0MCwiZXhwIjoyMDU4MjgwMTQwfQ.INpe76Y_hNiKEtIQbucurești0kz3e_L_Cp0C6C6jIwCnqNo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupNoticesTable() {
  console.log('Creating platform_notices table...');

  const sql = `
    -- 공지사항 테이블 생성
    CREATE TABLE IF NOT EXISTS platform_notices (
      id BIGSERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'general',
      is_pinned BOOLEAN NOT NULL DEFAULT false,
      view_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      author_id UUID,
      published BOOLEAN NOT NULL DEFAULT true
    );

    -- 인덱스 생성
    CREATE INDEX IF NOT EXISTS idx_platform_notices_created_at ON platform_notices(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_platform_notices_category ON platform_notices(category);
    CREATE INDEX IF NOT EXISTS idx_platform_notices_is_pinned ON platform_notices(is_pinned);
    CREATE INDEX IF NOT EXISTS idx_platform_notices_published ON platform_notices(published);

    -- RLS 정책 설정
    ALTER TABLE platform_notices ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Anyone can view published notices" ON platform_notices;

    -- 모든 사용자가 공개된 공지사항을 읽을 수 있음
    CREATE POLICY "Anyone can view published notices" ON platform_notices
      FOR SELECT USING (published = true);
  `;

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('Error creating table:', error);
      // Try alternative method
      const { error: directError } = await supabase.from('platform_notices').select('id').limit(1);
      if (directError && directError.code === '42P01') {
        console.log('Table does not exist, creating via SQL...');
        // Since we cannot execute raw SQL directly, we'll create it manually
        console.log('Please run the SQL file manually in Supabase SQL Editor');
        console.log('SQL file: create-notices-table.sql');
      }
    } else {
      console.log('Table created successfully');
    }
  } catch (err) {
    console.error('Error:', err);
  }

  // Insert sample data
  console.log('\nInserting sample notices...');
  const sampleNotices = [
    {
      title: '달래마켓 플랫폼 오픈 안내',
      content: `안녕하세요, 농산물 셀러 여러분!

달래마켓 플랫폼이 정식으로 오픈되었습니다.

## 주요 기능
- 주문 통합 관리
- 상품 조회 및 관리
- 실시간 배송 추적
- 정산 내역 확인

앞으로 농산물 유통이 더욱 편리해집니다. 많은 이용 부탁드립니다!`,
      category: 'important',
      is_pinned: true
    },
    {
      title: '2025년 1월 주문 마감 일정 안내',
      content: `1월 주문 마감 일정을 안내드립니다.

**설 연휴 기간 특별 운영 안내**

- 1월 27일(월) ~ 1월 30일(목): 정상 운영
- 1월 31일(금) ~ 2월 2일(일): 설 연휴 휴무
- 2월 3일(월)부터: 정상 운영

설 연휴 기간에는 주문 접수 및 배송이 중단되오니 참고 부탁드립니다.`,
      category: 'general',
      is_pinned: false
    },
    {
      title: '신규 상품 등록 및 시세 정보 업데이트',
      content: `안녕하세요!

이번 주 신규 상품이 추가되었으며, 시세 정보가 업데이트되었습니다.

**신규 등록 상품**
- 유기농 방울토마토 (경북 예천)
- 샤인머스캣 (경북 상주)
- 무농약 시금치 (충남 당진)

**시세 변동 안내**
- 배추: 전주 대비 +6.3%
- 사과: 전주 대비 -3.0%
- 대파: 전주 대비 +6.7%

상품 페이지에서 확인하실 수 있습니다.`,
      category: 'update',
      is_pinned: false
    },
    {
      title: '배송 시스템 개선 안내',
      content: `배송 시스템이 개선되었습니다.

**개선 내용**
1. 실시간 배송 조회 기능 추가
2. 송장 번호 자동 등록 기능
3. 배송 상태 알림 기능

이제 더욱 편리하게 배송을 관리하실 수 있습니다!`,
      category: 'update',
      is_pinned: false
    },
    {
      title: '2월 Win-Win 프로그램 안내',
      content: `2월 Win-Win 프로그램을 안내드립니다.

**이달의 혜택**
- 신규 판로 개척 지원
- 물류비 10% 할인
- 마케팅 자료 무료 제공

자세한 내용은 Win-Win 페이지에서 확인하실 수 있습니다.`,
      category: 'event',
      is_pinned: false
    }
  ];

  const { data: insertData, error: insertError } = await supabase
    .from('platform_notices')
    .insert(sampleNotices)
    .select();

  if (insertError) {
    console.error('Error inserting sample data:', insertError);
  } else {
    console.log(`Inserted ${insertData.length} sample notices`);
    console.log('Setup completed!');
  }
}

setupNoticesTable();
