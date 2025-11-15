'use client';

import { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Edit2, Save, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

interface OptionValidationModalProps {
  show: boolean;
  onClose: () => void;
  orders: any[];
  onSave: (validatedOrders: any[]) => void;
  optionProducts: Map<string, any>;
}

export default function OptionValidationModal({
  show,
  onClose,
  orders,
  onSave,
  optionProducts
}: OptionValidationModalProps) {
  const [validatedOrders, setValidatedOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, matched: 0, unmatched: 0 });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [bulkEditFrom, setBulkEditFrom] = useState('');
  const [bulkEditTo, setBulkEditTo] = useState('');
  const [recommendedOptions, setRecommendedOptions] = useState<string[]>([]); // 추천 옵션상품 목록
  const [showMappingModal, setShowMappingModal] = useState(false);

  useEffect(() => {
    if (show && orders.length > 0) {
      validateOrders();
    }
  }, [show, orders, optionProducts]);

  // 문자열 유사도 계산 (Levenshtein Distance)
  const calculateSimilarity = (str1: string, str2: string): number => {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    if (s1 === s2) return 1;

    const len1 = s1.length;
    const len2 = s2.length;

    if (len1 === 0) return len2;
    if (len2 === 0) return len1;

    const matrix: number[][] = Array(len1 + 1)
      .fill(null)
      .map(() => Array(len2 + 1).fill(0));

    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    const distance = matrix[len1][len2];
    const maxLen = Math.max(len1, len2);
    return 1 - distance / maxLen;
  };

  // 유사한 옵션상품 찾기 (상위 N개)
  const findSimilarOptions = (targetOption: string, topN: number = 5): string[] => {
    const allOptions = Array.from(optionProducts.keys());
    const similarities = allOptions.map(option => ({
      option,
      score: calculateSimilarity(targetOption, option)
    }));

    return similarities
      .sort((a, b) => b.score - a.score)
      .slice(0, topN)
      .map(item => optionProducts.get(item.option)?.option_name || item.option);
  };

  // 옵션상품 검증 실행
  const validateOrders = (ordersToValidate?: any[]) => {
    const targetOrders = ordersToValidate || orders;
    const validated = targetOrders.map((order, index) => {
      const optionName = order.optionName || '';

      if (!optionName || optionName.trim() === '') {
        return {
          ...order,
          matchStatus: 'unmatched',
          verified: false,
          optionNameInDB: false
        };
      }

      const trimmedOption = optionName.trim().toLowerCase();
      const product = optionProducts.get(trimmedOption);

      if (product) {
        // 매칭 성공: 공급단가 적용
        return {
          ...order,
          matchStatus: 'matched',
          verified: true,
          optionNameInDB: true,
          unitPrice: product.seller_supply_price || 0,
          supplyPrice: (product.seller_supply_price || 0) * parseInt(order.quantity || '1')
        };
      } else {
        return {
          ...order,
          matchStatus: 'unmatched',
          verified: false,
          optionNameInDB: false
        };
      }
    });

    setValidatedOrders(validated);

    // 통계 계산
    const matchedCount = validated.filter(o => o.matchStatus === 'matched').length;
    const unmatchedCount = validated.filter(o => o.matchStatus === 'unmatched').length;

    setStats({
      total: validated.length,
      matched: matchedCount,
      unmatched: unmatchedCount
    });
  };

  // 개별 옵션상품 수정
  const handleEditOptionName = (index: number) => {
    setEditingIndex(index);
    setEditValue(validatedOrders[index].optionName || '');
  };

  // 개별 수정 저장
  const handleSaveEdit = async (index: number) => {
    const updated = [...validatedOrders];
    const optionName = editValue.trim();

    // 옵션상품 업데이트
    updated[index] = {
      ...updated[index],
      optionName: optionName,
      modified: true
    };

    // 즉시 재검증
    const trimmedOption = optionName.trim().toLowerCase();
    let product = optionProducts.get(trimmedOption);

    // Map에 없으면 DB에서 실시간 조회
    if (!product && optionName) {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('option_products')
          .select('option_name, option_code, seller_supply_price')
          .eq('option_name', optionName)
          .maybeSingle();

        if (!error && data) {
          product = data;
          // Map에도 추가
          optionProducts.set(trimmedOption, product);
        } else {
        }
      } catch (error) {
      }
    }


    if (product) {
      // 매칭 성공
      updated[index] = {
        ...updated[index],
        matchStatus: 'matched',
        verified: true,
        optionNameInDB: true,
        unitPrice: product.seller_supply_price || 0,
        supplyPrice: (product.seller_supply_price || 0) * parseInt(updated[index].quantity || '1')
      };
    } else {
      // 매칭 실패
      updated[index] = {
        ...updated[index],
        matchStatus: 'unmatched',
        verified: false,
        optionNameInDB: false,
        unitPrice: 0,
        supplyPrice: 0
      };
    }

    // 상태 업데이트
    setValidatedOrders(updated);

    // 통계 재계산
    const matchedCount = updated.filter(o => o.matchStatus === 'matched').length;
    const unmatchedCount = updated.filter(o => o.matchStatus === 'unmatched').length;
    setStats({
      total: updated.length,
      matched: matchedCount,
      unmatched: unmatchedCount
    });

    setEditingIndex(null);
    setEditValue('');
  };

  // 일괄 수정 실행
  const handleBulkEdit = () => {
    if (!bulkEditFrom.trim() || !bulkEditTo.trim()) {
      toast.error('수정할 옵션상품과 새 옵션상품을 모두 입력해주세요.', {
        position: 'top-center',
        duration: 3000
      });
      return;
    }

    const updated = validatedOrders.map(order => {
      if (order.optionName === bulkEditFrom) {
        const optionName = bulkEditTo.trim();
        const trimmedOption = optionName.trim().toLowerCase();
        const product = optionProducts.get(trimmedOption);

        if (product) {
          // 매칭 성공
          return {
            ...order,
            optionName: optionName,
            modified: true,
            matchStatus: 'matched',
            verified: true,
            optionNameInDB: true,
            unitPrice: product.seller_supply_price || 0,
            supplyPrice: (product.seller_supply_price || 0) * parseInt(order.quantity || '1')
          };
        } else {
          // 매칭 실패
          return {
            ...order,
            optionName: optionName,
            modified: true,
            matchStatus: 'unmatched',
            verified: false,
            optionNameInDB: false,
            unitPrice: 0,
            supplyPrice: 0
          };
        }
      }
      return order;
    });

    // 상태 업데이트
    setValidatedOrders(updated);

    // 통계 재계산
    const matchedCount = updated.filter(o => o.matchStatus === 'matched').length;
    const unmatchedCount = updated.filter(o => o.matchStatus === 'unmatched').length;
    setStats({
      total: updated.length,
      matched: matchedCount,
      unmatched: unmatchedCount
    });

    setBulkEditFrom('');
    setBulkEditTo('');
    setShowBulkEdit(false);
  };

  // DB 저장
  const handleSaveToDatabase = () => {
    // 미매칭건이 있으면 저장 불가
    if (stats.unmatched > 0) {
      toast.error('매칭 실패한 주문건은 발주서등록/확정이 불가능합니다.\n모든 옵션상품을 매칭해주세요.', {
        position: 'top-center',
        duration: 3000
      });
      return;
    }

    onSave(validatedOrders);
  };

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '20px',
      animation: 'fadeIn 0.3s ease-in-out'
    }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: '16px',
        width: '1200px',
        maxWidth: '95%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid var(--color-border)',
        animation: 'scaleIn 0.3s ease-in-out'
      }}>
        {/* 헤더 */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: 'var(--color-text)',
              margin: '0 0 8px 0'
            }}>
              옵션상품 검증
            </h2>
            <p style={{
              fontSize: '14px',
              color: 'var(--color-text-secondary)',
              margin: 0
            }}>
              매칭에 실패한 옵션상품을 수정해주세요. 좌측 메뉴의{' '}
              <button
                onClick={() => setShowMappingModal(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  color: '#2563eb',
                  fontWeight: '600',
                  textDecoration: 'none',
                  borderBottom: '1px solid #2563eb',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
              >
                옵션상품매핑
                <ExternalLink size={12} />
              </button>{' '}
              탭에서 미리 설정해두시면 다음부터는 수정작업 없이 바로 등록이 가능합니다.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              padding: 0
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* 통계 */}
        <div style={{
          padding: '20px 24px',
          background: 'var(--color-surface-hover)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          gap: '24px',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>총 주문:</span>
            <span style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-text)', marginLeft: '8px' }}>
              {stats.total}건
            </span>
          </div>
          <div>
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>매칭 성공:</span>
            <span style={{ fontSize: '18px', fontWeight: '700', color: '#059669', marginLeft: '8px' }}>
              {stats.matched}건
            </span>
          </div>
          <div>
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>매칭 실패:</span>
            <span style={{ fontSize: '18px', fontWeight: '700', color: '#dc2626', marginLeft: '8px' }}>
              {stats.unmatched}건
            </span>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <button
              onClick={() => {
                if (!showBulkEdit) {
                  // 매칭 실패한 첫 번째 옵션상품 찾기
                  const unmatchedOrder = validatedOrders.find(o => o.matchStatus === 'unmatched');
                  if (unmatchedOrder?.optionName) {
                    const failedOptionName = unmatchedOrder.optionName;
                    // 추천 옵션상품 계산 (상위 5개)
                    const recommendations = findSimilarOptions(failedOptionName, 5);
                    setRecommendedOptions(recommendations);
                    setBulkEditFrom(failedOptionName);
                    setBulkEditTo(recommendations[0] || '');
                  } else {
                    // 매칭 실패한 주문이 없으면 초기화
                    setRecommendedOptions([]);
                    setBulkEditFrom('');
                    setBulkEditTo('');
                  }
                }
                setShowBulkEdit(!showBulkEdit);
              }}
              style={{
                padding: '8px 16px',
                background: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              옵션상품 일괄수정
            </button>
          </div>
        </div>

        {/* 일괄수정 패널 */}
        {showBulkEdit && (
          <div style={{
            padding: '16px 24px',
            background: 'var(--color-surface-hover)',
            borderBottom: '1px solid var(--color-border)'
          }}>
            <div style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              marginBottom: recommendedOptions.length > 1 ? '12px' : '0'
            }}>
              <input
                type="text"
                placeholder="수정할 옵션상품"
                value={bulkEditFrom}
                onChange={(e) => setBulkEditFrom(e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  fontSize: '13px',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text)'
                }}
              />
              <span style={{ color: 'var(--color-text-secondary)' }}>→</span>
              <input
                type="text"
                placeholder="새 옵션상품"
                value={bulkEditTo}
                onChange={(e) => setBulkEditTo(e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  fontSize: '13px',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text)'
                }}
              />
              <button
                onClick={handleBulkEdit}
                style={{
                  padding: '8px 16px',
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                일괄 적용
              </button>
            </div>

            {/* 추천 옵션상품 버튼 (2~5순위) */}
            {recommendedOptions.length > 1 && (
              <div style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                flexWrap: 'wrap'
              }}>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginRight: '4px' }}>
                  추천 옵션상품:
                </span>
                {recommendedOptions.slice(1, 5).map((option, index) => (
                  <button
                    key={index}
                    onClick={() => setBulkEditTo(option)}
                    style={{
                      padding: '6px 12px',
                      background: bulkEditTo === option ? '#2563eb' : 'var(--color-surface)',
                      color: bulkEditTo === option ? '#ffffff' : 'var(--color-text)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '6px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 주문 목록 */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '16px 24px',
          background: 'var(--color-surface-hover)'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '13px'
          }}>
            <thead style={{
              position: 'sticky',
              top: 0,
              background: 'var(--color-surface-hover)',
              zIndex: 1
            }}>
              <tr>
                <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '2px solid var(--color-border)', fontWeight: '600', color: 'var(--color-text)' }}>상태</th>
                <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '2px solid var(--color-border)', fontWeight: '600', color: 'var(--color-text)' }}>주문번호</th>
                <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '2px solid var(--color-border)', fontWeight: '600', color: 'var(--color-text)' }}>옵션상품</th>
                <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '2px solid var(--color-border)', fontWeight: '600', color: 'var(--color-text)' }}>수량</th>
                <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '2px solid var(--color-border)', fontWeight: '600', color: 'var(--color-text)' }}>공급단가</th>
                <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '2px solid var(--color-border)', fontWeight: '600', color: 'var(--color-text)' }}>공급가</th>
                <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '2px solid var(--color-border)', fontWeight: '600', color: 'var(--color-text)' }}>수정</th>
              </tr>
            </thead>
            <tbody>
              {validatedOrders.map((order, index) => (
                <tr key={index} style={{
                  borderBottom: '1px solid var(--color-border)',
                  background: 'transparent'
                }}>
                  <td style={{ padding: '12px 8px' }}>
                    {order.matchStatus === 'matched' ? (
                      <CheckCircle size={18} color="#059669" />
                    ) : (
                      <AlertCircle size={18} color="#dc2626" />
                    )}
                  </td>
                  <td style={{ padding: '12px 8px', color: 'var(--color-text)' }}>{order.orderNumber}</td>
                  <td style={{ padding: '12px 8px' }}>
                    {editingIndex === index ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          style={{
                            flex: 1,
                            padding: '6px 8px',
                            border: '1px solid var(--color-border)',
                            borderRadius: '4px',
                            fontSize: '13px',
                            background: 'var(--color-surface)',
                            color: 'var(--color-text)'
                          }}
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveEdit(index)}
                          style={{
                            padding: '6px 12px',
                            background: '#059669',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          <Save size={14} />
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: order.matchStatus === 'matched' ? '#059669' : '#dc2626', fontWeight: '500' }}>
                        {order.optionName}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'center', color: 'var(--color-text)' }}>{order.quantity}</td>
                  <td style={{ padding: '12px 8px', textAlign: 'right', color: 'var(--color-text)' }}>
                    {order.unitPrice ? `${order.unitPrice.toLocaleString()}원` : '-'}
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'right', color: 'var(--color-text)', fontWeight: '600' }}>
                    {order.supplyPrice ? `${order.supplyPrice.toLocaleString()}원` : '0원'}
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                    {editingIndex !== index && (
                      <button
                        onClick={() => handleEditOptionName(index)}
                        style={{
                          padding: '4px 8px',
                          background: 'none',
                          border: '1px solid var(--color-border)',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          color: 'var(--color-text-secondary)'
                        }}
                      >
                        <Edit2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 푸터 */}
        <div style={{
          padding: '20px 24px',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--color-surface-hover)'
        }}>
          <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            {stats.unmatched > 0 ? (
              <>
                <AlertCircle size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} color="#dc2626" />
                매칭 실패한 주문건은 발주서등록/확정이 불가능합니다
              </>
            ) : (
              <>
                <CheckCircle size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} color="#059669" />
                모든 옵션상품이 성공적으로 매칭되었습니다
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                background: 'var(--color-surface)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              취소
            </button>
            <button
              onClick={handleSaveToDatabase}
              disabled={stats.unmatched > 0}
              style={{
                padding: '10px 20px',
                background: stats.unmatched > 0 ? '#9ca3af' : '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: stats.unmatched > 0 ? 'not-allowed' : 'pointer',
                opacity: stats.unmatched > 0 ? 0.6 : 1
              }}
            >
              발주서등록
            </button>
          </div>
        </div>
      </div>

      {/* 옵션상품매핑 플로팅 모달 */}
      {showMappingModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3000,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--color-surface)',
            borderRadius: '16px',
            width: '95%',
            height: '90vh',
            maxWidth: '1400px',
            border: '1px solid var(--color-border)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* 헤더 */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--color-surface-hover)'
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: 'var(--color-text)',
                margin: 0
              }}>
                옵션상품매핑 설정
              </h2>
              <button
                onClick={() => setShowMappingModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                <X size={24} />
              </button>
            </div>

            {/* iframe 컨텐츠 */}
            <div style={{
              flex: 1,
              overflow: 'hidden'
            }}>
              <iframe
                src="/platform/orders?tab=옵션상품매핑&modal=true"
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none'
                }}
                title="옵션상품매핑 설정"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
