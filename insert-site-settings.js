/**
 * site_settings 기본 데이터 삽입 (테이블이 이미 존재한다고 가정)
 */

const https = require('https');

const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtldGRucWh4d3FjZ3lsdGluamloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTIyMzA0NywiZXhwIjoyMDc0Nzk5MDQ3fQ.JG09yOpBvu_Y_-9QNmWGY7GVwUVmTMKD4Sc6FGFhxX4';

async function main() {
  console.log('기본 사이트 설정 데이터 삽입 중...\n');

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

  try {
    await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          console.log('응답 상태:', res.statusCode);
          console.log('응답 본문:', body);
          resolve();
        });
      });
      req.on('error', reject);
      req.write(postData);
      req.end();
    });

    console.log('\n✅ 기본 설정 삽입 완료!');
  } catch (error) {
    console.error('❌ 오류:', error);
  }
}

main();
