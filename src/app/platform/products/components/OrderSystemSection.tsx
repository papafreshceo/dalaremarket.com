'use client'

interface OrderSystemItem {
  title: string;
  desc: string;
  primary: boolean;
}

interface OrderSystemSectionProps {
  items?: OrderSystemItem[];
  isMobile?: boolean;
}

const DEFAULT_ITEMS: OrderSystemItem[] = [
  { title: '발주하기', desc: '신규 발주 등록', primary: true },
  { title: '발주내역', desc: '발주 이력 조회', primary: false },
  { title: '정산관리', desc: '정산 내역 확인', primary: false },
  { title: '배송조회', desc: '배송 현황 추적', primary: false }
];

export default function OrderSystemSection({ items = DEFAULT_ITEMS, isMobile = false }: OrderSystemSectionProps) {
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
        {items?.map((item, idx) => (
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
