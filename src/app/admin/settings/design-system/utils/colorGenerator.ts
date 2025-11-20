// 색상 자동 생성 유틸리티

/**
 * HEX를 HSL로 변환
 */
export function hexToHSL(hex: string): { h: number; s: number; l: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 0, l: 0 };

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

/**
 * HSL을 HEX로 변환
 */
export function hslToHex(h: number, s: number, l: number): string {
  h = h / 360;
  s = s / 100;
  l = l / 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * 기본 색상에서 50-900 톤 자동 생성
 */
export function generateColorTones(baseColor: string): Record<string, { color: string; opacity: number }> {
  const hsl = hexToHSL(baseColor);

  const tones: Record<string, { color: string; opacity: number }> = {};

  // Lightness 값 매핑
  const lightnessMap: Record<string, number> = {
    '50': 95,
    '100': 90,
    '200': 80,
    '300': 70,
    '400': 60,
    '500': 50, // 기본
    '600': 40,
    '700': 30,
    '800': 20,
    '900': 10
  };

  Object.entries(lightnessMap).forEach(([tone, lightness]) => {
    tones[tone] = {
      color: hslToHex(hsl.h, hsl.s, lightness),
      opacity: 100
    };
  });

  return tones;
}

/**
 * 시멘틱 색상 자동 생성 (Primary 기반)
 */
export function generateSemanticColors(primaryColor: string) {
  const hsl = hexToHSL(primaryColor);

  return {
    secondary: hslToHex((hsl.h + 120) % 360, hsl.s, hsl.l), // 보색
    success: '#22c55e', // 초록
    warning: '#f59e0b', // 노랑
    error: '#ef4444', // 빨강
    info: primaryColor, // Primary와 동일
    neutral: '#6b7280' // 회색
  };
}

/**
 * 톤 조절 적용 (채도, 밝기, 색온도)
 */
export function applyToneAdjustments(
  color: string,
  saturation: number, // -100 ~ +100
  lightness: number, // -100 ~ +100
  temperature: number // -100 (cool) ~ +100 (warm)
): string {
  const hsl = hexToHSL(color);

  // 채도 조절
  let newS = hsl.s + saturation;
  newS = Math.max(0, Math.min(100, newS));

  // 밝기 조절
  let newL = hsl.l + lightness;
  newL = Math.max(0, Math.min(100, newL));

  // 색온도 조절 (Hue 이동)
  let newH = hsl.h + temperature * 0.3; // -30 ~ +30도 이동
  newH = (newH + 360) % 360;

  return hslToHex(newH, newS, newL);
}

/**
 * 100개 색상 팔레트 생성 (Tailwind 스타일)
 */
export function generate100ColorPalette(): string[] {
  const baseColors = [
    '#ef4444', // red
    '#f97316', // orange
    '#f59e0b', // amber
    '#eab308', // yellow
    '#84cc16', // lime
    '#22c55e', // green
    '#10b981', // emerald
    '#14b8a6', // teal
    '#06b6d4', // cyan
    '#0ea5e9', // sky
    '#3b82f6', // blue
    '#6366f1', // indigo
    '#8b5cf6', // violet
    '#a855f7', // purple
    '#d946ef', // fuchsia
    '#ec4899', // pink
    '#f43f5e', // rose
    '#64748b', // slate
    '#6b7280', // gray
    '#78716c', // stone
  ];

  const palette: string[] = [];

  baseColors.forEach(baseColor => {
    const hsl = hexToHSL(baseColor);
    // 각 색상당 5개 톤 생성
    [95, 70, 50, 30, 10].forEach(lightness => {
      palette.push(hslToHex(hsl.h, hsl.s, lightness));
    });
  });

  return palette;
}

/**
 * 프리셋 톤 적용
 */
export function applyPresetTone(color: string, preset: string): string {
  const hsl = hexToHSL(color);

  switch (preset) {
    case 'vibrant':
      return hslToHex(hsl.h, Math.min(100, hsl.s + 20), hsl.l);
    case 'pastel':
      return hslToHex(hsl.h, Math.max(20, hsl.s - 40), Math.min(90, hsl.l + 20));
    case 'dark':
      return hslToHex(hsl.h, hsl.s, Math.max(10, hsl.l - 30));
    case 'monochrome':
      return hslToHex(hsl.h, 0, hsl.l);
    case 'warm':
      return hslToHex((hsl.h + 15) % 360, hsl.s, hsl.l);
    case 'cool':
      return hslToHex((hsl.h - 15 + 360) % 360, hsl.s, hsl.l);
    default:
      return color;
  }
}
