'use client';

export default function FireEmojiPage() {
  const fireIcons = [
    // 1. 클래식 이모지 불
    {
      name: "클래식 이모지 불",
      svg: (
        <svg viewBox="0 0 24 24" width="50" height="50">
          {/* 외곽 레이어 */}
          <path d="M12 4c-3 1-5 3-5 6.5 0 3 2 6.5 5 6.5s5-3.5 5-6.5c0-3.5-2-5.5-5-6.5z" fill="#B05CFF" opacity="0.3"/>
          {/* 중간 레이어 */}
          <path d="M12 5.5c-2.5 1-4 2.5-4 5.5 0 2.5 1.5 5.5 4 5.5s4-3 4-5.5c0-3-1.5-4.5-4-5.5z" fill="#B05CFF" opacity="0.6"/>
          {/* 내부 레이어 */}
          <path d="M12 7c-2 .8-3 2-3 4.5 0 2 1 4.5 3 4.5s3-2.5 3-4.5c0-2.5-1-3.7-3-4.5z" fill="#B05CFF"/>
          {/* 상단 불꽃 */}
          <circle cx="12" cy="5" r="1.2" fill="#B05CFF" opacity="0.9"/>
        </svg>
      )
    },
    // 2. 둥근 이모지 불
    {
      name: "둥근 이모지 불",
      svg: (
        <svg viewBox="0 0 24 24" width="50" height="50">
          <path d="M12 3c-4 0-6 3-6 7s2 7 6 7 6-3 6-7-2-7-6-7z" fill="#B05CFF" opacity="0.3"/>
          <path d="M12 5c-3 0-4.5 2.5-4.5 6s1.5 6 4.5 6 4.5-2.5 4.5-6-1.5-6-4.5-6z" fill="#B05CFF" opacity="0.6"/>
          <path d="M12 7c-2.5 0-3.5 2-3.5 5s1 5 3.5 5 3.5-2 3.5-5-1-5-3.5-5z" fill="#B05CFF"/>
          <ellipse cx="12" cy="6" rx="1.5" ry="2" fill="#B05CFF" opacity="0.8"/>
        </svg>
      )
    },
    // 3. 심플 이모지 불
    {
      name: "심플 이모지 불",
      svg: (
        <svg viewBox="0 0 24 24" width="50" height="50">
          <path d="M12 4c-3.5 0-5.5 2.5-5.5 6.5s2 7.5 5.5 7.5 5.5-3.5 5.5-7.5S15.5 4 12 4z" fill="#B05CFF" opacity="0.4"/>
          <path d="M12 6c-2.8 0-4.3 2-4.3 5.5s1.5 6.5 4.3 6.5 4.3-3 4.3-6.5S14.8 6 12 6z" fill="#B05CFF" opacity="0.7"/>
          <path d="M12 8c-2.2 0-3.2 1.5-3.2 4.5s1 5.5 3.2 5.5 3.2-2.5 3.2-5.5S14.2 8 12 8z" fill="#B05CFF"/>
        </svg>
      )
    },
    // 4. 톡톡 튀는 불
    {
      name: "톡톡 튀는 불",
      svg: (
        <svg viewBox="0 0 24 24" width="50" height="50">
          <path d="M12 5c-3 0-5 2-5 6s2 7 5 7 5-3 5-7-2-6-5-6z" fill="#B05CFF" opacity="0.35"/>
          <path d="M12 6.5c-2.5 0-4 1.8-4 5.5s1.5 6 4 6 4-2.3 4-6-1.5-5.5-4-5.5z" fill="#B05CFF" opacity="0.65"/>
          <path d="M12 8.5c-2 0-3 1.5-3 4.5s1 5 3 5 3-2 3-5-1-4.5-3-4.5z" fill="#B05CFF"/>
          <circle cx="10" cy="5" r="1" fill="#B05CFF" opacity="0.8"/>
          <circle cx="12" cy="3.5" r="1.2" fill="#B05CFF" opacity="0.9"/>
          <circle cx="14" cy="5" r="1" fill="#B05CFF" opacity="0.8"/>
        </svg>
      )
    },
    // 5. 부드러운 불
    {
      name: "부드러운 불",
      svg: (
        <svg viewBox="0 0 24 24" width="50" height="50">
          <ellipse cx="12" cy="12" rx="5" ry="7" fill="#B05CFF" opacity="0.35"/>
          <ellipse cx="12" cy="12" rx="4" ry="6" fill="#B05CFF" opacity="0.6"/>
          <ellipse cx="12" cy="11.5" rx="3" ry="5" fill="#B05CFF"/>
          <path d="M12 4c-1 0-1.5 1-1.5 2.5s.5 3 1.5 3 1.5-1.5 1.5-3S13 4 12 4z" fill="#B05CFF" opacity="0.85"/>
        </svg>
      )
    },
    // 6. 입체 이모지 불
    {
      name: "입체 이모지 불",
      svg: (
        <svg viewBox="0 0 24 24" width="50" height="50">
          <path d="M12 4.5c-3.2 0-5.2 2.2-5.2 6.2s2 7.3 5.2 7.3 5.2-3.3 5.2-7.3-2-6.2-5.2-6.2z" fill="#B05CFF" opacity="0.3"/>
          <path d="M12 6c-2.6 0-4.2 2-4.2 5.7s1.6 6.3 4.2 6.3 4.2-2.6 4.2-6.3S14.6 6 12 6z" fill="#B05CFF" opacity="0.55"/>
          <path d="M12 7.5c-2.2 0-3.5 1.7-3.5 5s1.3 5.5 3.5 5.5 3.5-2.2 3.5-5.5-1.3-5-3.5-5z" fill="#B05CFF" opacity="0.75"/>
          <path d="M12 9c-1.8 0-2.8 1.5-2.8 4.2s1 4.8 2.8 4.8 2.8-2 2.8-4.8S13.8 9 12 9z" fill="#B05CFF"/>
          <ellipse cx="12" cy="5.5" rx="1.3" ry="1.8" fill="#B05CFF"/>
        </svg>
      )
    },
    // 7. 깔끔한 불
    {
      name: "깔끔한 불",
      svg: (
        <svg viewBox="0 0 24 24" width="50" height="50">
          <path d="M12 5c-3 0-5 2.5-5 6.5S9 18 12 18s5-2.5 5-6.5S15 5 12 5z" fill="#B05CFF" opacity="0.4"/>
          <path d="M12 7c-2.3 0-3.8 2-3.8 5.5S9.7 16 12 16s3.8-1.5 3.8-5.5S14.3 7 12 7z" fill="#B05CFF" opacity="0.7"/>
          <path d="M12 9c-1.8 0-2.8 1.5-2.8 4.5s1 4.5 2.8 4.5 2.8-1.5 2.8-4.5S13.8 9 12 9z" fill="#B05CFF"/>
          <path d="M12 4c-.8 0-1.2.8-1.2 2s.4 2.5 1.2 2.5 1.2-1.3 1.2-2.5S12.8 4 12 4z" fill="#B05CFF"/>
        </svg>
      )
    },
    // 8. 귀여운 불
    {
      name: "귀여운 불",
      svg: (
        <svg viewBox="0 0 24 24" width="50" height="50">
          <path d="M12 5.5c-3.5 0-5.5 2.8-5.5 7s2 7.5 5.5 7.5 5.5-3.3 5.5-7.5-2-7-5.5-7z" fill="#B05CFF" opacity="0.35"/>
          <path d="M12 7c-2.8 0-4.5 2.3-4.5 6.3S9.2 18 12 18s4.5-2.4 4.5-6.7S14.8 7 12 7z" fill="#B05CFF" opacity="0.65"/>
          <path d="M12 8.5c-2.3 0-3.5 2-3.5 5.3s1.2 5.7 3.5 5.7 3.5-2.4 3.5-5.7-1.2-5.3-3.5-5.3z" fill="#B05CFF"/>
          <ellipse cx="11" cy="5" rx="1.2" ry="1.5" fill="#B05CFF" opacity="0.85"/>
          <ellipse cx="13" cy="5" rx="1.2" ry="1.5" fill="#B05CFF" opacity="0.85"/>
        </svg>
      )
    },
    // 9. 컴팩트 불
    {
      name: "컴팩트 불",
      svg: (
        <svg viewBox="0 0 24 24" width="50" height="50">
          <path d="M12 6c-3 0-4.5 2.2-4.5 5.8s1.5 6.2 4.5 6.2 4.5-2.6 4.5-6.2S15 6 12 6z" fill="#B05CFF" opacity="0.4"/>
          <path d="M12 7.5c-2.5 0-3.5 1.8-3.5 5s1 5.5 3.5 5.5 3.5-2.3 3.5-5.5-1-5-3.5-5z" fill="#B05CFF" opacity="0.7"/>
          <path d="M12 9c-2 0-2.8 1.5-2.8 4.2s.8 4.8 2.8 4.8 2.8-2 2.8-4.8S14 9 12 9z" fill="#B05CFF"/>
          <circle cx="12" cy="5.5" r="1.5" fill="#B05CFF"/>
        </svg>
      )
    },
    // 10. 통통한 불
    {
      name: "통통한 불",
      svg: (
        <svg viewBox="0 0 24 24" width="50" height="50">
          <ellipse cx="12" cy="11.5" rx="5.5" ry="7.5" fill="#B05CFF" opacity="0.35"/>
          <ellipse cx="12" cy="11.5" rx="4.5" ry="6.5" fill="#B05CFF" opacity="0.6"/>
          <ellipse cx="12" cy="11.5" rx="3.5" ry="5.5" fill="#B05CFF" opacity="0.8"/>
          <ellipse cx="12" cy="11" rx="2.5" ry="4.5" fill="#B05CFF"/>
          <ellipse cx="12" cy="5.5" rx="1.5" ry="2.3" fill="#B05CFF"/>
        </svg>
      )
    },
    // 11. 날씬한 불
    {
      name: "날씬한 불",
      svg: (
        <svg viewBox="0 0 24 24" width="50" height="50">
          <ellipse cx="12" cy="11" rx="4" ry="8" fill="#B05CFF" opacity="0.35"/>
          <ellipse cx="12" cy="11" rx="3.2" ry="7" fill="#B05CFF" opacity="0.6"/>
          <ellipse cx="12" cy="10.5" rx="2.5" ry="6" fill="#B05CFF" opacity="0.8"/>
          <ellipse cx="12" cy="10" rx="2" ry="5" fill="#B05CFF"/>
          <ellipse cx="12" cy="5" rx="1.3" ry="2" fill="#B05CFF"/>
        </svg>
      )
    },
    // 12. 물방울 불
    {
      name: "물방울 불",
      svg: (
        <svg viewBox="0 0 24 24" width="50" height="50">
          <path d="M12 5c-3.2 0-5 2.5-5 6.2 0 3.7 1.8 6.8 5 6.8s5-3 5-6.8c0-3.7-1.8-6.2-5-6.2z" fill="#B05CFF" opacity="0.4"/>
          <path d="M12 6.5c-2.5 0-4 2-4 5.3 0 3.2 1.5 5.7 4 5.7s4-2.5 4-5.7c0-3.2-1.5-5.3-4-5.3z" fill="#B05CFF" opacity="0.7"/>
          <path d="M12 8c-2 0-3 1.7-3 4.5 0 2.8 1 5 3 5s3-2.2 3-5c0-2.8-1-4.5-3-4.5z" fill="#B05CFF"/>
          <ellipse cx="12" cy="5" rx="1.5" ry="2" fill="#B05CFF" opacity="0.9"/>
        </svg>
      )
    },
    // 13. 삼각 불
    {
      name: "삼각 불",
      svg: (
        <svg viewBox="0 0 24 24" width="50" height="50">
          <path d="M12 5l-5 8c0 3 2 5 5 5s5-2 5-5l-5-8z" fill="#B05CFF" opacity="0.35"/>
          <path d="M12 6.5l-4 6.5c0 2.5 1.8 4.5 4 4.5s4-2 4-4.5l-4-6.5z" fill="#B05CFF" opacity="0.65"/>
          <path d="M12 8l-3 5c0 2 1.3 4 3 4s3-2 3-4l-3-5z" fill="#B05CFF"/>
          <circle cx="12" cy="5" r="1.3" fill="#B05CFF"/>
        </svg>
      )
    },
    // 14. 하트 불
    {
      name: "하트 불",
      svg: (
        <svg viewBox="0 0 24 24" width="50" height="50">
          <path d="M12 6c-1.5-1.5-4-1.5-5 0s-1 3 0 5l5 7 5-7c1-2 1-3.5 0-5s-3.5-1.5-5 0z" fill="#B05CFF" opacity="0.4"/>
          <path d="M12 7.5c-1.2-1.2-3.2-1.2-4 0s-.8 2.5 0 4l4 5.5 4-5.5c.8-1.5.8-2.8 0-4s-2.8-1.2-4 0z" fill="#B05CFF" opacity="0.7"/>
          <path d="M12 9c-1-1-2.5-1-3.2 0s-.7 2 0 3.2l3.2 4.3 3.2-4.3c.7-1.2.7-2.2 0-3.2s-2.2-1-3.2 0z" fill="#B05CFF"/>
        </svg>
      )
    },
    // 15. 풍선 불
    {
      name: "풍선 불",
      svg: (
        <svg viewBox="0 0 24 24" width="50" height="50">
          <circle cx="12" cy="11" r="6" fill="#B05CFF" opacity="0.35"/>
          <circle cx="12" cy="11" r="5" fill="#B05CFF" opacity="0.6"/>
          <circle cx="12" cy="11" r="4" fill="#B05CFF" opacity="0.8"/>
          <circle cx="12" cy="10.5" r="3" fill="#B05CFF"/>
          <ellipse cx="12" cy="5" rx="1.5" ry="2.5" fill="#B05CFF"/>
          <path d="M12 17c-.5 0-1 .5-1 1.5s.5 2 1 2 1-1 1-2-.5-1.5-1-1.5z" fill="#B05CFF" opacity="0.3"/>
        </svg>
      )
    },
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
            fontSize: '52px',
            fontWeight: '900',
            marginBottom: '16px',
            background: 'linear-gradient(90deg, #B05CFF, #FFD447)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em'
          }}>
            🔥 EMOJI STYLE FIRE
          </h1>
          <p style={{
            fontSize: '18px',
            color: '#94a3b8',
            fontFamily: 'monospace',
            fontWeight: '600'
          }}>
            이모지 느낌의 귀엽고 깔끔한 불꽃 디자인
          </p>
        </div>

        {/* 아이콘 그리드 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '28px'
        }}>
          {fireIcons.map((icon, index) => (
            <div
              key={index}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '2px solid rgba(176, 92, 255, 0.3)',
                borderRadius: '24px',
                padding: '36px 28px',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(176, 92, 255, 0.2)';
                e.currentTarget.style.borderColor = '#B05CFF';
                e.currentTarget.style.transform = 'translateY(-8px) scale(1.05)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(176, 92, 255, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.borderColor = 'rgba(176, 92, 255, 0.3)';
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: '20px',
                minHeight: '70px',
                filter: 'drop-shadow(0 0 20px #B05CFF)'
              }}>
                {icon.svg}
              </div>
              <div style={{
                background: 'linear-gradient(90deg, #B05CFF, #D946EF)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: '16px',
                fontWeight: '900',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                #{index + 1}
              </div>
              <div style={{
                color: '#cbd5e1',
                fontSize: '13px',
                fontFamily: 'system-ui',
                fontWeight: '600'
              }}>
                {icon.name}
              </div>
            </div>
          ))}
        </div>

        {/* 하단 안내 */}
        <div style={{
          marginTop: '80px',
          padding: '48px',
          background: 'linear-gradient(135deg, rgba(176, 92, 255, 0.15), rgba(217, 70, 239, 0.15))',
          border: '3px solid #B05CFF',
          borderRadius: '24px',
          textAlign: 'center',
          boxShadow: '0 0 60px rgba(176, 92, 255, 0.3)'
        }}>
          <div style={{
            fontSize: '32px',
            marginBottom: '16px'
          }}>
            🔥
          </div>
          <h2 style={{
            fontSize: '32px',
            fontWeight: '900',
            color: '#B05CFF',
            marginBottom: '16px',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            Simple & Cute Design
          </h2>
          <p style={{
            color: '#94a3b8',
            fontSize: '16px',
            marginBottom: '12px',
            lineHeight: '1.6'
          }}>
            이모지 스타일의 깔끔하고 귀여운 불꽃 디자인입니다.
          </p>
          <p style={{
            color: '#B05CFF',
            fontSize: '18px',
            fontFamily: 'monospace',
            marginTop: '24px',
            fontWeight: '700'
          }}>
            ⭐ 마음에 드는 번호를 선택하세요!
          </p>
        </div>
      </div>
    </div>
  );
}
