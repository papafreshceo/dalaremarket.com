'use client'

interface Product {
  id: string;
  name: string;
  variety?: string;
  origin?: string;
  status: string;
}

interface SupplyProductsTableProps {
  products: Product[];
  loading: boolean;
  isMobile?: boolean;
}

export default function SupplyProductsTable({ products, loading, isMobile = false }: SupplyProductsTableProps) {
  if (loading) {
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(222, 226, 230, 0.1)',
        borderRadius: '12px',
        padding: isMobile ? '16px' : '24px',
        marginBottom: '16px',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 'calc(100vh - 100px)',
        overflow: 'hidden'
      }}>
        <h2 style={{
          fontSize: isMobile ? '16px' : '18px',
          fontWeight: '600',
          marginBottom: '16px',
          color: '#212529'
        }}>공급상품</h2>
        <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>
          로딩 중...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(222, 226, 230, 0.1)',
      borderRadius: '12px',
      padding: isMobile ? '16px' : '24px',
      marginBottom: '16px',
      display: 'flex',
      flexDirection: 'column',
      maxHeight: 'calc(100vh - 100px)',
      overflow: 'hidden'
    }}>
      <h2 style={{
        fontSize: isMobile ? '16px' : '18px',
        fontWeight: '600',
        marginBottom: '16px',
        color: '#212529'
      }}>공급상품</h2>

      <div style={{
        overflowX: 'auto',
        overflowY: 'auto',
        flex: 1,
        minHeight: 0
      }}>
        {products.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>
            출하중인 상품이 없습니다
          </div>
        ) : (
          <table style={{
            width: '100%',
            borderCollapse: 'collapse'
          }}>
            <thead>
              <tr>
                <th style={{
                  padding: '10px',
                  borderBottom: '2px solid rgba(222, 226, 230, 0.1)',
                  textAlign: 'left',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#495057'
                }}>품목</th>
                <th style={{
                  padding: '10px',
                  borderBottom: '2px solid rgba(222, 226, 230, 0.1)',
                  textAlign: 'left',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#495057'
                }}>상품명</th>
                {!isMobile && <th style={{ padding: '10px', borderBottom: '2px solid rgba(222, 226, 230, 0.1)', textAlign: 'left', fontSize: '13px', fontWeight: '500', color: '#495057' }}>출고</th>}
                <th style={{ padding: '10px', borderBottom: '2px solid rgba(222, 226, 230, 0.1)', textAlign: 'left', fontSize: '13px', fontWeight: '500', color: '#495057' }}>상태</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td style={{ padding: '10px', borderBottom: '1px solid rgba(241, 243, 245, 0.1)', fontSize: '13px', color: '#6c757d' }}>
                    {product.variety || '-'}
                  </td>
                  <td style={{ padding: '10px', borderBottom: '1px solid rgba(241, 243, 245, 0.1)', fontSize: '13px' }}>
                    {product.name}
                  </td>
                  {!isMobile && <td style={{ padding: '10px', borderBottom: '1px solid rgba(241, 243, 245, 0.1)', fontSize: '13px', color: '#6c757d' }}>
                    {product.origin || '-'}
                  </td>}
                  <td style={{ padding: '10px', borderBottom: '1px solid rgba(241, 243, 245, 0.1)' }}>
                    <span style={{
                      padding: '3px 6px',
                      background: 'rgba(16, 185, 129, 0.1)',
                      color: '#10b981',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '500'
                    }}>출하중</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
