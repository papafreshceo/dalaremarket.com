'use client';

export default function FireIconsSamplePage() {
  const fireIcons = [
    // 1. 클래식 불꽃
    {
      name: "클래식 불꽃",
      svg: (
        <svg viewBox="0 0 24 24" width="40" height="40">
          <path d="M12 2c-1.5 2-2.5 4-1 6.5 1 2 .5 4-1 6-1 1.5-.5 3 1 3.5s3-.5 3.5-2.5c.5-2-.5-4-1.5-6-1-2 0-4 1-6C13.5 2 12.5 2 12 2z" fill="#B05CFF"/>
          <path d="M12 6c-.8 1.2-1.2 2.5-.5 4 .5 1.2.3 2.5-.5 3.5-.5.8-.3 1.5.5 1.8s1.5-.3 1.8-1.3c.3-1.2-.3-2.5-.8-3.5-.5-1.2 0-2.5.5-4C13.2 6 12.5 6 12 6z" fill="#B05CFF" opacity="0.6"/>
        </svg>
      )
    },
    // 2. 날카로운 불꽃
    {
      name: "날카로운 불꽃",
      svg: (
        <svg viewBox="0 0 24 24" width="40" height="40">
          <path d="M12 2L10 7l-.5 3c-.3 1 0 2 .5 3l-.5 3c-.3 1 0 2 1 2s1.3-1 1-2l-.5-3c.5-1 .8-2 .5-3l-.5-3L12 2z" fill="#B05CFF"/>
          <path d="M10 7l-1.5 3c-.5 1-.3 2 .2 3l-.5 2.5c-.2.8 0 1.5.8 1.5s1-.7.8-1.5l-.5-2.5c.5-1 .7-2 .2-3L10 7z" fill="#B05CFF" opacity="0.6"/>
          <path d="M14 7l1.5 3c.5 1 .3 2-.2 3l.5 2.5c.2.8 0 1.5-.8 1.5s-1-.7-.8-1.5l.5-2.5c-.5-1-.7-2-.2-3L14 7z" fill="#B05CFF" opacity="0.6"/>
        </svg>
      )
    },
    // 3. 둥근 불꽃
    {
      name: "둥근 불꽃",
      svg: (
        <svg viewBox="0 0 24 24" width="40" height="40">
          <ellipse cx="12" cy="12" rx="3.5" ry="8" fill="#B05CFF"/>
          <ellipse cx="12" cy="11" rx="2.5" ry="6" fill="#B05CFF" opacity="0.7"/>
          <ellipse cx="12" cy="10" rx="1.5" ry="4" fill="#B05CFF" opacity="0.5"/>
          <circle cx="12" cy="6" r="1.2" fill="#B05CFF"/>
        </svg>
      )
    },
    // 4. 3갈래 불꽃
    {
      name: "3갈래 불꽃",
      svg: (
        <svg viewBox="0 0 24 24" width="40" height="40">
          <path d="M12 3l-1 5c-.3 1.5-.5 3 0 4.5.5 1.5.3 3-.5 4.5-.5 1-.3 1.5.5 1.5s1-5 .5-1.5c-.5-1.5-.3-3 .5-4.5.5-1.5.3-3 0-4.5L12 3z" fill="#B05CFF"/>
          <path d="M9 8c-.5 1-.8 2-.3 3.5.5 1.5.3 2.5-.3 3.5-.3.5-.2.8.3.8s.8-.3.5-.8c-.6-1-.4-2 .3-3.5.5-1.5.2-2.5-.3-3.5H9z" fill="#B05CFF" opacity="0.7"/>
          <path d="M15 8c.5 1 .8 2 .3 3.5-.5 1.5-.3 2.5.3 3.5.3.5.2.8-.3.8s-.8-.3-.5-.8c.6-1 .4-2-.3-3.5-.5-1.5-.2-2.5.3-3.5H15z" fill="#B05CFF" opacity="0.7"/>
        </svg>
      )
    },
    // 5. 심플 불꽃
    {
      name: "심플 불꽃",
      svg: (
        <svg viewBox="0 0 24 24" width="40" height="40">
          <path d="M12 3c-1 2-2 4-.5 6.5 1 2 .5 4-.5 6-.5 1-.3 2 .5 2.5s1.5-.5 1.5-2c0-2-.5-4 .5-6 1.5-2.5.5-4.5-.5-6.5C12.5 3 12 3 12 3z" fill="#B05CFF"/>
        </svg>
      )
    },
    // 6. 물방울 불꽃
    {
      name: "물방울 불꽃",
      svg: (
        <svg viewBox="0 0 24 24" width="40" height="40">
          <path d="M12 3c-2 3-3 6-2 9s0 6 2 6 3-3 2-6-0-6-2-9z" fill="#B05CFF"/>
          <path d="M12 6c-1 2-1.5 4-1 6s0 4 1 4 1.5-2 1-4-0-4-1-6z" fill="#B05CFF" opacity="0.6"/>
        </svg>
      )
    },
    // 7. 톱니 불꽃
    {
      name: "톱니 불꽃",
      svg: (
        <svg viewBox="0 0 24 24" width="40" height="40">
          <path d="M12 2l-.5 2 .5 1-.5 2 .5 1-.5 2 .5 1-.5 2 .5 1-.5 2c-.2.5 0 1 .5 1s.7-.5.5-1l-.5-2 .5-1-.5-2 .5-1-.5-2 .5-1-.5-2 .5-1L12 2z" fill="#B05CFF"/>
          <path d="M10 6l-.3 1.5.3.8-.3 1.5.3.8-.3 1.5c-.1.3 0 .6.3.6s.5-.3.3-.6l-.3-1.5.3-.8-.3-1.5.3-.8L10 6z" fill="#B05CFF" opacity="0.6"/>
          <path d="M14 6l.3 1.5-.3.8.3 1.5-.3.8.3 1.5c.1.3 0 .6-.3.6s-.5-.3-.3-.6l.3-1.5-.3-.8.3-1.5-.3-.8L14 6z" fill="#B05CFF" opacity="0.6"/>
        </svg>
      )
    },
    // 8. 넓은 불꽃
    {
      name: "넓은 불꽃",
      svg: (
        <svg viewBox="0 0 24 24" width="40" height="40">
          <path d="M12 4c-2 1-4 3-4 6s1 6 2 8c.5 1 1 2 2 2s1.5-1 2-2c1-2 2-5 2-8s-2-5-4-6z" fill="#B05CFF"/>
          <path d="M12 7c-1 .5-2 2-2 4s.5 4 1 5c.3.5.6 1 1 1s.7-.5 1-1c.5-1 1-3 1-5s-1-3.5-2-4z" fill="#B05CFF" opacity="0.6"/>
        </svg>
      )
    },
    // 9. 가느다란 불꽃
    {
      name: "가느다란 불꽃",
      svg: (
        <svg viewBox="0 0 24 24" width="40" height="40">
          <rect x="11" y="3" width="2" height="16" rx="1" fill="#B05CFF"/>
          <ellipse cx="12" cy="10" rx="1" ry="5" fill="#B05CFF" opacity="0.6"/>
          <circle cx="12" cy="4" r="1" fill="#B05CFF"/>
        </svg>
      )
    },
    // 10. 파도 불꽃
    {
      name: "파도 불꽃",
      svg: (
        <svg viewBox="0 0 24 24" width="40" height="40">
          <path d="M12 3c-1 1.5-2 3-1.5 5s.5 4-.5 6c-.8 1.5-.5 3 .5 3.5s2-.5 2.5-2c.8-2 1-4 .5-6s-.5-3.5.5-5c1-1.5.5-2.5-.5-2.5s-1 0-1.5 1z" fill="#B05CFF"/>
          <path d="M12 7c-.5 1-1 2-.8 3.5s.3 3-.3 4.5c-.5 1-.3 2 .3 2.3s1.3-.3 1.6-1.3c.5-1.5.7-3 .3-4.5s-.3-2.5.8-3.5c.7-1 .3-1.7-.3-1.7s-.7 0-1.6.7z" fill="#B05CFF" opacity="0.6"/>
        </svg>
      )
    },
    // 11. 다이아몬드 불꽃
    {
      name: "다이아몬드 불꽃",
      svg: (
        <svg viewBox="0 0 24 24" width="40" height="40">
          <path d="M12 3l-3 6 3 6 3-6-3-6z" fill="#B05CFF"/>
          <path d="M12 15l-2 4 2 2 2-2-2-4z" fill="#B05CFF" opacity="0.8"/>
          <path d="M12 6l-2 3 2 3 2-3-2-3z" fill="#B05CFF" opacity="0.5"/>
        </svg>
      )
    },
    // 12. 별 불꽃
    {
      name: "별 불꽃",
      svg: (
        <svg viewBox="0 0 24 24" width="40" height="40">
          <path d="M12 3l1 3 3 1-2 2 .5 3-2.5-1.5L9 12l.5-3-2-2 3-1 1-3z" fill="#B05CFF"/>
          <path d="M12 13l.7 2 2 .7-1.4 1.4.3 2-1.6-1-1.6 1 .3-2-1.4-1.4 2-.7.7-2z" fill="#B05CFF" opacity="0.7"/>
        </svg>
      )
    },
    // 13. 심장 불꽃
    {
      name: "심장 불꽃",
      svg: (
        <svg viewBox="0 0 24 24" width="40" height="40">
          <path d="M12 5c-1-2-4-2-5 0s-1 4 0 6l5 7 5-7c1-2 1-4 0-6s-4-2-5 0z" fill="#B05CFF"/>
          <path d="M12 8c-.5-1-2-1-2.5 0s-.5 2 0 3l2.5 3.5L14.5 11c.5-1 .5-2 0-3s-2-1-2.5 0z" fill="#B05CFF" opacity="0.6"/>
        </svg>
      )
    },
    // 14. 번개 불꽃
    {
      name: "번개 불꽃",
      svg: (
        <svg viewBox="0 0 24 24" width="40" height="40">
          <path d="M13 3l-4 7h3l-3 9 7-10h-3l3-6h-3z" fill="#B05CFF"/>
          <path d="M12.5 5l-2 4h1.5l-1.5 5 3.5-5.5h-1.5l2-3.5h-2z" fill="#B05CFF" opacity="0.6"/>
        </svg>
      )
    },
    // 15. 나선 불꽃
    {
      name: "나선 불꽃",
      svg: (
        <svg viewBox="0 0 24 24" width="40" height="40">
          <path d="M12 3c-2 0-3 2-2.5 4s1 4 .5 6-1.5 4-1 6 1.5 3 2.5 3 2-1 1.5-3-1-4-.5-6 1.5-4 1-6S14 3 12 3z" fill="#B05CFF"/>
          <circle cx="11" cy="7" r="1" fill="#B05CFF" opacity="0.8"/>
          <circle cx="13" cy="11" r="1" fill="#B05CFF" opacity="0.8"/>
          <circle cx="11" cy="15" r="1" fill="#B05CFF" opacity="0.8"/>
        </svg>
      )
    },
    // 16. 촛불 불꽃
    {
      name: "촛불 불꽃",
      svg: (
        <svg viewBox="0 0 24 24" width="40" height="40">
          <path d="M12 3c-.8 0-1.5 1-2 2.5s-.5 3.5 0 5.5.5 4-.5 6c-.5 1-.3 2 .5 2.5s1.5-.5 2-2c1-2 1-4 .5-6s-.5-4 0-5.5S12.8 3 12 3z" fill="#B05CFF"/>
          <ellipse cx="12" cy="10" rx="1.5" ry="4" fill="#B05CFF" opacity="0.6"/>
          <circle cx="12" cy="5" r="1.2" fill="#B05CFF" opacity="0.8"/>
        </svg>
      )
    },
    // 17. 트라이앵글 불꽃
    {
      name: "트라이앵글 불꽃",
      svg: (
        <svg viewBox="0 0 24 24" width="40" height="40">
          <path d="M12 3l-4 8 4 8 4-8-4-8z" fill="#B05CFF"/>
          <path d="M12 6l-3 6 3 6 3-6-3-6z" fill="#B05CFF" opacity="0.6"/>
          <path d="M12 9l-2 4 2 4 2-4-2-4z" fill="#B05CFF" opacity="0.4"/>
        </svg>
      )
    },
    // 18. 잎사귀 불꽃
    {
      name: "잎사귀 불꽃",
      svg: (
        <svg viewBox="0 0 24 24" width="40" height="40">
          <path d="M12 3c-3 0-5 3-4 7s2 7 3 9c.5 1 1 2 1 2s.5-1 1-2c1-2 2-5 3-9s-1-7-4-7z" fill="#B05CFF"/>
          <path d="M12 6c-2 0-3 2-2.5 5s1.5 5 2 6.5c.3.8.5 1.5.5 1.5s.2-.7.5-1.5c.5-1.5 1.5-3.5 2-6.5S14 6 12 6z" fill="#B05CFF" opacity="0.6"/>
          <line x1="12" y1="8" x2="12" y2="16" stroke="#B05CFF" strokeWidth="0.5" opacity="0.4"/>
        </svg>
      )
    },
    // 19. 크리스탈 불꽃
    {
      name: "크리스탈 불꽃",
      svg: (
        <svg viewBox="0 0 24 24" width="40" height="40">
          <path d="M12 2l-2 4-3 2 3 4 2 6 2-6 3-4-3-2-2-4z" fill="#B05CFF"/>
          <path d="M12 5l-1.5 3-2 1.5 2 3 1.5 4 1.5-4 2-3-2-1.5L12 5z" fill="#B05CFF" opacity="0.7"/>
          <path d="M12 8l-1 2-1 1 1 2 1 3 1-3 1-2-1-1-1-2z" fill="#B05CFF" opacity="0.4"/>
        </svg>
      )
    },
    // 20. 폭발 불꽃
    {
      name: "폭발 불꽃",
      svg: (
        <svg viewBox="0 0 24 24" width="40" height="40">
          <circle cx="12" cy="12" r="3" fill="#B05CFF"/>
          <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.8 2.8M15.2 15.2l2.8 2.8M6 18l2.8-2.8M15.2 8.8l2.8-2.8" stroke="#B05CFF" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="12" cy="12" r="2" fill="#B05CFF" opacity="0.6"/>
        </svg>
      )
    },
    // 21. 아래가 굵은 불꽃 (역삼각형)
    {
      name: "아래가 굵은 불꽃",
      svg: (
        <svg viewBox="0 0 24 24" width="40" height="40">
          <path d="M12 3c-4 2-6 5-6 8s2 7 6 7 6-4 6-7-2-6-6-8z" fill="#B05CFF"/>
          <path d="M12 5c-3 1.5-4.5 4-4.5 6.5s1.5 5.5 4.5 5.5 4.5-3 4.5-5.5S15 6.5 12 5z" fill="#B05CFF" opacity="0.7"/>
          <path d="M12 7c-2 1-3 2.5-3 4.5s1 4 3 4 3-2 3-4-1-3.5-3-4.5z" fill="#B05CFF" opacity="0.5"/>
          <circle cx="12" cy="4" r="1" fill="#B05CFF"/>
        </svg>
      )
    },
    // 22. 넓은 베이스 불꽃
    {
      name: "넓은 베이스 불꽃",
      svg: (
        <svg viewBox="0 0 24 24" width="40" height="40">
          <path d="M12 4c-5 0-7 4-6 8s3 8 6 8 5-4 6-8-1-8-6-8z" fill="#B05CFF"/>
          <path d="M12 6c-3.5 0-5 3-4.5 6s2 6 4.5 6 4-3 4.5-6-1-6-4.5-6z" fill="#B05CFF" opacity="0.7"/>
          <ellipse cx="12" cy="12" rx="2.5" ry="4" fill="#B05CFF" opacity="0.5"/>
        </svg>
      )
    },
    // 23. 뒤집힌 물방울 불꽃
    {
      name: "뒤집힌 물방울 불꽃",
      svg: (
        <svg viewBox="0 0 24 24" width="40" height="40">
          <path d="M12 4c-3 0-5 2-6 5s-1 8 0 9 2 2 6 2 5-1 6-2 1-6 0-9-3-5-6-5z" fill="#B05CFF"/>
          <path d="M12 6c-2 0-3.5 1.5-4 3.5s-.5 6 0 6.5 1.5 1.5 4 1.5 3.5-1 4-1.5.5-4.5 0-6.5S14 6 12 6z" fill="#B05CFF" opacity="0.6"/>
          <circle cx="12" cy="5" r="1" fill="#B05CFF"/>
        </svg>
      )
    },
    // 24. 둥근 베이스 불꽃
    {
      name: "둥근 베이스 불꽃",
      svg: (
        <svg viewBox="0 0 24 24" width="40" height="40">
          <ellipse cx="12" cy="14" rx="5" ry="6" fill="#B05CFF"/>
          <ellipse cx="12" cy="13" rx="3.5" ry="5" fill="#B05CFF" opacity="0.7"/>
          <ellipse cx="12" cy="11" rx="2" ry="4" fill="#B05CFF" opacity="0.5"/>
          <path d="M12 4c-.5 1-1 2-.5 3.5s1 3 .5 4.5c0 0 .5-1.5.5-4.5S12.5 5 12 4z" fill="#B05CFF" opacity="0.8"/>
        </svg>
      )
    },
    // 25. 꽃병 불꽃
    {
      name: "꽃병 불꽃",
      svg: (
        <svg viewBox="0 0 24 24" width="40" height="40">
          <path d="M12 3c-.5 1-1.5 2-2.5 4s-2 5-1.5 7.5 1.5 4.5 4 4.5 3.5-2 4-4.5-0.5-5.5-1.5-7.5-2-3-2.5-4z" fill="#B05CFF"/>
          <path d="M12 5c-.3.8-1 1.5-1.8 3s-1.5 4-1 6 1 3.5 2.8 3.5 2.3-1.5 2.8-3.5-.2-4-1-6-1.5-2.2-1.8-3z" fill="#B05CFF" opacity="0.6"/>
          <circle cx="12" cy="4" r="0.8" fill="#B05CFF"/>
        </svg>
      )
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0b1020 0%, #1a1f3a 100%)',
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* 헤더 */}
        <div style={{
          textAlign: 'center',
          marginBottom: '60px',
          color: '#ffffff'
        }}>
          <h1 style={{
            fontSize: '48px',
            fontWeight: '900',
            marginBottom: '12px',
            background: 'linear-gradient(90deg, #B05CFF, #FFD447)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em'
          }}>
            FIRE ICON SAMPLES
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#94a3b8',
            fontFamily: 'monospace'
          }}>
            25가지 다양한 불꽃 아이콘 디자인 (아래가 굵은 불꽃 포함)
          </p>
        </div>

        {/* 아이콘 그리드 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '24px'
        }}>
          {fireIcons.map((icon, index) => (
            <div
              key={index}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(176, 92, 255, 0.3)',
                borderRadius: '16px',
                padding: '32px 24px',
                textAlign: 'center',
                transition: 'all 0.3s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(176, 92, 255, 0.1)';
                e.currentTarget.style.borderColor = '#B05CFF';
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 0 30px rgba(176, 92, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                e.currentTarget.style.borderColor = 'rgba(176, 92, 255, 0.3)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '16px',
                filter: 'drop-shadow(0 0 10px #B05CFF)'
              }}>
                {icon.svg}
              </div>
              <div style={{
                color: '#B05CFF',
                fontSize: '13px',
                fontWeight: '700',
                marginBottom: '4px'
              }}>
                #{index + 1}
              </div>
              <div style={{
                color: '#94a3b8',
                fontSize: '12px',
                fontFamily: 'monospace'
              }}>
                {icon.name}
              </div>
            </div>
          ))}
        </div>

        {/* 추천 */}
        <div style={{
          marginTop: '60px',
          padding: '32px',
          background: 'rgba(176, 92, 255, 0.1)',
          border: '2px solid #B05CFF',
          borderRadius: '16px',
          textAlign: 'center'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#B05CFF',
            marginBottom: '12px'
          }}>
            마음에 드는 디자인을 선택하세요!
          </h2>
          <p style={{
            color: '#94a3b8',
            fontSize: '14px'
          }}>
            원하는 불꽃 아이콘의 번호를 알려주시면 적용해드리겠습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
