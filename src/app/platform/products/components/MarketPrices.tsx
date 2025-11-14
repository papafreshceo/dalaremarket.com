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
}

export default function MarketPrices({ prices, isMobile = false }: MarketPricesProps) {
  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '12px',
      padding: isMobile ? '16px' : '24px',
      marginBottom: '16px'
    }}>
      <h2 style={{
        fontSize: isMobile ? '16px' : '18px',
        fontWeight: '600',
        marginBottom: '16px',
        color: '#212529'
      }}>시세정보</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {prices.map((price, idx) => (
          <div key={idx} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px',
            borderRadius: '8px',
            background: '#f8f9fa',
            border: '1px solid #dee2e6'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#212529' }}>
                {price.name}
              </div>
              <div style={{ fontSize: '12px', color: '#6c757d' }}>
                {price.category}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#212529' }}>
                {price.price}
              </div>
              <div style={{
                fontSize: '12px',
                color: price.isUp === true ? '#10b981' : price.isUp === false ? '#ef4444' : '#6c757d',
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
