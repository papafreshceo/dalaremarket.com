/**
 * site_settings 테이블 생성 및 기본 데이터 삽입
 */

const https = require('https');

const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtldGRucWh4d3FjZ3lsdGluamloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTIyMzA0NywiZXhwIjoyMDc0Nzk5MDQ3fQ.JG09yOpBvu_Y_-9QNmWGY7GVwUVmTMKD4Sc6FGFhxX4';

function executeSql(sqlStatement) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query: sqlStatement });

    const options = {
      hostname: 'ketdnqhxwqcgyltinjih.supabase.co',
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('site_settings 테이블 생성 중...\n');

  try {
    // 1. 테이블 생성
    console.log('1. 테이블 생성...');
    const createTableSql = `
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_name TEXT NOT NULL DEFAULT '달래마켓',
  site_logo_url TEXT,
  site_description TEXT,
  site_keywords TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  business_hours TEXT,
  footer_text TEXT,
  company_name TEXT,
  ceo_name TEXT,
  business_number TEXT,
  e_commerce_license_number TEXT,
  address TEXT,
  privacy_officer_name TEXT,
  privacy_officer_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
    `;
    const result1 = await executeSql(createTableSql);
    console.log('   상태:', result1.status);

    // 2. 트리거 함수 생성
    console.log('\n2. 트리거 함수 생성...');
    const triggerFnSql = `
CREATE OR REPLACE FUNCTION update_site_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
    `;
    const result2 = await executeSql(triggerFnSql);
    console.log('   상태:', result2.status);

    // 3. 트리거 생성
    console.log('\n3. 트리거 생성...');
    const triggerSql = `
DROP TRIGGER IF EXISTS site_settings_updated_at ON site_settings;
CREATE TRIGGER site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_site_settings_updated_at();
    `;
    const result3 = await executeSql(triggerSql);
    console.log('   상태:', result3.status);

    // 4. 단일 레코드 제약 조건
    console.log('\n4. 단일 레코드 제약 조건 추가...');
    const constraintSql = `
CREATE UNIQUE INDEX IF NOT EXISTS site_settings_singleton ON site_settings ((true));
    `;
    const result4 = await executeSql(constraintSql);
    console.log('   상태:', result4.status);

    // 5. 기본 데이터 삽입 (Supabase REST API 사용)
    console.log('\n5. 기본 사이트 설정 데이터 삽입...');

    const defaultSettings = {
      site_name: '달래마켓',
      site_logo_url: 'https://res.cloudinary.com/dde1hpbrp/image/upload/v1753148563/05_etc/dalraemarket_papafarmers.com/DalraeMarket_loge_trans.png',
      site_description: '신선한 농산물을 직접 공급하는 B2B 플랫폼',
      site_keywords: '농산물, B2B, 도매, 납품, 신선식품',
      contact_email: 'contact@dalreamarket.com',
      contact_phone: '1588-0000',
      business_hours: '평일 09:00 - 18:00',
      footer_text: '© 2025 달래마켓. All rights reserved.',
      company_name: '(주)달래마켓',
      ceo_name: '홍길동',
      business_number: '123-45-67890',
      e_commerce_license_number: '2024-서울강남-12345',
      address: '서울특별시 강남구 테헤란로 123',
      privacy_officer_name: '김개인',
      privacy_officer_email: 'privacy@dalreamarket.com'
    };

    const postData = JSON.stringify(defaultSettings);
    const options = {
      hostname: 'ketdnqhxwqcgyltinjih.supabase.co',
      path: '/rest/v1/site_settings',
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=ignore-duplicates'
      }
    };

    await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        res.on('data', () => {});
        res.on('end', () => {
          console.log('   상태:', res.statusCode);
          resolve();
        });
      });
      req.on('error', reject);
      req.write(postData);
      req.end();
    });

    console.log('   ✅ 기본 설정 완료');

    console.log('\n' + '='.repeat(50));
    console.log('✅ site_settings 테이블 생성 완료!');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ 오류:', error);
    process.exit(1);
  }
}

main();
