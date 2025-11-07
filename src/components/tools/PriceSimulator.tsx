'use client';

import { useState } from 'react';

export default function PriceSimulator() {
  const [supplyPrice, setSupplyPrice] = useState<string>('');
  const [platformFee, setPlatformFee] = useState<string>('10'); // 플랫폼 수수료 (%)
  const [shippingCost, setShippingCost] = useState<string>('');
  const [targetMargin, setTargetMargin] = useState<string>('30'); // 목표 마진율 (%)

  const [result, setResult] = useState<{
    recommendedPrice: number;
    finalMargin: number;
    finalMarginRate: number;
    platformFeeAmount: number;
    totalCost: number;
  } | null>(null);

  const calculatePrice = () => {
    const supply = parseFloat(supplyPrice);
    const fee = parseFloat(platformFee);
    const shipping = parseFloat(shippingCost) || 0;
    const margin = parseFloat(targetMargin);

    if (isNaN(supply) || supply <= 0) {
      alert('공급가를 입력해주세요.');
      return;
    }

    if (isNaN(fee) || fee < 0 || fee >= 100) {
      alert('플랫폼 수수료를 0~100 사이로 입력해주세요.');
      return;
    }

    if (isNaN(margin) || margin <= 0 || margin >= 100) {
      alert('목표 마진율을 0~100 사이로 입력해주세요.');
      return;
    }

    // 총 원가 = 공급가 + 배송비
    const totalCost = supply + shipping;

    // 판매가 계산
    // 판매가 - (판매가 * 수수료율) - 총원가 = 마진
    // 마진율 = 마진 / 판매가
    // 판매가 * (1 - 수수료율) - 총원가 = 판매가 * 마진율
    // 판매가 * (1 - 수수료율 - 마진율) = 총원가
    // 판매가 = 총원가 / (1 - 수수료율/100 - 마진율/100)

    const recommendedPrice = Math.ceil(totalCost / (1 - fee/100 - margin/100));
    const platformFeeAmount = Math.floor(recommendedPrice * fee / 100);
    const finalMargin = recommendedPrice - platformFeeAmount - totalCost;
    const finalMarginRate = (finalMargin / recommendedPrice) * 100;

    setResult({
      recommendedPrice,
      finalMargin,
      finalMarginRate,
      platformFeeAmount,
      totalCost
    });
  };

  const handleReset = () => {
    setSupplyPrice('');
    setPlatformFee('10');
    setShippingCost('');
    setTargetMargin('30');
    setResult(null);
  };

  return (
    <div>
      <p style={{
        fontSize: '14px',
        color: '#6c757d',
        lineHeight: '1.6',
        marginBottom: '24px'
      }}>
        공급가, 수수료, 배송비를 고려하여 목표 마진율을 달성하는 최적의 판매가를 계산합니다.
      </p>

      {/* 입력 영역 */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '8px',
            color: '#495057'
          }}>
            공급가 (원)
          </label>
          <input
            type="number"
            value={supplyPrice}
            onChange={(e) => setSupplyPrice(e.target.value)}
            placeholder="공급가를 입력하세요"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '8px',
            color: '#495057'
          }}>
            플랫폼 수수료 (%)
          </label>
          <input
            type="number"
            value={platformFee}
            onChange={(e) => setPlatformFee(e.target.value)}
            placeholder="플랫폼 수수료율"
            min="0"
            max="100"
            step="0.1"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '8px',
            color: '#495057'
          }}>
            배송비 (원) <span style={{ fontSize: '12px', color: '#6c757d' }}>선택사항</span>
          </label>
          <input
            type="number"
            value={shippingCost}
            onChange={(e) => setShippingCost(e.target.value)}
            placeholder="배송비 (없으면 0)"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '8px',
            color: '#495057'
          }}>
            목표 마진율 (%)
          </label>
          <input
            type="number"
            value={targetMargin}
            onChange={(e) => setTargetMargin(e.target.value)}
            placeholder="목표 마진율"
            min="0"
            max="100"
            step="0.1"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* 버튼 */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button
          onClick={calculatePrice}
          style={{
            flex: 1,
            padding: '12px',
            background: '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          계산하기
        </button>
        <button
          onClick={handleReset}
          style={{
            padding: '12px 24px',
            background: '#6c757d',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          초기화
        </button>
      </div>

      {/* 결과 */}
      {result && (
        <div style={{
          background: '#f8f9fa',
          borderRadius: '8px',
          padding: '20px',
          border: '2px solid #2563eb'
        }}>
          <h4 style={{
            fontSize: '16px',
            fontWeight: '600',
            marginBottom: '16px',
            color: '#2563eb'
          }}>
            계산 결과
          </h4>

          <div style={{ marginBottom: '16px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '12px',
              background: '#ffffff',
              borderRadius: '6px',
              marginBottom: '8px'
            }}>
              <span style={{ fontSize: '14px', color: '#6c757d' }}>권장 판매가</span>
              <span style={{ fontSize: '20px', fontWeight: '700', color: '#2563eb' }}>
                {result.recommendedPrice.toLocaleString()}원
              </span>
            </div>

            <div style={{ padding: '12px', background: '#ffffff', borderRadius: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: '#6c757d' }}>총 원가 (공급가 + 배송비)</span>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>
                  {result.totalCost.toLocaleString()}원
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: '#6c757d' }}>플랫폼 수수료</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#dc2626' }}>
                  -{result.platformFeeAmount.toLocaleString()}원
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '8px',
                borderTop: '1px solid #dee2e6'
              }}>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>실제 마진</span>
                <span style={{ fontSize: '16px', fontWeight: '700', color: '#16a34a' }}>
                  {result.finalMargin.toLocaleString()}원 ({result.finalMarginRate.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>

          <div style={{
            fontSize: '12px',
            color: '#6c757d',
            padding: '12px',
            background: '#e0f2fe',
            borderRadius: '6px'
          }}>
            💡 수수료와 배송비를 고려한 최적의 판매가입니다.
          </div>
        </div>
      )}
    </div>
  );
}
