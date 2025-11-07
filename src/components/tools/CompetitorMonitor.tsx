'use client';

import React, { useState } from 'react';

interface CompetitorProduct {
  id: string;
  url: string;
  productName: string;
  market: string;
  currentPrice: number;
  previousPrice?: number;
  lastChecked?: string;
  priceHistory?: Array<{ date: string; price: number }>;
  inStock: boolean;
  rating?: number;
  reviewCount?: number;
}

export default function CompetitorMonitor() {
  const [products, setProducts] = useState<CompetitorProduct[]>([]);
  const [newProductUrl, setNewProductUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // 로컬스토리지에서 불러오기
  React.useEffect(() => {
    const saved = localStorage.getItem('competitorProducts');
    if (saved) {
      try {
        setProducts(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load products:', e);
      }
    }
  }, []);

  // 로컬스토리지에 저장
  const saveToStorage = (newProducts: CompetitorProduct[]) => {
    localStorage.setItem('competitorProducts', JSON.stringify(newProducts));
  };

  // 마켓 감지 (URL 기반)
  const detectMarket = (url: string): string => {
    if (url.includes('smartstore.naver.com') || url.includes('shopping.naver.com')) {
      return '네이버 스마트스토어';
    } else if (url.includes('coupang.com')) {
      return '쿠팡';
    } else if (url.includes('gmarket.co.kr')) {
      return 'G마켓';
    } else if (url.includes('11st.co.kr')) {
      return '11번가';
    } else if (url.includes('auction.co.kr')) {
      return '옥션';
    } else if (url.includes('interpark.com')) {
      return '인터파크';
    } else {
      return '기타';
    }
  };

  // 상품 추가
  const addProduct = async () => {
    if (!newProductUrl.trim()) {
      setError('상품 URL을 입력해주세요.');
      return;
    }

    // URL 유효성 검사
    try {
      new URL(newProductUrl);
    } catch {
      setError('올바른 URL 형식이 아닙니다.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 실제로는 API를 통해 상품 정보를 가져와야 하지만,
      // 여기서는 데모용으로 URL 기반으로 기본 정보 생성
      const market = detectMarket(newProductUrl);
      const newProduct: CompetitorProduct = {
        id: Date.now().toString(),
        url: newProductUrl,
        productName: '상품명을 클릭하여 수정하세요',
        market,
        currentPrice: 0,
        inStock: true,
        lastChecked: new Date().toISOString(),
        priceHistory: []
      };

      const newProducts = [...products, newProduct];
      setProducts(newProducts);
      saveToStorage(newProducts);
      setNewProductUrl('');
    } catch (err) {
      setError('상품을 추가하는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 상품 삭제
  const removeProduct = (id: string) => {
    const newProducts = products.filter(p => p.id !== id);
    setProducts(newProducts);
    saveToStorage(newProducts);
  };

  // 가격 업데이트
  const updatePrice = (id: string, newPrice: number) => {
    const newProducts = products.map(p => {
      if (p.id === id) {
        const history = p.priceHistory || [];
        if (p.currentPrice > 0) {
          history.push({
            date: new Date().toISOString(),
            price: p.currentPrice
          });
        }
        return {
          ...p,
          previousPrice: p.currentPrice,
          currentPrice: newPrice,
          priceHistory: history,
          lastChecked: new Date().toISOString()
        };
      }
      return p;
    });
    setProducts(newProducts);
    saveToStorage(newProducts);
  };

  // 상품명 수정 시작
  const startEditName = (id: string, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
  };

  // 상품명 수정 완료
  const finishEditName = (id: string) => {
    const newProducts = products.map(p =>
      p.id === id ? { ...p, productName: editName } : p
    );
    setProducts(newProducts);
    saveToStorage(newProducts);
    setEditingId(null);
    setEditName('');
  };

  // 가격 변동률 계산
  const getPriceChange = (product: CompetitorProduct) => {
    if (!product.previousPrice || product.previousPrice === 0) return null;
    const change = product.currentPrice - product.previousPrice;
    const changePercent = (change / product.previousPrice) * 100;
    return { change, changePercent };
  };

  // 날짜 포맷
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    return `${days}일 전`;
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* 상품 추가 영역 */}
      <div style={{
        background: '#f8f9fa',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '24px'
      }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          marginBottom: '16px',
          color: '#212529'
        }}>
          경쟁사 상품 추가
        </h3>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <input
            type="text"
            value={newProductUrl}
            onChange={(e) => setNewProductUrl(e.target.value)}
            placeholder="상품 URL을 입력하세요 (네이버, 쿠팡, G마켓 등)"
            style={{
              flex: 1,
              padding: '12px',
              border: '1px solid #dee2e6',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
            onKeyPress={(e) => {
              if (e.key === 'Enter') addProduct();
            }}
          />
          <button
            onClick={addProduct}
            disabled={loading}
            style={{
              padding: '12px 24px',
              background: loading ? '#6c757d' : 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {loading ? '추가 중...' : '+ 추가'}
          </button>
        </div>

        {error && (
          <div style={{
            padding: '12px',
            background: '#fff5f5',
            border: '1px solid #feb2b2',
            borderRadius: '6px',
            color: '#c53030',
            fontSize: '13px'
          }}>
            {error}
          </div>
        )}

        <div style={{
          fontSize: '12px',
          color: '#6c757d',
          marginTop: '8px'
        }}>
          💡 상품 URL을 추가하면 자동으로 마켓을 감지합니다. 상품명과 가격은 수동으로 입력해주세요.
        </div>
      </div>

      {/* 상품 목록 */}
      {products.length > 0 ? (
        <div style={{
          background: 'white',
          border: '1px solid #dee2e6',
          borderRadius: '12px',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '16px 20px',
            background: '#f8f9fa',
            borderBottom: '1px solid #dee2e6',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              margin: 0,
              color: '#212529'
            }}>
              모니터링 상품 목록 ({products.length}개)
            </h3>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#495057',
                    borderBottom: '2px solid #dee2e6',
                    minWidth: '200px'
                  }}>
                    상품명
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'center',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#495057',
                    borderBottom: '2px solid #dee2e6',
                    minWidth: '120px'
                  }}>
                    마켓
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'right',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#495057',
                    borderBottom: '2px solid #dee2e6',
                    minWidth: '120px'
                  }}>
                    현재가
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'right',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#495057',
                    borderBottom: '2px solid #dee2e6',
                    minWidth: '120px'
                  }}>
                    변동
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'center',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#495057',
                    borderBottom: '2px solid #dee2e6',
                    minWidth: '100px'
                  }}>
                    재고
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'center',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#495057',
                    borderBottom: '2px solid #dee2e6',
                    minWidth: '120px'
                  }}>
                    마지막 확인
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'center',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#495057',
                    borderBottom: '2px solid #dee2e6',
                    minWidth: '150px'
                  }}>
                    관리
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const priceChange = getPriceChange(product);

                  return (
                    <tr key={product.id} style={{
                      borderBottom: '1px solid #f1f3f5'
                    }}>
                      <td style={{
                        padding: '16px',
                        fontSize: '14px',
                        color: '#212529'
                      }}>
                        {editingId === product.id ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onBlur={() => finishEditName(product.id)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') finishEditName(product.id);
                            }}
                            autoFocus
                            style={{
                              width: '100%',
                              padding: '6px 8px',
                              border: '1px solid #3b82f6',
                              borderRadius: '4px',
                              fontSize: '14px'
                            }}
                          />
                        ) : (
                          <div>
                            <div
                              onClick={() => startEditName(product.id, product.productName)}
                              style={{
                                cursor: 'pointer',
                                fontWeight: '500',
                                marginBottom: '4px'
                              }}
                              title="클릭하여 수정"
                            >
                              {product.productName}
                            </div>
                            <a
                              href={product.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                fontSize: '12px',
                                color: '#6c757d',
                                textDecoration: 'none'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                              onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                            >
                              상품 페이지 보기 →
                            </a>
                          </div>
                        )}
                      </td>
                      <td style={{
                        padding: '16px',
                        textAlign: 'center',
                        fontSize: '13px'
                      }}>
                        <span style={{
                          padding: '4px 8px',
                          background: '#e3f2fd',
                          color: '#1976d2',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {product.market}
                        </span>
                      </td>
                      <td style={{
                        padding: '16px',
                        textAlign: 'right',
                        fontSize: '14px'
                      }}>
                        <input
                          type="text"
                          value={product.currentPrice || ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9]/g, '');
                            updatePrice(product.id, parseInt(value) || 0);
                          }}
                          placeholder="0"
                          style={{
                            width: '100px',
                            padding: '6px 8px',
                            border: '1px solid #dee2e6',
                            borderRadius: '4px',
                            fontSize: '14px',
                            textAlign: 'right',
                            fontWeight: '600'
                          }}
                        />
                        <span style={{ marginLeft: '4px', color: '#6c757d' }}>원</span>
                      </td>
                      <td style={{
                        padding: '16px',
                        textAlign: 'right',
                        fontSize: '13px'
                      }}>
                        {priceChange ? (
                          <div style={{
                            color: priceChange.change > 0 ? '#dc3545' : priceChange.change < 0 ? '#28a745' : '#6c757d'
                          }}>
                            <div style={{ fontWeight: '600' }}>
                              {priceChange.change > 0 ? '+' : ''}{priceChange.change.toLocaleString()}원
                            </div>
                            <div style={{ fontSize: '12px' }}>
                              ({priceChange.change > 0 ? '+' : ''}{priceChange.changePercent.toFixed(1)}%)
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: '#adb5bd' }}>-</span>
                        )}
                      </td>
                      <td style={{
                        padding: '16px',
                        textAlign: 'center',
                        fontSize: '13px'
                      }}>
                        <button
                          onClick={() => {
                            const newProducts = products.map(p =>
                              p.id === product.id ? { ...p, inStock: !p.inStock } : p
                            );
                            setProducts(newProducts);
                            saveToStorage(newProducts);
                          }}
                          style={{
                            padding: '4px 12px',
                            background: product.inStock ? '#d4edda' : '#f8d7da',
                            color: product.inStock ? '#155724' : '#721c24',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                        >
                          {product.inStock ? '재고 있음' : '품절'}
                        </button>
                      </td>
                      <td style={{
                        padding: '16px',
                        textAlign: 'center',
                        fontSize: '12px',
                        color: '#6c757d'
                      }}>
                        {formatDate(product.lastChecked)}
                      </td>
                      <td style={{
                        padding: '16px',
                        textAlign: 'center'
                      }}>
                        <button
                          onClick={() => {
                            updatePrice(product.id, product.currentPrice);
                          }}
                          style={{
                            padding: '6px 12px',
                            background: 'transparent',
                            border: '1px solid #3b82f6',
                            borderRadius: '4px',
                            color: '#3b82f6',
                            fontSize: '12px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            marginRight: '4px'
                          }}
                        >
                          갱신
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('이 상품을 삭제하시겠습니까?')) {
                              removeProduct(product.id);
                            }
                          }}
                          style={{
                            padding: '6px 12px',
                            background: 'transparent',
                            border: '1px solid #dc3545',
                            borderRadius: '4px',
                            color: '#dc3545',
                            fontSize: '12px',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={{
          padding: '60px 20px',
          textAlign: 'center',
          color: '#6c757d',
          background: '#f8f9fa',
          borderRadius: '12px',
          border: '2px dashed #dee2e6'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px'
          }}>
            👀
          </div>
          <div style={{
            fontSize: '16px',
            fontWeight: '500',
            marginBottom: '8px',
            color: '#495057'
          }}>
            모니터링 중인 상품이 없습니다
          </div>
          <div style={{
            fontSize: '14px',
            color: '#6c757d'
          }}>
            경쟁사 상품 URL을 추가하여 가격 변동을 추적해보세요.
          </div>
        </div>
      )}

      {/* 사용 가이드 */}
      <div style={{
        marginTop: '24px',
        padding: '16px',
        background: '#e7f3ff',
        border: '1px solid #b3d9ff',
        borderRadius: '8px'
      }}>
        <div style={{
          fontSize: '14px',
          fontWeight: '600',
          marginBottom: '8px',
          color: '#0d47a1'
        }}>
          💡 사용 방법
        </div>
        <ul style={{
          fontSize: '13px',
          color: '#1565c0',
          margin: 0,
          paddingLeft: '20px'
        }}>
          <li>경쟁사 상품 URL을 입력하여 모니터링 목록에 추가하세요.</li>
          <li>상품명을 클릭하면 수정할 수 있습니다.</li>
          <li>현재가를 입력하면 이전 가격과 자동 비교됩니다.</li>
          <li>재고 상태를 클릭하여 변경할 수 있습니다.</li>
          <li>갱신 버튼을 클릭하면 마지막 확인 시간이 업데이트됩니다.</li>
          <li>모든 데이터는 브라우저에 저장되어 다음 방문 시에도 유지됩니다.</li>
        </ul>
      </div>
    </div>
  );
}
