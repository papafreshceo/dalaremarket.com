// src/components/tools/CategoryRankChecker.jsx
import { useState } from 'react';

function CategoryRankChecker({ onClose }) {
  const [platform, setPlatform] = useState('');
  const [category, setCategory] = useState('');
  const [productName, setProductName] = useState('');
  const [rankData, setRankData] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  const handleCheck = () => {
    if (!platform || !category) return;
    
    setIsChecking(true);
    
    // 시뮬레이션을 위한 순위 데이터 생성
    setTimeout(() => {
      const currentRank = Math.floor(Math.random() * 50) + 1;
      const previousRank = currentRank + Math.floor(Math.random() * 10) - 5;
      const bestRank = Math.min(currentRank - Math.floor(Math.random() * 20), 1);
      
      setRankData({
        current: currentRank,
        previous: previousRank,
        change: previousRank - currentRank,
        best: bestRank,
        trending: currentRank < previousRank ? 'up' : 'down',
        competitors: [
          { name: '경쟁상품 A', rank: currentRank - 3, price: '15,900원' },
          { name: '경쟁상품 B', rank: currentRank - 1, price: '14,500원' },
          { name: productName || '내 상품', rank: currentRank, price: '13,900원', isMe: true },
          { name: '경쟁상품 C', rank: currentRank + 2, price: '12,900원' },
          { name: '경쟁상품 D', rank: currentRank + 5, price: '11,900원' }
        ].filter(item => item.rank > 0 && item.rank <= 100),
        categoryInfo: {
          total: 2847,
          topSeller: '프리미엄 상품',
          avgPrice: '14,500원',
          growth: '+12.5%'
        }
      });
      
      setIsChecking(false);
    }, 1500);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
          카테고리 순위 확인
        </h3>
        <p style={{ fontSize: '14px', color: '#6c757d' }}>
          각 플랫폼별 카테고리 내 상품 순위를 실시간으로 확인합니다
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
              플랫폼 선택 *
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
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
              <option value="naver">네이버 스마트스토어</option>
              <option value="coupang">쿠팡</option>
              <option value="gmarket">G마켓</option>
              <option value="11st">11번가</option>
              <option value="interpark">인터파크</option>
            </select>
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '500', 
              marginBottom: '8px' 
            }}>
              카테고리 *
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
              <option value="food">식품</option>
              <option value="fashion">패션의류</option>
              <option value="beauty">뷰티</option>
              <option value="digital">디지털/가전</option>
              <option value="living">생활/건강</option>
              <option value="sports">스포츠/레저</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'block', 
            fontSize: '14px', 
            fontWeight: '500', 
            marginBottom: '8px' 
          }}>
            상품명 (선택)
          </label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="순위를 확인할 상품명"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
        </div>

        <button
          onClick={handleCheck}
          disabled={!platform || !category || isChecking}
          style={{
            width: '100%',
            padding: '14px',
            background: platform && category && !isChecking ? '#2563eb' : '#e9ecef',
            color: platform && category && !isChecking ? '#ffffff' : '#6c757d',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: platform && category && !isChecking ? 'pointer' : 'not-allowed'
          }}
        >
          {isChecking ? '순위 확인 중...' : '순위 확인하기'}
        </button>
      </div>

      {rankData && (
        <div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: '12px',
            marginBottom: '24px'
          }}>
            <div style={{
              background: '#ffffff',
              border: '2px solid #2563eb',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '13px', color: '#6c757d', marginBottom: '4px' }}>
                현재 순위
              </div>
              <div style={{ 
                fontSize: '28px', 
                fontWeight: '700', 
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}>
                {rankData.current}
                {rankData.trending === 'up' ? 
                  <span style={{ fontSize: '16px', color: '#10b981' }}>▲</span> :
                  <span style={{ fontSize: '16px', color: '#ef4444' }}>▼</span>
                }
              </div>
            </div>

            <div style={{
              background: '#f8f9fa',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '13px', color: '#6c757d', marginBottom: '4px' }}>
                이전 순위
              </div>
              <div style={{ fontSize: '24px', fontWeight: '600' }}>
                {rankData.previous}
              </div>
            </div>

            <div style={{
              background: '#f8f9fa',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '13px', color: '#6c757d', marginBottom: '4px' }}>
                변동
              </div>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: '600',
                color: rankData.change > 0 ? '#10b981' : rankData.change < 0 ? '#ef4444' : '#6c757d'
              }}>
                {rankData.change > 0 ? '+' : ''}{rankData.change}
              </div>
            </div>

            <div style={{
              background: '#f8f9fa',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '13px', color: '#6c757d', marginBottom: '4px' }}>
                최고 순위
              </div>
              <div style={{ fontSize: '24px', fontWeight: '600', color: '#f59e0b' }}>
                {rankData.best}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
              주변 순위 상품
            </h4>
            <div style={{ 
              background: '#ffffff',
              border: '1px solid #dee2e6',
              borderRadius: '12px',
              overflow: 'hidden'
            }}>
              {rankData.competitors.map((item, index) => (
                <div 
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderBottom: index < rankData.competitors.length - 1 ? '1px solid #f1f3f5' : 'none',
                    background: item.isMe ? '#e7f3ff' : '#ffffff'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                      fontSize: '16px', 
                      fontWeight: item.isMe ? '700' : '500',
                      color: item.isMe ? '#2563eb' : '#495057',
                      minWidth: '30px'
                    }}>
                      {item.rank}위
                    </div>
                    <div style={{ 
                      fontSize: '14px',
                      fontWeight: item.isMe ? '600' : '400'
                    }}>
                      {item.name}
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: '500',
                    color: '#495057'
                  }}>
                    {item.price}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            background: '#f8f9fa',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
              카테고리 정보
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', color: '#6c757d' }}>전체 상품 수</span>
                <span style={{ fontSize: '14px', fontWeight: '500' }}>{rankData.categoryInfo.total.toLocaleString()}개</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', color: '#6c757d' }}>카테고리 성장률</span>
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#10b981' }}>{rankData.categoryInfo.growth}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', color: '#6c757d' }}>1위 상품</span>
                <span style={{ fontSize: '14px', fontWeight: '500' }}>{rankData.categoryInfo.topSeller}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', color: '#6c757d' }}>평균 가격</span>
                <span style={{ fontSize: '14px', fontWeight: '500' }}>{rankData.categoryInfo.avgPrice}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CategoryRankChecker;