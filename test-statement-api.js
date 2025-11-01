/**
 * 거래명세서 API 테스트 스크립트
 */

const testData = {
  sellerInfo: {
    name: '달래마켓',
    businessNumber: '107-30-96371',
    representative: '대표자명',
    address: '서울시 강남구 테헤란로 123',
    phone: '02-1234-5678',
    email: 'contact@dalraemarket.com'
  },
  buyerInfo: {
    name: '테스트 구매자',
    businessNumber: '123-45-67890',
    representative: '홍길동',
    address: '서울시 서초구 강남대로 456',
    phone: '02-9876-5432',
    email: 'buyer@example.com'
  },
  items: [
    {
      name: '감자',
      spec: '특',
      quantity: 100,
      unit: 'kg',
      price: 3000
    },
    {
      name: '양파',
      spec: '중',
      quantity: 50,
      unit: 'kg',
      price: 2000
    },
    {
      name: '당근',
      spec: '상',
      quantity: 30,
      unit: 'kg',
      price: 2500
    }
  ],
  notes: [
    '배송은 영업일 기준 3일 이내 완료됩니다.',
    '문의사항은 이메일 또는 전화로 연락 주시기 바랍니다.'
  ]
};

async function testStatementAPI() {
  try {
    console.log('🚀 거래명세서 API 테스트 시작...\n');

    const response = await fetch('http://localhost:3002/api/statements/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log('📊 응답 상태:', response.status, response.statusText);
    console.log('📄 Content-Type:', response.headers.get('content-type'));

    if (response.ok) {
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/pdf')) {
        // PDF 파일로 저장
        const buffer = await response.arrayBuffer();
        const fs = require('fs');
        const fileName = 'test-statement.pdf';
        fs.writeFileSync(fileName, Buffer.from(buffer));
        console.log(`✅ PDF 생성 성공! 파일: ${fileName}`);
        console.log(`📦 파일 크기: ${(buffer.byteLength / 1024).toFixed(2)} KB`);
      } else {
        // JSON 응답 확인
        const result = await response.json();
        console.log('📝 응답 데이터:', JSON.stringify(result, null, 2));
      }
    } else {
      const error = await response.text();
      console.error('❌ 오류 발생:', error);
    }
  } catch (error) {
    console.error('❌ 네트워크 오류:', error.message);
  }
}

// 테스트 실행
testStatementAPI();
