'use client'

interface BusinessToolsProps {
  isMobile?: boolean;
}

export default function BusinessTools({ isMobile = false }: BusinessToolsProps) {
  const tools = ['매출 분석', '재고 관리', '세금계산서', '문자 발송'];

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '12px',
      padding: '16px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    }}>
      <h2 style={{
        fontSize: '16px',
        fontWeight: '600',
        margin: 0,
        whiteSpace: 'nowrap'
      }}>업무도구</h2>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flex: 1
      }}>
        {tools.map((tool, idx) => (
          <div key={idx} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            padding: '6px 12px',
            borderRadius: '8px',
            transition: 'all 0.2s',
            background: '#f8f9fa'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              background: `linear-gradient(135deg, hsl(${idx * 90}, 70%, 50%) 0%, hsl(${idx * 90 + 30}, 70%, 60%) 100%)`,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                width: '16px',
                height: '16px',
                background: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '4px'
              }} />
            </div>
            <span style={{ fontSize: '13px', fontWeight: '500' }}>{tool}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
