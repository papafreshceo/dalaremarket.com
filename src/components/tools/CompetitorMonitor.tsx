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
      // API를 통해 상품 정보 자동 수집
      const response = await fetch('/api/scrape-price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: newProductUrl }),
      });

      const result = await response.json();

      if (!response.ok) {
        // 실패해도 기본 정보로 추가 가능하도록
        const market = detectMarket(newProductUrl);
        setError(result.error || '가격 정보를 자동으로 가져올 수 없습니다. 수동으로 입력해주세요.');

        const newProduct: CompetitorProduct = {
          id: Date.now().toString(),
          url: newProductUrl,
          productName: result.productName || '상품명을 클릭하여 수정하세요',
          market: result.market || market,
          currentPrice: 0,
          inStock: true,
          lastChecked: new Date().toISOString(),
          priceHistory: []
        };

        const newProducts = [...products, newProduct];
        setProducts(newProducts);
        saveToStorage(newProducts);
        setNewProductUrl('');
        return;
      }

      // 성공: 자동으로 수집된 정보로 상품 추가
      const { data } = result;
      const newProduct: CompetitorProduct = {
        id: Date.now().toString(),
        url: newProductUrl,
        productName: data.productName,
        market: data.market,
        currentPrice: data.price,
        inStock: data.inStock,
        lastChecked: data.scrapedAt,
        priceHistory: []
      };

      const newProducts = [...products, newProduct];
      setProducts(newProducts);
      saveToStorage(newProducts);
      setNewProductUrl('');
      setError(''); // 성공 시 에러 메시지 초기화
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

  // 잘못된 URL 상품 모두 삭제
  const removeInvalidProducts = () => {
    const validProducts = products.filter(p => {
      try {
        new URL(p.url);
        return true;
      } catch {
        return false;
      }
    });

    const removedCount = products.length - validProducts.length;
    if (removedCount > 0) {
      if (confirm(`${removedCount}개의 잘못된 URL 상품을 삭제하시겠습니까?`)) {
        setProducts(validProducts);
        saveToStorage(validProducts);
        setError(`${removedCount}개의 잘못된 상품을 삭제했습니다.`);
      }
    } else {
      setError('잘못된 URL을 가진 상품이 없습니다.');
    }
  };

  // 가격 업데이트 (수동)
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

  // 가격 자동 갱신 (단일 상품, 재시도 포함)
  const refreshPrice = async (id: string, skipLoadingState = false, retryCount = 0): Promise<{ success: boolean; error?: string }> => {
    const product = products.find(p => p.id === id);
    if (!product) return { success: false, error: '상품을 찾을 수 없습니다.' };

    if (!skipLoadingState) {
      setLoading(true);
      setError('');
    }

    try {
      const response = await fetch('/api/scrape-price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: product.url }),
      });

      const result = await response.json();

      // 429 에러 처리 (Too Many Requests)
      if (response.status === 429 && retryCount < 2) {
        // 5초 대기 후 재시도
        await new Promise(resolve => setTimeout(resolve, 5000));
        return refreshPrice(id, skipLoadingState, retryCount + 1);
      }

      if (!response.ok) {
        const errorMsg = `${product.productName}: ${result.error || '가격 정보를 가져올 수 없습니다.'}`;
        if (!skipLoadingState) {
          setError(errorMsg);
        }
        return { success: false, error: errorMsg };
      }

      const { data } = result;

      // 가격 업데이트
      setProducts(prevProducts => {
        const newProducts = prevProducts.map(p => {
          if (p.id === id) {
            const history = p.priceHistory || [];
            if (p.currentPrice > 0 && p.currentPrice !== data.price) {
              history.push({
                date: new Date().toISOString(),
                price: p.currentPrice
              });
            }
            return {
              ...p,
              previousPrice: p.currentPrice,
              currentPrice: data.price,
              productName: data.productName || p.productName,
              inStock: data.inStock,
              priceHistory: history,
              lastChecked: data.scrapedAt
            };
          }
          return p;
        });
        saveToStorage(newProducts);
        return newProducts;
      });

      return { success: true };
    } catch (err) {
      const errorMsg = `${product.productName}: 가격을 갱신하는데 실패했습니다.`;
      if (!skipLoadingState) {
        setError(errorMsg);
      }
      return { success: false, error: errorMsg };
    } finally {
      if (!skipLoadingState) {
        setLoading(false);
      }
    }
  };

  // 모든 상품 가격 갱신
  const refreshAllPrices = async () => {
    if (products.length === 0) return;

    setLoading(true);
    setError('갱신을 시작합니다...');

    const errors: string[] = [];
    let successCount = 0;

    for (let i = 0; i < products.length; i++) {
      const product = products[i];

      // 진행 상황 표시
      setError(`진행 중: ${i + 1}/${products.length} - ${product.productName} 처리 중...`);

      // URL 유효성 검사
      try {
        new URL(product.url);
      } catch {
        errors.push(`${product.productName}: 올바르지 않은 URL입니다.`);
        continue;
      }

      const result = await refreshPrice(product.id, true);

      if (!result.success && result.error) {
        errors.push(result.error);
      } else if (result.success) {
        successCount++;
      }

      // 마지막 상품이 아니면 4초 대기 (429 에러 방지)
      if (i < products.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 4000));
      }
    }

    if (errors.length > 0) {
      setError(`✅ 갱신 완료 - 성공: ${successCount}개, 실패: ${errors.length}개\n\n❌ 실패 목록:\n${errors.join('\n')}`);
    } else if (successCount > 0) {
      setError(`✅ 모든 상품 갱신 완료! (${successCount}개 성공)`);
    }

    setLoading(false);
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
            background: error.includes('✅') ? '#f0fdf4' : '#fff5f5',
            border: `1px solid ${error.includes('✅') ? '#bbf7d0' : '#feb2b2'}`,
            borderRadius: '6px',
            color: error.includes('✅') ? '#166534' : '#c53030',
            fontSize: '13px',
            whiteSpace: 'pre-line'
          }}>
            {error}
          </div>
        )}

        <div style={{
          fontSize: '12px',
          color: '#6c757d',
          marginTop: '8px'
        }}>
          💡 상품 URL을 추가하면 자동으로 상품명, 가격, 재고 정보를 가져옵니다.
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
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={removeInvalidProducts}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  background: 'transparent',
                  color: '#dc3545',
                  border: '1px solid #dc3545',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                🗑️ 잘못된 상품 삭제
              </button>
              <button
                onClick={refreshAllPrices}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  background: loading ? '#6c757d' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? '갱신 중...' : '🔄 전체 갱신'}
              </button>
            </div>
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
                          onClick={() => refreshPrice(product.id)}
                          disabled={loading}
                          style={{
                            padding: '6px 12px',
                            background: 'transparent',
                            border: '1px solid #3b82f6',
                            borderRadius: '4px',
                            color: loading ? '#6c757d' : '#3b82f6',
                            fontSize: '12px',
                            fontWeight: '500',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            marginRight: '4px'
                          }}
                          title="상품 페이지에서 최신 가격을 자동으로 가져옵니다"
                        >
                          🔄 갱신
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
          <li>경쟁사 상품 URL을 입력하면 <strong>자동으로 상품명, 가격, 재고 정보</strong>를 가져옵니다.</li>
          <li>지원 마켓: 네이버 스마트스토어, 쿠팡, G마켓, 11번가, 옥션, 인터파크</li>
          <li>🔄 갱신 버튼을 클릭하면 최신 가격을 자동으로 업데이트합니다.</li>
          <li>🔄 전체 갱신 버튼으로 모든 상품의 가격을 한 번에 업데이트할 수 있습니다.</li>
          <li>상품명을 클릭하면 수정할 수 있습니다.</li>
          <li>가격 변동이 있으면 변동률이 자동으로 표시됩니다.</li>
          <li>모든 데이터는 브라우저에 저장되어 다음 방문 시에도 유지됩니다.</li>
        </ul>
      </div>
    </div>
  );
}
