// src/components/tools/TransactionStatement.jsx
import { useState } from 'react';

function TransactionStatement() {
  const [companyInfo, setCompanyInfo] = useState({
    sellerName: '달래마켓',
    sellerBizNo: '123-45-67890',
    sellerAddress: '서울시 강남구 테헤란로 123',
    sellerTel: '02-1234-5678',
    sellerCeo: '홍길동'
  });

  const [buyerInfo, setBuyerInfo] = useState({
    buyerName: '',
    buyerBizNo: '',
    buyerAddress: '',
    buyerTel: '',
    buyerCeo: ''
  });

  const [transactionInfo, setTransactionInfo] = useState({
    date: new Date().toISOString().split('T')[0],
    statementNo: `ST-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-001`,
    paymentTerms: 'cash',
    deliveryDate: '',
    notes: ''
  });

  const [items, setItems] = useState([
    { id: 1, name: '', specification: '', quantity: 0, unitPrice: 0, amount: 0, remarks: '' }
  ]);

  const [exportFormat, setExportFormat] = useState('pdf');
  const [previewMode, setPreviewMode] = useState(false);

  const addItem = () => {
    setItems([...items, {
      id: Math.max(...items.map(i => i.id)) + 1,
      name: '',
      specification: '',
      quantity: 0,
      unitPrice: 0,
      amount: 0,
      remarks: ''
    }]);
  };

  const updateItem = (id, field, value) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updated.amount = (parseFloat(updated.quantity) || 0) * (parseFloat(updated.unitPrice) || 0);
        }
        return updated;
      }
      return item;
    }));
  };

  const deleteItem = (id) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.amount || 0), 0);
  };

  const calculateTax = () => {
    return calculateTotal() * 0.1;
  };

  const calculateGrandTotal = () => {
    return calculateTotal() + calculateTax();
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('ko-KR').format(Math.round(num));
  };

  const handleExport = () => {
    alert(`거래명세서가 ${exportFormat.toUpperCase()} 형식으로 다운로드되었습니다.`);
  };

  const StatementPreview = () => (
    <div style={{
      background: '#ffffff',
      padding: '40px',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      {/* 헤더 */}
      <div style={{
        textAlign: 'center',
        marginBottom: '30px',
        paddingBottom: '20px',
        borderBottom: '2px solid #212529'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '600',
          marginBottom: '8px'
        }}>
          거래명세서
        </h1>
        <div style={{ fontSize: '14px', color: '#6c757d' }}>
          No. {transactionInfo.statementNo}
        </div>
      </div>

      {/* 거래처 정보 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '30px',
        marginBottom: '30px'
      }}>
        {/* 공급자 */}
        <div style={{
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          padding: '16px'
        }}>
          <h3 style={{
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '12px',
            color: '#2563eb'
          }}>
            공급자
          </h3>
          <table style={{ width: '100%', fontSize: '13px' }}>
            <tbody>
              <tr>
                <td style={{ padding: '4px 0', color: '#6c757d', width: '80px' }}>상호</td>
                <td style={{ padding: '4px 0', fontWeight: '500' }}>{companyInfo.sellerName}</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0', color: '#6c757d' }}>사업자번호</td>
                <td style={{ padding: '4px 0' }}>{companyInfo.sellerBizNo}</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0', color: '#6c757d' }}>대표자</td>
                <td style={{ padding: '4px 0' }}>{companyInfo.sellerCeo}</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0', color: '#6c757d' }}>주소</td>
                <td style={{ padding: '4px 0' }}>{companyInfo.sellerAddress}</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0', color: '#6c757d' }}>전화</td>
                <td style={{ padding: '4px 0' }}>{companyInfo.sellerTel}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 공급받는자 */}
        <div style={{
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          padding: '16px'
        }}>
          <h3 style={{
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '12px',
            color: '#2563eb'
          }}>
            공급받는자
          </h3>
          <table style={{ width: '100%', fontSize: '13px' }}>
            <tbody>
              <tr>
                <td style={{ padding: '4px 0', color: '#6c757d', width: '80px' }}>상호</td>
                <td style={{ padding: '4px 0', fontWeight: '500' }}>{buyerInfo.buyerName || '-'}</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0', color: '#6c757d' }}>사업자번호</td>
                <td style={{ padding: '4px 0' }}>{buyerInfo.buyerBizNo || '-'}</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0', color: '#6c757d' }}>대표자</td>
                <td style={{ padding: '4px 0' }}>{buyerInfo.buyerCeo || '-'}</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0', color: '#6c757d' }}>주소</td>
                <td style={{ padding: '4px 0' }}>{buyerInfo.buyerAddress || '-'}</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0', color: '#6c757d' }}>전화</td>
                <td style={{ padding: '4px 0' }}>{buyerInfo.buyerTel || '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 거래 정보 */}
      <div style={{
        display: 'flex',
        gap: '20px',
        marginBottom: '20px',
        padding: '12px',
        background: '#f8f9fa',
        borderRadius: '8px'
      }}>
        <div style={{ fontSize: '13px' }}>
          <span style={{ color: '#6c757d' }}>거래일자: </span>
          <span style={{ fontWeight: '500' }}>{transactionInfo.date}</span>
        </div>
        <div style={{ fontSize: '13px' }}>
          <span style={{ color: '#6c757d' }}>결제조건: </span>
          <span style={{ fontWeight: '500' }}>
            {transactionInfo.paymentTerms === 'cash' ? '현금' : 
             transactionInfo.paymentTerms === 'card' ? '카드' : '계좌이체'}
          </span>
        </div>
        {transactionInfo.deliveryDate && (
          <div style={{ fontSize: '13px' }}>
            <span style={{ color: '#6c757d' }}>납품일: </span>
            <span style={{ fontWeight: '500' }}>{transactionInfo.deliveryDate}</span>
          </div>
        )}
      </div>

      {/* 품목 테이블 */}
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        marginBottom: '20px'
      }}>
        <thead>
          <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
            <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', width: '40px' }}>번호</th>
            <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px' }}>품목</th>
            <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px' }}>규격</th>
            <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', width: '80px' }}>수량</th>
            <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', width: '100px' }}>단가</th>
            <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', width: '120px' }}>금액</th>
            <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', width: '100px' }}>비고</th>
          </tr>
        </thead>
        <tbody>
          {items.filter(item => item.name).map((item, idx) => (
            <tr key={item.id} style={{ borderBottom: '1px solid #f1f3f5' }}>
              <td style={{ padding: '10px', textAlign: 'center', fontSize: '13px' }}>{idx + 1}</td>
              <td style={{ padding: '10px', fontSize: '13px' }}>{item.name}</td>
              <td style={{ padding: '10px', fontSize: '13px' }}>{item.specification}</td>
              <td style={{ padding: '10px', textAlign: 'right', fontSize: '13px' }}>{item.quantity}</td>
              <td style={{ padding: '10px', textAlign: 'right', fontSize: '13px' }}>{formatNumber(item.unitPrice)}</td>
              <td style={{ padding: '10px', textAlign: 'right', fontSize: '13px', fontWeight: '500' }}>{formatNumber(item.amount)}</td>
              <td style={{ padding: '10px', fontSize: '13px' }}>{item.remarks}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 합계 */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        marginBottom: '30px'
      }}>
        <div style={{
          width: '300px',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          padding: '16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
            <span>공급가액</span>
            <span style={{ fontWeight: '500' }}>{formatNumber(calculateTotal())}원</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
            <span>부가세</span>
            <span style={{ fontWeight: '500' }}>{formatNumber(calculateTax())}원</span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: '8px',
            borderTop: '1px solid #dee2e6',
            fontSize: '16px',
            fontWeight: '600',
            color: '#2563eb'
          }}>
            <span>합계금액</span>
            <span>{formatNumber(calculateGrandTotal())}원</span>
          </div>
        </div>
      </div>

      {/* 비고 */}
      {transactionInfo.notes && (
        <div style={{
          padding: '16px',
          background: '#f8f9fa',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>비고</h4>
          <p style={{ fontSize: '13px', color: '#495057', margin: 0 }}>
            {transactionInfo.notes}
          </p>
        </div>
      )}

      {/* 푸터 */}
      <div style={{
        textAlign: 'center',
        paddingTop: '20px',
        borderTop: '1px solid #dee2e6',
        fontSize: '13px',
        color: '#6c757d'
      }}>
        위 금액을 정히 청구합니다.
      </div>
    </div>
  );

  return (
    <div style={{
      padding: '32px',
      maxWidth: '1400px',
      margin: '0 auto'
    }}>
      {/* 헤더 */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{
          fontSize: '28px',
          fontWeight: '600',
          marginBottom: '8px',
          background: 'linear-gradient(135deg, #cfd9df 0%, #e2ebf0 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          거래명세서 즉시 발급
        </h2>
        <p style={{
          fontSize: '14px',
          color: '#6c757d'
        }}>
          거래명세서를 PDF, JPG, PNG로 즉시 발급합니다
        </p>
      </div>

      {!previewMode ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* 왼쪽: 거래처 정보 */}
          <div>
            {/* 공급자 정보 */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #dee2e6',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '24px'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>
                공급자 정보
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.entries({
                  sellerName: '상호',
                  sellerBizNo: '사업자번호',
                  sellerCeo: '대표자',
                  sellerAddress: '주소',
                  sellerTel: '전화번호'
                }).map(([key, label]) => (
                  <div key={key}>
                    <label style={{
                      display: 'block',
                      fontSize: '13px',
                      color: '#495057',
                      marginBottom: '4px',
                      fontWeight: '500'
                    }}>
                      {label}
                    </label>
                    <input
                      type="text"
                      value={companyInfo[key]}
                      onChange={(e) => setCompanyInfo({...companyInfo, [key]: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #dee2e6',
                        borderRadius: '6px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 공급받는자 정보 */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #dee2e6',
              borderRadius: '16px',
              padding: '24px'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>
                공급받는자 정보
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.entries({
                  buyerName: '상호',
                  buyerBizNo: '사업자번호',
                  buyerCeo: '대표자',
                  buyerAddress: '주소',
                  buyerTel: '전화번호'
                }).map(([key, label]) => (
                  <div key={key}>
                    <label style={{
                      display: 'block',
                      fontSize: '13px',
                      color: '#495057',
                      marginBottom: '4px',
                      fontWeight: '500'
                    }}>
                      {label}
                    </label>
                    <input
                      type="text"
                      value={buyerInfo[key]}
                      onChange={(e) => setBuyerInfo({...buyerInfo, [key]: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #dee2e6',
                        borderRadius: '6px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 오른쪽: 거래 내역 */}
          <div>
            {/* 거래 정보 */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #dee2e6',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '24px'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>
                거래 정보
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    color: '#495057',
                    marginBottom: '4px',
                    fontWeight: '500'
                  }}>
                    거래일자
                  </label>
                  <input
                    type="date"
                    value={transactionInfo.date}
                    onChange={(e) => setTransactionInfo({...transactionInfo, date: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #dee2e6',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    color: '#495057',
                    marginBottom: '4px',
                    fontWeight: '500'
                  }}>
                    명세서 번호
                  </label>
                  <input
                    type="text"
                    value={transactionInfo.statementNo}
                    onChange={(e) => setTransactionInfo({...transactionInfo, statementNo: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #dee2e6',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    color: '#495057',
                    marginBottom: '4px',
                    fontWeight: '500'
                  }}>
                    결제조건
                  </label>
                  <select
                    value={transactionInfo.paymentTerms}
                    onChange={(e) => setTransactionInfo({...transactionInfo, paymentTerms: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #dee2e6',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      background: '#ffffff'
                    }}
                  >
                    <option value="cash">현금</option>
                    <option value="card">카드</option>
                    <option value="transfer">계좌이체</option>
                  </select>
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    color: '#495057',
                    marginBottom: '4px',
                    fontWeight: '500'
                  }}>
                    납품일 (선택)
                  </label>
                  <input
                    type="date"
                    value={transactionInfo.deliveryDate}
                    onChange={(e) => setTransactionInfo({...transactionInfo, deliveryDate: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #dee2e6',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
              <div style={{ marginTop: '12px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  color: '#495057',
                  marginBottom: '4px',
                  fontWeight: '500'
                }}>
                  비고
                </label>
                <textarea
                  value={transactionInfo.notes}
                  onChange={(e) => setTransactionInfo({...transactionInfo, notes: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'vertical',
                    minHeight: '60px'
                  }}
                />
              </div>
            </div>

            {/* 품목 입력 */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #dee2e6',
              borderRadius: '16px',
              padding: '24px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600' }}>
                  품목 정보
                </h3>
                <button
                  onClick={addItem}
                  style={{
                    padding: '6px 12px',
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  + 품목 추가
                </button>
              </div>

              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {items.map((item, idx) => (
                  <div key={item.id} style={{
                    padding: '12px',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    marginBottom: '8px'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <span style={{ fontSize: '13px', fontWeight: '500' }}>품목 {idx + 1}</span>
                      {items.length > 1 && (
                        <button
                          onClick={() => deleteItem(item.id)}
                          style={{
                            padding: '4px 8px',
                            background: '#ef4444',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                        >
                          삭제
                        </button>
                      )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="품목명"
                        value={item.name}
                        onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                        style={{
                          padding: '6px 8px',
                          border: '1px solid #dee2e6',
                          borderRadius: '4px',
                          fontSize: '13px',
                          outline: 'none'
                        }}
                      />
                      <input
                        type="text"
                        placeholder="규격"
                        value={item.specification}
                        onChange={(e) => updateItem(item.id, 'specification', e.target.value)}
                        style={{
                          padding: '6px 8px',
                          border: '1px solid #dee2e6',
                          borderRadius: '4px',
                          fontSize: '13px',
                          outline: 'none'
                        }}
                      />
                      <input
                        type="number"
                        placeholder="수량"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                        style={{
                          padding: '6px 8px',
                          border: '1px solid #dee2e6',
                          borderRadius: '4px',
                          fontSize: '13px',
                          outline: 'none'
                        }}
                      />
                      <input
                        type="number"
                        placeholder="단가"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value)}
                        style={{
                          padding: '6px 8px',
                          border: '1px solid #dee2e6',
                          borderRadius: '4px',
                          fontSize: '13px',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginTop: '8px'
                    }}>
                      <input
                        type="text"
                        placeholder="비고"
                        value={item.remarks}
                        onChange={(e) => updateItem(item.id, 'remarks', e.target.value)}
                        style={{
                          flex: 1,
                          marginRight: '8px',
                          padding: '6px 8px',
                          border: '1px solid #dee2e6',
                          borderRadius: '4px',
                          fontSize: '13px',
                          outline: 'none'
                        }}
                      />
                      <div style={{
                        padding: '6px 12px',
                        background: '#2563eb',
                        color: '#ffffff',
                        borderRadius: '4px',
                        fontSize: '13px',
                        fontWeight: '500'
                      }}>
                        금액: {formatNumber(item.amount)}원
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 합계 */}
              <div style={{
                marginTop: '16px',
                padding: '16px',
                background: '#e7f3ff',
                borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                  <span>공급가액</span>
                  <span style={{ fontWeight: '500' }}>{formatNumber(calculateTotal())}원</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                  <span>부가세 (10%)</span>
                  <span style={{ fontWeight: '500' }}>{formatNumber(calculateTax())}원</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '8px',
                  borderTop: '1px solid #2563eb',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#2563eb'
                }}>
                  <span>합계</span>
                  <span>{formatNumber(calculateGrandTotal())}원</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <StatementPreview />
      )}

      {/* 하단 버튼 */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '12px',
        marginTop: '32px'
      }}>
        <button
          onClick={() => setPreviewMode(!previewMode)}
          style={{
            padding: '12px 24px',
            background: '#ffffff',
            color: '#2563eb',
            border: '1px solid #2563eb',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          {previewMode ? '편집하기' : '미리보기'}
        </button>

        {previewMode && (
          <>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              style={{
                padding: '12px 16px',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                background: '#ffffff'
              }}
            >
              <option value="pdf">PDF</option>
              <option value="jpg">JPG</option>
              <option value="png">PNG</option>
            </select>

            <button
              onClick={handleExport}
              style={{
                padding: '12px 24px',
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              다운로드 ({exportFormat.toUpperCase()})
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default TransactionStatement;