'use client'

interface OrderSystemItem {
  title: string;
  desc: string;
  primary: boolean;
}

interface OrderSystemSectionProps {
  items: OrderSystemItem[];
  isMobile?: boolean;
}

export default function OrderSystemSection({ items, isMobile = false }: OrderSystemSectionProps) {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(222, 226, 230, 0.1)',
      borderRadius: '12px',
      padding: isMobile ? '16px' : '24px',
      marginBottom: '16px'
    }}>
      <h2 style={{
        fontSize: isMobile ? '16px' : '18px',
        fontWeight: '600',
        marginBottom: '16px',
        color: '#212529'
      }}>발주시스템</h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px'
      }}>
        {items.map((item, idx) => (
          <div key={idx} style={{
            padding: '16px',
            borderRadius: '8px',
            background: item.primary ? '#2563eb' : 'rgba(255, 255, 255, 0.1)',
            color: item.primary ? '#ffffff' : '#212529',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '4px'
            }}>{item.title}</div>
            <div style={{
              fontSize: '12px',
              opacity: item.primary ? 0.9 : 0.7
            }}>{item.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
