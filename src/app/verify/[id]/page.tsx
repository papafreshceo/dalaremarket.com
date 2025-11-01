import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

interface VerifyPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function VerifyPage({ params }: VerifyPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Service role client 생성 (RLS 우회)
  const { createClient: createServiceClient } = await import('@supabase/supabase-js');
  const supabaseAdmin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 문서 조회
  const { data: statement, error } = await supabaseAdmin
    .from('transaction_statements')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !statement) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f5',
        padding: '20px'
      }}>
        <div style={{
          maxWidth: '500px',
          width: '100%',
          background: 'white',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '60px',
            marginBottom: '20px'
          }}>❌</div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            marginBottom: '12px',
            color: '#dc2626'
          }}>유효하지 않은 문서</h1>
          <p style={{
            color: '#666',
            lineHeight: '1.6'
          }}>
            요청하신 거래명세서를 찾을 수 없습니다.<br />
            문서 번호를 다시 확인해 주세요.
          </p>
        </div>
      </div>
    );
  }

  // 조회수 증가
  await supabaseAdmin
    .from('transaction_statements')
    .update({ verified_count: (statement.verified_count || 0) + 1 })
    .eq('id', id);

  // 품목 파싱
  const items = typeof statement.items === 'string'
    ? JSON.parse(statement.items)
    : statement.items;

  // 발행일시 포맷
  const issuedAt = new Date(statement.created_at).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f5f5f5',
      padding: '40px 20px'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        background: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        {/* 검증 성공 표시 */}
        <div style={{
          textAlign: 'center',
          marginBottom: '40px',
          padding: '20px',
          background: '#f0fdf4',
          borderRadius: '8px',
          border: '1px solid #86efac'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#16a34a',
            marginBottom: '8px'
          }}>정식 발행 문서</h1>
          <p style={{ color: '#666', fontSize: '14px' }}>
            이 문서는 dalraemarket.com에서 정식으로 발행된 거래명세서입니다.
          </p>
        </div>

        {/* 문서 정보 */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            marginBottom: '16px',
            paddingBottom: '12px',
            borderBottom: '2px solid #000'
          }}>문서 정보</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            fontSize: '14px'
          }}>
            <div>
              <strong>문서번호:</strong> {statement.doc_number}
            </div>
            <div>
              <strong>발행일시:</strong> {issuedAt}
            </div>
            <div>
              <strong>상태:</strong> {statement.status === 'issued' ? '발행완료' : statement.status}
            </div>
            <div>
              <strong>조회횟수:</strong> {statement.verified_count + 1}회
            </div>
          </div>
        </div>

        {/* 거래 당사자 */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            marginBottom: '16px',
            paddingBottom: '12px',
            borderBottom: '2px solid #000'
          }}>거래 당사자</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px'
          }}>
            <div style={{
              padding: '16px',
              background: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: 'bold',
                marginBottom: '12px',
                color: '#3b82f6'
              }}>공급자</h3>
              <div style={{ fontSize: '13px', lineHeight: '1.8' }}>
                <div><strong>상호:</strong> {statement.seller_name}</div>
                <div><strong>사업자:</strong> {statement.seller_business_number}</div>
                <div><strong>연락처:</strong> {statement.seller_phone}</div>
              </div>
            </div>
            <div style={{
              padding: '16px',
              background: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: 'bold',
                marginBottom: '12px',
                color: '#10b981'
              }}>공급받는자</h3>
              <div style={{ fontSize: '13px', lineHeight: '1.8' }}>
                <div><strong>상호:</strong> {statement.buyer_name}</div>
                <div><strong>사업자:</strong> {statement.buyer_business_number}</div>
                <div><strong>연락처:</strong> {statement.buyer_phone}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 거래 내역 */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            marginBottom: '16px',
            paddingBottom: '12px',
            borderBottom: '2px solid #000'
          }}>거래 내역</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '13px'
            }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #e5e7eb' }}>No</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e5e7eb' }}>품목명</th>
                  <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #e5e7eb' }}>규격</th>
                  <th style={{ padding: '12px', textAlign: 'right', border: '1px solid #e5e7eb' }}>수량</th>
                  <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #e5e7eb' }}>단위</th>
                  <th style={{ padding: '12px', textAlign: 'right', border: '1px solid #e5e7eb' }}>단가</th>
                  <th style={{ padding: '12px', textAlign: 'right', border: '1px solid #e5e7eb' }}>공급가액</th>
                  <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #e5e7eb' }}>비고</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any, index: number) => (
                  <tr key={index}>
                    <td style={{ padding: '10px', textAlign: 'center', border: '1px solid #e5e7eb' }}>{index + 1}</td>
                    <td style={{ padding: '10px', textAlign: 'left', border: '1px solid #e5e7eb' }}>{item.name}</td>
                    <td style={{ padding: '10px', textAlign: 'center', border: '1px solid #e5e7eb' }}>{item.spec}</td>
                    <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #e5e7eb' }}>{item.quantity.toLocaleString()}</td>
                    <td style={{ padding: '10px', textAlign: 'center', border: '1px solid #e5e7eb' }}>{item.unit}</td>
                    <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #e5e7eb' }}>{item.price.toLocaleString()}</td>
                    <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #e5e7eb' }}>{item.supplyAmount.toLocaleString()}</td>
                    <td style={{ padding: '10px', textAlign: 'center', border: '1px solid #e5e7eb' }}>{item.notes || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 합계 금액 */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: '30px'
        }}>
          <div style={{
            minWidth: '300px',
            padding: '20px',
            background: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '18px',
              fontWeight: 'bold'
            }}>
              <span>합계 금액:</span>
              <span>{statement.supply_amount.toLocaleString()}원</span>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div style={{
          paddingTop: '20px',
          borderTop: '1px solid #e5e7eb',
          textAlign: 'center',
          color: '#666',
          fontSize: '12px'
        }}>
          <p>이 문서는 dalraemarket.com에서 발행된 정식 거래명세서입니다.</p>
          <p>문의: contact@dalraemarket.com</p>
        </div>
      </div>
    </div>
  );
}
