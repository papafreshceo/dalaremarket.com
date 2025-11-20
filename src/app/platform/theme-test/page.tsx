'use client';

import { useState, useEffect } from 'react';

export default function ThemeTestPage() {
  const [radius, setRadius] = useState(8);
  const [shadowIntensity, setShadowIntensity] = useState(0.1);
  const [borderWidth, setBorderWidth] = useState(1);
  const [primaryColor, setPrimaryColor] = useState('#2563eb');
  const [cssInput, setCssInput] = useState('');
  const [savedPresets, setSavedPresets] = useState<Record<string, any>>({});

  // CSS Variables 실시간 업데이트
  const updateTheme = (
    newRadius?: number,
    newShadow?: number,
    newBorder?: number,
    newColor?: string
  ) => {
    const root = document.documentElement;
    const r = newRadius ?? radius;
    const s = newShadow ?? shadowIntensity;
    const b = newBorder ?? borderWidth;
    const c = newColor ?? primaryColor;

    // Border Radius
    root.style.setProperty('--platform-radius-sm', `${r / 2}px`);
    root.style.setProperty('--platform-radius-md', `${r}px`);
    root.style.setProperty('--platform-radius-lg', `${r * 1.5}px`);
    root.style.setProperty('--platform-radius-xl', `${r * 2}px`);

    // Shadow
    root.style.setProperty('--platform-shadow-sm', `0 1px 3px rgba(0, 0, 0, ${s})`);
    root.style.setProperty('--platform-shadow-md', `0 4px 6px rgba(0, 0, 0, ${s})`);
    root.style.setProperty('--platform-shadow-lg', `0 10px 20px rgba(0, 0, 0, ${s * 1.5})`);
    root.style.setProperty('--platform-shadow-xl', `0 20px 40px rgba(0, 0, 0, ${s * 2})`);

    // Border Width
    root.style.setProperty('--platform-border-width', `${b}px`);

    // Primary Color
    root.style.setProperty('--platform-primary', c);
  };

  // 프리셋 테마
  const applyPreset = (preset: string) => {
    let r = 8, s = 0.1, b = 1, c = '#2563eb';

    switch (preset) {
      case 'modern':
        r = 12; s = 0.15; b = 1; c = '#2563eb';
        break;
      case 'sharp':
        r = 0; s = 0.05; b = 2; c = '#1f2937';
        break;
      case 'soft':
        r = 16; s = 0.2; b = 0; c = '#10b981';
        break;
      case 'minimal':
        r = 4; s = 0; b = 1; c = '#6b7280';
        break;
    }

    setRadius(r);
    setShadowIntensity(s);
    setBorderWidth(b);
    setPrimaryColor(c);
    updateTheme(r, s, b, c);
  };

  // CSS Variables 파싱 및 적용
  const parseAndApplyCSS = () => {
    try {
      let r = 8, s = 0.1, b = 1, c = '#2563eb';

      // --radius 추출 (rem을 px로 변환, 1rem = 16px)
      const radiusMatch = cssInput.match(/--radius:\s*([\d.]+)rem/);
      if (radiusMatch) {
        r = parseFloat(radiusMatch[1]) * 16;
      }

      // --primary 색상 추출
      const primaryMatch = cssInput.match(/--primary:\s*(#[0-9a-fA-F]{6})/);
      if (primaryMatch) {
        c = primaryMatch[1];
      }

      // --shadow 추출 (opacity 부분)
      const shadowMatch = cssInput.match(/--shadow-md:.*?rgba?\([^)]*\/\s*([\d.]+)\)/);
      if (shadowMatch) {
        s = parseFloat(shadowMatch[1]);
      } else {
        // hsl 형식의 shadow도 체크
        const hslShadowMatch = cssInput.match(/--shadow-md:.*?hsl\([^)]*\/\s*([\d.]+)\)/);
        if (hslShadowMatch) {
          s = parseFloat(hslShadowMatch[1]);
        }
      }

      // border 두께 추출 (일반적으로 1-2px)
      const borderMatch = cssInput.match(/border:\s*(\d+)px/);
      if (borderMatch) {
        b = parseInt(borderMatch[1]);
      }

      // 값 적용
      setRadius(r);
      setShadowIntensity(s);
      setBorderWidth(b);
      setPrimaryColor(c);
      updateTheme(r, s, b, c);

      alert('CSS 테마가 적용되었습니다!');
    } catch (error) {
      alert('CSS 파싱 중 오류가 발생했습니다. 다시 시도해주세요.');
      console.error(error);
    }
  };

  // 현재 설정을 프리셋으로 저장
  const saveCurrentAsPreset = () => {
    const name = prompt('프리셋 이름을 입력하세요:');
    if (!name) return;

    const preset = { radius, shadowIntensity, borderWidth, primaryColor };
    const updated = { ...savedPresets, [name]: preset };

    setSavedPresets(updated);
    localStorage.setItem('platform-presets', JSON.stringify(updated));

    alert(`"${name}" 프리셋이 저장되었습니다!`);
  };

  // 저장된 프리셋 불러오기
  const loadPreset = (name: string) => {
    const preset = savedPresets[name];
    if (!preset) return;

    setRadius(preset.radius);
    setShadowIntensity(preset.shadowIntensity);
    setBorderWidth(preset.borderWidth);
    setPrimaryColor(preset.primaryColor);
    updateTheme(preset.radius, preset.shadowIntensity, preset.borderWidth, preset.primaryColor);
  };

  // 프리셋 삭제
  const deletePreset = (name: string) => {
    if (!confirm(`"${name}" 프리셋을 삭제하시겠습니까?`)) return;

    const updated = { ...savedPresets };
    delete updated[name];

    setSavedPresets(updated);
    localStorage.setItem('platform-presets', JSON.stringify(updated));
  };

  // 컴포넌트 마운트 시 저장된 프리셋 불러오기
  useEffect(() => {
    const saved = localStorage.getItem('platform-presets');
    if (saved) {
      setSavedPresets(JSON.parse(saved));
    }
  }, []);

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>
        Platform 디자인 시스템 테스트
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '40px' }}>
        슬라이더를 조정하여 실시간으로 전체 디자인을 변경해보세요
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '40px' }}>
        {/* 왼쪽: 컨트롤 패널 */}
        <div className="platform-card" style={{ height: 'fit-content' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px' }}>
            테마 설정
          </h2>

          {/* 프리셋 버튼들 */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', marginBottom: '12px', fontWeight: '500' }}>
              프리셋 테마
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button className="platform-btn platform-btn-outline" onClick={() => applyPreset('modern')}>
                Modern
              </button>
              <button className="platform-btn platform-btn-outline" onClick={() => applyPreset('sharp')}>
                Sharp
              </button>
              <button className="platform-btn platform-btn-outline" onClick={() => applyPreset('soft')}>
                Soft
              </button>
              <button className="platform-btn platform-btn-outline" onClick={() => applyPreset('minimal')}>
                Minimal
              </button>
            </div>
          </div>

          {/* CSS 붙여넣기 */}
          <div style={{ marginBottom: '32px', padding: '16px', background: '#f8f9fa', borderRadius: '8px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
              🎨 CSS Variables 붙여넣기
            </label>
            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>
              :root에서 CSS Variables를 복사해서 붙여넣으세요
            </p>
            <textarea
              value={cssInput}
              onChange={(e) => setCssInput(e.target.value)}
              placeholder=":root {
  --radius: 0.4rem;
  --primary: #d04f99;
  --shadow-md: ...;
}"
              style={{
                width: '100%',
                height: '120px',
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid #e0e0e0',
                fontSize: '12px',
                fontFamily: 'monospace',
                resize: 'vertical',
                marginBottom: '12px'
              }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="platform-btn platform-btn-primary"
                onClick={parseAndApplyCSS}
                style={{ flex: 1 }}
              >
                적용하기
              </button>
              <button
                className="platform-btn platform-btn-secondary"
                onClick={saveCurrentAsPreset}
                style={{ flex: 1 }}
              >
                저장하기
              </button>
            </div>
          </div>

          {/* 저장된 프리셋 목록 */}
          {Object.keys(savedPresets).length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', marginBottom: '12px', fontWeight: '500' }}>
                저장된 프리셋
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {Object.keys(savedPresets).map((name) => (
                  <div key={name} style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="platform-btn platform-btn-outline"
                      onClick={() => loadPreset(name)}
                      style={{ flex: 1, textAlign: 'left' }}
                    >
                      {name}
                    </button>
                    <button
                      onClick={() => deletePreset(name)}
                      style={{
                        padding: '8px 12px',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Border Radius */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              모서리 둥글기: {radius}px
            </label>
            <input
              type="range"
              min="0"
              max="24"
              value={radius}
              onChange={(e) => {
                const val = Number(e.target.value);
                setRadius(val);
                updateTheme(val, undefined, undefined, undefined);
              }}
              style={{ width: '100%' }}
            />
          </div>

          {/* Shadow Intensity */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              그림자 강도: {(shadowIntensity * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0"
              max="0.3"
              step="0.01"
              value={shadowIntensity}
              onChange={(e) => {
                const val = Number(e.target.value);
                setShadowIntensity(val);
                updateTheme(undefined, val, undefined, undefined);
              }}
              style={{ width: '100%' }}
            />
          </div>

          {/* Border Width */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              테두리 두께: {borderWidth}px
            </label>
            <input
              type="range"
              min="0"
              max="4"
              value={borderWidth}
              onChange={(e) => {
                const val = Number(e.target.value);
                setBorderWidth(val);
                updateTheme(undefined, undefined, val, undefined);
              }}
              style={{ width: '100%' }}
            />
          </div>

          {/* Primary Color */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              메인 컬러
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#1f2937'].map((color) => (
                <button
                  key={color}
                  onClick={() => {
                    setPrimaryColor(color);
                    updateTheme(undefined, undefined, undefined, color);
                  }}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: color,
                    border: primaryColor === color ? '3px solid #000' : '1px solid #e0e0e0',
                    cursor: 'pointer'
                  }}
                />
              ))}
            </div>
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => {
                const color = e.target.value;
                setPrimaryColor(color);
                updateTheme(undefined, undefined, undefined, color);
              }}
              style={{ width: '100%', height: '40px', marginTop: '8px', cursor: 'pointer' }}
            />
          </div>
        </div>

        {/* 오른쪽: 샘플 컴포넌트들 */}
        <div>
          <div className="platform-card" style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              버튼 스타일
            </h3>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button className="platform-btn platform-btn-primary">Primary Button</button>
              <button className="platform-btn platform-btn-outline">Outline Button</button>
              <button className="platform-btn platform-btn-secondary">Secondary Button</button>
            </div>
          </div>

          <div className="platform-card" style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              배지 스타일
            </h3>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <span className="platform-badge platform-badge-primary">Primary Badge</span>
              <span className="platform-badge platform-badge-outline">Outline Badge</span>
              <span className="platform-badge platform-badge-success">Success Badge</span>
            </div>
          </div>

          <div className="platform-card" style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              입력 필드
            </h3>
            <input
              type="text"
              className="platform-input"
              placeholder="이메일을 입력하세요"
              style={{ width: '100%', marginBottom: '12px' }}
            />
            <input
              type="text"
              className="platform-input"
              placeholder="비밀번호를 입력하세요"
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="platform-card">
              <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                카드 1
              </h4>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>
                이것은 샘플 카드입니다. 마우스를 올려보세요.
              </p>
            </div>

            <div className="platform-card">
              <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                카드 2
              </h4>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>
                디자인 시스템이 일괄 적용됩니다.
              </p>
            </div>

            <div className="platform-card">
              <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                카드 3
              </h4>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>
                모든 요소가 동시에 변경됩니다.
              </p>
            </div>

            <div className="platform-card">
              <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                카드 4
              </h4>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>
                CSS Variables의 힘입니다!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 하단: 현재 설정 값 표시 */}
      <div className="platform-card" style={{ marginTop: '40px', background: '#f8f9fa' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
          현재 CSS Variables
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '13px', fontFamily: 'monospace' }}>
          <div>--platform-radius-md: {radius}px</div>
          <div>--platform-shadow-md: rgba(0,0,0,{shadowIntensity})</div>
          <div>--platform-border-width: {borderWidth}px</div>
          <div>--platform-primary: {primaryColor}</div>
        </div>
      </div>
    </div>
  );
}
