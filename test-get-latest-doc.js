/**
 * 가장 최근 생성된 거래명세서 ID 조회
 */

async function getLatestDocument() {
  try {
    const response = await fetch(
      'https://qxhpgjftkkcxdttgjkzj.supabase.co/rest/v1/transaction_statements?select=id,doc_number,created_at&order=created_at.desc&limit=1',
      {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4aHBnamZ0a2tjeGR0dGdqa3pqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjcwNDE0MCwiZXhwIjoyMDU4MjgwMTQwfQ.GdXLlA5WrvUKlhR82ybOqn7lQFmYwNcbVFhtVpfRCM0',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4aHBnamZ0a2tjeGR0dGdqa3pqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjcwNDE0MCwiZXhwIjoyMDU4MjgwMTQwfQ.GdXLlA5WrvUKlhR82ybOqn7lQFmYwNcbVFhtVpfRCM0'
        }
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (data && data.length > 0) {
        const doc = data[0];
        console.log('✅ 최근 생성된 문서:');
        console.log(`   ID: ${doc.id}`);
        console.log(`   문서번호: ${doc.doc_number}`);
        console.log(`   생성일시: ${doc.created_at}`);
        console.log(`\n🔗 검증 페이지: http://localhost:3002/verify/${doc.id}`);
        return doc.id;
      } else {
        console.log('❌ 생성된 문서가 없습니다.');
      }
    } else {
      console.error('❌ 오류:', response.status, await response.text());
    }
  } catch (error) {
    console.error('❌ 네트워크 오류:', error.message);
  }
}

getLatestDocument();
