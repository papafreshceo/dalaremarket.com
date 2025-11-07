'use client';

import { useState } from 'react';

export default function DiscountCalculator() {
  const [supplyPrice, setSupplyPrice] = useState<string>('');
  const [sellingPrice, setSellingPrice] = useState<string>('');
  const [targetMargin, setTargetMargin] = useState<string>('20');

  const [result, setResult] = useState<{
    maxDiscountRate: number;
    maxDiscountAmount: number;
    discountedPrice: number;
    finalMargin: number;
    finalMarginRate: number;
  } | null>(null);

  const calculateDiscount = () => {
    const supply = parseFloat(supplyPrice);
    const selling = parseFloat(sellingPrice);
    const margin = parseFloat(targetMargin);

    if (isNaN(supply) || supply <= 0) {
      alert('공급가를 입력해주세요.');
      return;
    }

    if (isNaN(selling) || selling <= 0) {
      alert('판매가를 입력해주세요.');
      return;
    }

    if (selling <= supply) {
      alert('판매가는 공급가보다 커야 합니다.');
      return;
    }

    if (isNaN(margin) || margin < 0 || margin >= 100) {
      alert('목표 마진율을 0~100 사이로 입력해주세요.');
      return;
    }

    // 목표 마진을 유지하는 최저 판매가 계산
    const minPrice = supply / (1 - margin / 100);

    // 최대 할인액 = 판매가 - 최저 판매가
    const maxDiscountAmount = selling - minPrice;

    // 최대 할인율 = (할인액 / 판매가) * 100
    const maxDiscountRate = (maxDiscountAmount / selling) * 100;

    // 할인 후 가격
    const discountedPrice = Math.ceil(minPrice);

    // 실제 마진
    const finalMargin = discountedPrice - supply;
    const finalMarginRate = (finalMargin / discountedPrice) * 100;

    setResult({
      maxDiscountRate,
      maxDiscountAmount,
      discountedPrice,
      finalMargin,
      finalMarginRate
    });
  };

  const handleReset = () => {
    setSupplyPrice('');
    setSellingPrice('');
    setTargetMargin('20');
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
        목표 마진율을 유지하면서 적용할 수 있는 최대 할인율을 계산합니다.
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
            현재 판매가 (원)
          </label>
          <input
            type="number"
            value={sellingPrice}
            onChange={(e) => setSellingPrice(e.target.value)}
            placeholder="판매가를 입력하세요"
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
            유지할 목표 마진율 (%)
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
          onClick={calculateDiscount}
          style={{
            flex: 1,
            padding: '12px',
            background: '#dc2626',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          최대 할인율 계산
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
          background: '#fef2f2',
          borderRadius: '8px',
          padding: '20px',
          border: '2px solid #dc2626'
        }}>
          <h4 style={{
            fontSize: '16px',
            fontWeight: '600',
            marginBottom: '16px',
            color: '#dc2626'
          }}>
            최대 할인 계산 결과
          </h4>

          <div style={{
            background: '#ffffff',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '12px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <span style={{ fontSize: '14px', color: '#6c757d' }}>최대 할인율</span>
              <span style={{ fontSize: '24px', fontWeight: '700', color: '#dc2626' }}>
                {result.maxDiscountRate.toFixed(1)}%
              </span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '14px', color: '#6c757d' }}>최대 할인액</span>
              <span style={{ fontSize: '20px', fontWeight: '600', color: '#dc2626' }}>
                {Math.floor(result.maxDiscountAmount).toLocaleString()}원
              </span>
            </div>
          </div>

          <div style={{
            background: '#ffffff',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '12px'
          }}>
            <div style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: '#6c757d' }}>원가격</span>
                <span style={{ fontSize: '14px', textDecoration: 'line-through', color: '#9ca3af' }}>
                  {parseFloat(sellingPrice).toLocaleString()}원
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>할인 후 가격</span>
                <span style={{ fontSize: '18px', fontWeight: '700', color: '#2563eb' }}>
                  {result.discountedPrice.toLocaleString()}원
                </span>
              </div>
            </div>
            <div style={{
              paddingTop: '12px',
              borderTop: '1px solid #f1f1f1',
              fontSize: '13px',
              color: '#6c757d'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>유지되는 마진</span>
                <span style={{ fontWeight: '600', color: '#16a34a' }}>
                  {result.finalMargin.toLocaleString()}원 ({result.finalMarginRate.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>

          <div style={{
            fontSize: '12px',
            color: '#7c2d12',
            padding: '12px',
            background: '#fff7ed',
            borderRadius: '6px'
          }}>
            ⚠️ 이 할인율까지만 적용해야 목표 마진율({targetMargin}%)을 유지할 수 있습니다.
          </div>
        </div>
      )}
    </div>
  );
}
