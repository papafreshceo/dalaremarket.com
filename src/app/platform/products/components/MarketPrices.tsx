'use client'

interface MarketPrice {
  name: string;
  category: string;
  price: string;
  change: string;
  changePercent: string;
  isUp: boolean | null;
}

interface MarketPricesProps {
  prices: MarketPrice[];
  isMobile?: boolean;
  designSettings?: any;
}

export default function MarketPrices({ prices, isMobile = false, designSettings }: MarketPricesProps) {
  // 디자인 설정에서 값 가져오기
  const cardBackground = designSettings?.components?.card?.background || 'rgba(255, 255, 255, 0.1)';
  const borderColor = designSettings?.border?.light?.color || 'rgba(222, 226, 230, 0.1)';
  const borderRadiusLarge = designSettings?.border?.radius?.large || '12px';
  const borderRadiusMedium = designSettings?.border?.radius?.medium || '8px';
  const textPrimary = designSettings?.colors?.neutral?.base || '#212529';
  const textSecondary = designSettings?.colors?.neutral?.tones?.dark || '#6c757d';
  const successColor = designSettings?.colors?.success?.base || '#10b981';
  const errorColor = designSettings?.colors?.error?.base || '#ef4444';

  return (
    <div style={{
      background: cardBackground,
      border: `1px solid ${borderColor}`,
      borderRadius: borderRadiusLarge,
      padding: isMobile ? '16px' : '24px',
      marginBottom: '16px'
    }}>
      <h2 style={{
        fontSize: isMobile ? '16px' : '18px',
        fontWeight: '600',
        marginBottom: '16px',
        color: textPrimary
      }}>시세정보</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {prices.map((price, idx) => (
          <div key={idx} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px',
            borderRadius: borderRadiusMedium,
            background: cardBackground,
            border: `1px solid ${borderColor}`
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: textPrimary }}>
                {price.name}
              </div>
              <div style={{ fontSize: '12px', color: textSecondary }}>
                {price.category}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
              <div style={{ fontSize: '16px', fontWeight: '600', color: textPrimary }}>
                {price.price}
              </div>
              <div style={{
                fontSize: '12px',
                color: price.isUp === true ? successColor : price.isUp === false ? errorColor : textSecondary,
                fontWeight: '500'
              }}>
                {price.change} ({price.changePercent})
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
