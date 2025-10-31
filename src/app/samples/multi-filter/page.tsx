'use client';

import { useState } from 'react';
import Link from 'next/link';

// 샘플 데이터
const SAMPLE_PRODUCTS = [
  '감자', '고구마', '양파', '당근', '배추', '무', '상추', '시금치', '브로콜리', '파프리카'
];

const SAMPLE_MARKETS = ['스마트스토어', '쿠팡', '11번가', '옥션'];

// 날짜별 샘플 데이터 생성
const generateSampleData = (selectedProducts: string[]) => {
  const dates = ['2025-01-01', '2025-01-02', '2025-01-03', '2025-01-04', '2025-01-05'];

  return SAMPLE_MARKETS.map((market, idx) => ({
    market,
    color: ['#6366f1', '#ef4444', '#10b981', '#f59e0b'][idx],
    data: dates.map(date => ({
      date,
      amount: selectedProducts.length > 0
        ? Math.random() * 100000 * selectedProducts.length
        : Math.random() * 200000
    }))
  }));
};

export default function MultiFilterSamplesPage() {
  return (
    <div style={{
      padding: '40px',
      maxWidth: '1400px',
      margin: '0 auto',
      background: '#f9fafb',
      minHeight: '100vh'
    }}>
      <h1 style={{
        fontSize: '28px',
        fontWeight: '700',
        marginBottom: '16px',
        color: '#111827'
      }}>
        다중 필터 그래프 샘플 페이지
      </h1>
      <p style={{
        fontSize: '14px',
        color: '#6b7280',
        marginBottom: '32px'
      }}>
        3가지 다른 방식의 다중 품목 선택 및 그래프 필터링 방식을 비교해보세요.
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        marginBottom: '40px'
      }}>
        <Link href="/samples/multi-filter/checkbox" style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            border: '2px solid transparent'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.2)';
            e.currentTarget.style.borderColor = '#6366f1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
            e.currentTarget.style.borderColor = 'transparent';
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              fontSize: '24px'
            }}>
              ☑️
            </div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '8px',
              color: '#111827'
            }}>
              방법 1: 체크박스 방식
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              lineHeight: '1.6'
            }}>
              품목 목록에서 체크박스를 통해 여러 품목을 선택하고, 선택된 품목들의 데이터를 합쳐서 그래프에 표시합니다.
            </p>
            <div style={{
              marginTop: '16px',
              fontSize: '12px',
              color: '#10b981',
              fontWeight: '500'
            }}>
              ✓ 직관적인 UI<br/>
              ✓ 최대 5개 제한 가능<br/>
              ✓ 실시간 필터링
            </div>
          </div>
        </Link>

        <Link href="/samples/multi-filter/tabs" style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            border: '2px solid transparent'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.2)';
            e.currentTarget.style.borderColor = '#ef4444';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
            e.currentTarget.style.borderColor = 'transparent';
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              fontSize: '24px'
            }}>
              📑
            </div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '8px',
              color: '#111827'
            }}>
              방법 2: 탭 방식
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              lineHeight: '1.6'
            }}>
              전체/단일/비교 탭으로 모드를 전환하고, 비교 모드에서는 품목별로 별도의 그래프를 표시합니다.
            </p>
            <div style={{
              marginTop: '16px',
              fontSize: '12px',
              color: '#10b981',
              fontWeight: '500'
            }}>
              ✓ 명확한 모드 구분<br/>
              ✓ 품목별 상세 비교<br/>
              ✓ 깔끔한 레이아웃
            </div>
          </div>
        </Link>

        <Link href="/samples/multi-filter/dropdown" style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            border: '2px solid transparent'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.2)';
            e.currentTarget.style.borderColor = '#10b981';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
            e.currentTarget.style.borderColor = 'transparent';
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              fontSize: '24px'
            }}>
              🎯
            </div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '8px',
              color: '#111827'
            }}>
              방법 3: 드롭다운 멀티셀렉트
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              lineHeight: '1.6'
            }}>
              그래프 헤더의 드롭다운에서 여러 품목을 선택하고, 선택된 품목들의 조합 데이터를 표시합니다.
            </p>
            <div style={{
              marginTop: '16px',
              fontSize: '12px',
              color: '#10b981',
              fontWeight: '500'
            }}>
              ✓ 공간 효율적<br/>
              ✓ 빠른 전환<br/>
              ✓ 친숙한 UX
            </div>
          </div>
        </Link>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{
          fontSize: '18px',
          fontWeight: '600',
          marginBottom: '16px',
          color: '#111827'
        }}>
          각 방식의 특징 비교
        </h2>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '14px'
        }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>방식</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>장점</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>단점</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>추천 상황</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', fontWeight: '500' }}>체크박스</td>
              <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>직관적, 선택 상태 명확</td>
              <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>품목 많으면 복잡</td>
              <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>품목 수 10~20개</td>
            </tr>
            <tr>
              <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', fontWeight: '500' }}>탭</td>
              <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>모드 구분 명확, 비교 용이</td>
              <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>클릭 횟수 증가</td>
              <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>상세 비교 필요시</td>
            </tr>
            <tr>
              <td style={{ padding: '12px', fontWeight: '500' }}>드롭다운</td>
              <td style={{ padding: '12px' }}>공간 효율적, 깔끔한 UI</td>
              <td style={{ padding: '12px' }}>선택 상태 보기 어려움</td>
              <td style={{ padding: '12px' }}>품목 수 많고 공간 부족시</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
