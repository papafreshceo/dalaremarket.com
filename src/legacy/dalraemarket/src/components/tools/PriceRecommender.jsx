// src/components/tools/PriceRecommender.jsx
import { useState } from 'react';

function PriceRecommender({ onClose }) {
  const [costPrice, setCostPrice] = useState('');
  const [competitorPrice, setCompetitorPrice] = useState('');
  const [targetMargin, setTargetMargin] = useState('');
  const [shippingCost, setShippingCost] = useState('');
  const [recommendation, setRecommendation] = useState(null);

  const calculateRecommendation = () => {
    if (!costPrice) return;

    const cost = parseFloat(costPrice);
    const competitor = parseFloat(competitorPrice) || 0;
    const margin = parseFloat(targetMargin) || 30;
    const shipping = parseFloat(shippingCost) || 0;

    // 마진 기반 가격
    const marginBasedPrice = (cost + shipping) / (1 - margin / 100);
    
    // 경쟁사 대비 가격
    const competitivePrice = competitor ? competitor * 0.95 : marginBasedPrice;
    
    // 심리적 가격 (9 엔딩)
    const psychologicalPrice = Math.floor(marginBasedPrice / 1000) * 1000 + 900;
    
    // 번들 가격
    const bundlePrice = marginBasedPrice * 0.85;

    setRecommendation({
      regular: Math.round(marginBasedPrice),
      competitive: Math.round(competitivePrice),
      psychological: psychologicalPrice,
      bundle: Math.round(bundlePrice),
      discount10: Math.round(marginBasedPrice * 0.9),
      discount20: Math.round(marginBasedPrice * 0.8),
      actualMargin: {
        regular: ((marginBasedPrice - cost - shipping) / marginBasedPrice * 100).toFixed(1),
        competitive: ((competitivePrice - cost - shipping) / competitivePrice * 100).toFixed(1),
        psychological: ((psychologicalPrice - cost - shipping) / psychologicalPrice * 100).toFixed(1)
      }
    });
  };

  const formatPrice = (price) => {
    return price.toLocaleString('ko-KR');
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
          판매가/할인가 추천기
        </h3>
        <p style={{ fontSize: '14px', color: '#6c757d' }}>
          원가와 마진율을 고려한 최적의 판매 가격을 추천합니다
        </p>
      </div>

      <div style={{ 
        background: '#f8f9fa', 
        borderRadius: '12px', 
        padding: '24px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '500', 
              marginBottom: '8px' 
            }}>
              원가 (필수)
            </label>
            <input
              type="number"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
              placeholder="10000"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '500', 
              marginBottom: '8px' 
            }}>
              경쟁사 가격
            </label>
            <input
              type="number"
              value={competitorPrice}
              onChange={(e) => setCompetitorPrice(e.target.value)}
              placeholder="15000"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '500', 
              marginBottom: '8px' 
            }}>
              목표 마진율 (%)
            </label>
            <input
              type="number"
              value={targetMargin}
              onChange={(e) => setTargetMargin(e.target.value)}
              placeholder="30"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '500', 
              marginBottom: '8px' 
            }}>
              배송비
            </label>
            <input
              type="number"
              value={shippingCost}
              onChange={(e) => setShippingCost(e.target.value)}
              placeholder="3000"
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
          onClick={calculateRecommendation}
          disabled={!costPrice}
          style={{
            width: '100%',
            padding: '14px',
            background: costPrice ? '#2563eb' : '#e9ecef',
            color: costPrice ? '#ffffff' : '#6c757d',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: costPrice ? 'pointer' : 'not-allowed'
          }}
        >
          가격 추천 받기
        </button>
      </div>

      {recommendation && (
        <div>
          <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
            추천 판매 가격
          </h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
            <div style={{
              background: '#ffffff',
              border: '2px solid #2563eb',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <div style={{ fontSize: '13px', color: '#6c757d', marginBottom: '4px' }}>
                기본 판매가 (마진 {recommendation.actualMargin.regular}%)
              </div>
              <div style={{ fontSize: '20px', fontWeight: '600', color: '#2563eb' }}>
                ₩{formatPrice(recommendation.regular)}
              </div>
            </div>

            <div style={{
              background: '#ffffff',
              border: '1px solid #dee2e6',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <div style={{ fontSize: '13px', color: '#6c757d', marginBottom: '4px' }}>
                경쟁력 있는 가격 (마진 {recommendation.actualMargin.competitive}%)
              </div>
              <div style={{ fontSize: '20px', fontWeight: '600', color: '#212529' }}>
                ₩{formatPrice(recommendation.competitive)}
              </div>
            </div>

            <div style={{
              background: '#ffffff',
              border: '1px solid #dee2e6',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <div style={{ fontSize: '13px', color: '#6c757d', marginBottom: '4px' }}>
                심리적 가격 (마진 {recommendation.actualMargin.psychological}%)
              </div>
              <div style={{ fontSize: '20px', fontWeight: '600', color: '#212529' }}>
                ₩{formatPrice(recommendation.psychological)}
              </div>
            </div>

            <div style={{
              background: '#ffffff',
              border: '1px solid #dee2e6',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <div style={{ fontSize: '13px', color: '#6c757d', marginBottom: '4px' }}>
                번들 판매가 (2개 이상)
              </div>
              <div style={{ fontSize: '20px', fontWeight: '600', color: '#212529' }}>
                ₩{formatPrice(recommendation.bundle)}
              </div>
            </div>
          </div>

          <div style={{
            background: '#fef3c7',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px' }}>
              할인 가격 제안
            </h4>
            <div style={{ display: 'flex', gap: '24px' }}>
              <div>
                <div style={{ fontSize: '13px', color: '#92400e', marginBottom: '4px' }}>
                  10% 할인가
                </div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#92400e' }}>
                  ₩{formatPrice(recommendation.discount10)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '13px', color: '#92400e', marginBottom: '4px' }}>
                  20% 할인가
                </div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#92400e' }}>
                  ₩{formatPrice(recommendation.discount20)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PriceRecommender;