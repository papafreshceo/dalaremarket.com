'use client'

interface WinWinProgramProps {
  isMobile?: boolean;
}

export default function WinWinProgram({ isMobile = false }: WinWinProgramProps) {
  const programs = [
    { title: '신규 고객 유치', desc: '월 10명 이상' },
    { title: '판매 실적 달성', desc: '월 1,000만원 이상' },
    { title: '우수 리뷰 작성', desc: '월 5개 이상' }
  ];

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
      }}>Win-Win 프로그램</h2>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {programs.map((program, idx) => (
          <div key={idx} style={{
            padding: '12px',
            borderRadius: '8px',
            background: '#f8f9fa',
            border: '1px solid #dee2e6'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#212529',
              marginBottom: '4px'
            }}>{program.title}</div>
            <div style={{
              fontSize: '12px',
              color: '#6c757d'
            }}>{program.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
