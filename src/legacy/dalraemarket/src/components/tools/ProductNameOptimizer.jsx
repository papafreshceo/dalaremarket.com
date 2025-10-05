// src/components/tools/ProductNameOptimizer.jsx
import { useState } from 'react';

function ProductNameOptimizer({ onClose }) {
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');
  const [keywords, setKeywords] = useState('');
  const [optimizedNames, setOptimizedNames] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleOptimize = () => {
    if (!productName) return;
    
    setIsAnalyzing(true);
    
    // 시뮬레이션을 위한 최적화된 상품명 생성
    setTimeout(() => {
      const suggestions = [
        {
          name: `[${category || '인기'}] ${productName} ${keywords ? `- ${keywords}` : ''}`,
          score: 95,
          reason: '카테고리 명시로 검색 노출 증가'
        },
        {
          name: `${productName} / ${keywords || '프리미엄'} / 무료배송`,
          score: 92,
          reason: '배송 혜택 강조로 클릭률 향상'
        },
        {
          name: `[당일발송] ${productName} ${category ? `(${category})` : ''}`,
          score: 90,
          reason: '빠른 배송 강조로 구매 전환율 증가'
        },
        {
          name: `${productName} BEST ${keywords || '상품'} [한정특가]`,
          score: 88,
          reason: '긴급성 부여로 즉시 구매 유도'
        },
        {
          name: `정품 ${productName} ${category || ''} ${keywords || ''}`.trim(),
          score: 85,
          reason: '신뢰도 강조로 브랜드 가치 상승'
        }
      ];
      
      setOptimizedNames(suggestions);
      setIsAnalyzing(false);
    }, 1500);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
          상품명 최적화 도구
        </h3>
        <p style={{ fontSize: '14px', color: '#6c757d' }}>
          검색 엔진 최적화(SEO)를 고려한 효과적인 상품명을 생성합니다
        </p>
      </div>

      <div style={{ 
        background: '#f8f9fa', 
        borderRadius: '12px', 
        padding: '24px',
        marginBottom: '24px'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'block', 
            fontSize: '14px', 
            fontWeight: '500', 
            marginBottom: '8px' 
          }}>
            현재 상품명 *
          </label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="예: 프리미엄 유기농 사과"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '500', 
              marginBottom: '8px' 
            }}>
              카테고리
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                fontSize: '14px',
                background: '#ffffff'
              }}
            >
              <option value="">선택하세요</option>
              <option value="신선식품">신선식품</option>
              <option value="가공식품">가공식품</option>
              <option value="생활용품">생활용품</option>
              <option value="의류/잡화">의류/잡화</option>
              <option value="전자제품">전자제품</option>
              <option value="뷰티">뷰티</option>
            </select>
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '500', 
              marginBottom: '8px' 
            }}>
              핵심 키워드
            </label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="예: 당도선별, 대용량"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        <button
          onClick={handleOptimize}
          disabled={!productName || isAnalyzing}
          style={{
            width: '100%',
            padding: '14px',
            background: productName && !isAnalyzing ? '#2563eb' : '#e9ecef',
            color: productName && !isAnalyzing ? '#ffffff' : '#6c757d',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: productName && !isAnalyzing ? 'pointer' : 'not-allowed'
          }}
        >
          {isAnalyzing ? '분석 중...' : '상품명 최적화'}
        </button>
      </div>

      {optimizedNames.length > 0 && (
        <div>
          <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
            최적화된 상품명 추천
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {optimizedNames.map((item, index) => (
              <div 
                key={index}
                style={{
                  background: '#ffffff',
                  border: '1px solid #dee2e6',
                  borderRadius: '12px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#2563eb';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#dee2e6';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '15px', fontWeight: '500', marginBottom: '6px' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '13px', color: '#6c757d' }}>
                      {item.reason}
                    </div>
                  </div>
                  <div style={{
                    background: item.score >= 90 ? '#10b981' : '#f59e0b',
                    color: '#ffffff',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {item.score}점
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductNameOptimizer;