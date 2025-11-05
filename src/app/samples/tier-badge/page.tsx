'use client';

import TierBadge, { TierRow } from '@/components/TierBadge';

export default function TierBadgeSamplePage() {
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
            background: 'linear-gradient(90deg, #7BE9FF, #FFD447)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em'
          }}>
            TIER BADGE SAMPLES
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#94a3b8',
            fontFamily: 'monospace'
          }}>
            네온 글로우 효과 티어 배지 컴포넌트 미리보기
          </p>
        </div>

        {/* 섹션 1: 모든 티어 기본형 */}
        <Section title="1. 모든 티어 - 기본형 (compact)">
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
            justifyContent: 'center'
          }}>
            <TierBadge tier="light" glow={0} />
            <TierBadge tier="standard" glow={0} />
            <TierBadge tier="advance" glow={0} />
            <TierBadge tier="elite" glow={0} />
            <TierBadge tier="legend" glow={0} />
          </div>
        </Section>

        {/* 섹션 2: 큰 사이즈 */}
        <Section title="2. 큰 사이즈 (compact=false)">
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
            justifyContent: 'center'
          }}>
            <TierBadge tier="light" compact={false} glow={0} />
            <TierBadge tier="standard" compact={false} glow={0} />
            <TierBadge tier="advance" compact={false} glow={0} />
            <TierBadge tier="elite" compact={false} glow={0} />
            <TierBadge tier="legend" compact={false} glow={0} />
          </div>
        </Section>

        {/* 섹션 3: 아이콘만 */}
        <Section title="3. 아이콘만 (hideLabel=true)">
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
            justifyContent: 'center'
          }}>
            <TierBadge tier="light" hideLabel glow={0} />
            <TierBadge tier="standard" hideLabel glow={0} />
            <TierBadge tier="advance" hideLabel glow={0} />
            <TierBadge tier="elite" hideLabel glow={0} />
            <TierBadge tier="legend" hideLabel glow={0} />
          </div>
        </Section>
        {/* 섹션 4: 다양한 조합 */}
        <Section title="4. 다양한 조합">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            justifyItems: 'center'
          }}>
            <div style={{ textAlign: 'center' }}>
              <TierBadge tier="elite" compact={false} glow={0} />
              <p style={{
                color: '#94a3b8',
                fontSize: '11px',
                marginTop: '8px',
                fontFamily: 'monospace'
              }}>
                큰 사이즈
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <TierBadge tier="advance" hideLabel compact={false} glow={0} />
              <p style={{
                color: '#94a3b8',
                fontSize: '11px',
                marginTop: '8px',
                fontFamily: 'monospace'
              }}>
                큰 사이즈 + 아이콘만
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <TierBadge tier="standard" hideLabel glow={0} />
              <p style={{
                color: '#94a3b8',
                fontSize: '11px',
                marginTop: '8px',
                fontFamily: 'monospace'
              }}>
                작은 사이즈 + 아이콘만
              </p>
            </div>
          </div>
        </Section>

        {/* 섹션 5: TierRow 컴포넌트 */}
        <Section title="5. TierRow 컴포넌트">
          <TierRow />
        </Section>

        {/* 섹션 6: 색상 팔레트 */}
        <Section title="6. 티어별 색상 팔레트">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            {[
              { tier: 'light', color: '#7BE9FF', name: 'LIGHT' },
              { tier: 'standard', color: '#4BB3FF', name: 'STANDARD' },
              { tier: 'advance', color: '#B05CFF', name: 'ADVANCE' },
              { tier: 'elite', color: '#24E3A8', name: 'ELITE' },
              { tier: 'legend', color: '#FFD447', name: 'LEGEND' },
            ].map((item) => (
              <div
                key={item.tier}
                style={{
                  padding: '20px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  textAlign: 'center'
                }}
              >
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    margin: '0 auto 12px',
                    borderRadius: '50%',
                    background: item.color,
                    boxShadow: `0 0 40px ${item.color}`,
                  }}
                />
                <p style={{
                  color: item.color,
                  fontWeight: '700',
                  fontSize: '14px',
                  marginBottom: '4px'
                }}>
                  {item.name}
                </p>
                <code style={{
                  color: '#94a3b8',
                  fontSize: '12px',
                  fontFamily: 'monospace'
                }}>
                  {item.color}
                </code>
              </div>
            ))}
          </div>
        </Section>

        {/* 사용 예시 코드 */}
        <Section title="7. 사용 예시">
          <div style={{
            background: '#0a0f1e',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            padding: '24px',
            fontFamily: 'monospace',
            fontSize: '14px',
            color: '#94a3b8',
            overflowX: 'auto'
          }}>
            <pre style={{ margin: 0 }}>
{`// 기본 사용
<TierBadge tier="legend" />

// 큰 사이즈 + 강한 글로우
<TierBadge tier="elite" compact={false} glow={2} />

// 아이콘만 표시
<TierBadge tier="advance" hideLabel={true} />

// 애니메이션 없음
<TierBadge tier="standard" glow={0} />

// 모든 티어 표시
<TierRow />`}
            </pre>
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '60px' }}>
      <h2 style={{
        fontSize: '24px',
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: '24px',
        paddingBottom: '12px',
        borderBottom: '2px solid rgba(255, 255, 255, 0.1)'
      }}>
        {title}
      </h2>
      <div style={{
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '16px',
        padding: '32px',
        border: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        {children}
      </div>
    </div>
  );
}
