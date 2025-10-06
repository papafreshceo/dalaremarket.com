// tailwind.config.ts
import type { Config } from "tailwindcss";
import { tailwindExtend } from "./src/styles/design-tokens";
import defaultTheme from "tailwindcss/defaultTheme";

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // 기본 Tailwind 색상 유지하면서 커스텀 색상 추가
      colors: {
        ...defaultTheme.colors,
        ...tailwindExtend.colors,
        vscode: {
          bg: '#1e1e1e',
          sidebar: '#252526',
          header: '#2d2d30',
          border: '#3e3e42',
          text: '#cccccc',
        },
      },
      spacing: tailwindExtend.spacing,
      fontSize: tailwindExtend.fontSize,
      fontWeight: tailwindExtend.fontWeight,
      fontFamily: tailwindExtend.fontFamily,
      borderRadius: tailwindExtend.borderRadius,
      boxShadow: tailwindExtend.boxShadow,
      maxWidth: tailwindExtend.maxWidth,
      screens: tailwindExtend.screens,

      // 커스텀 애니메이션
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },

      animation: {
        fadeIn: 'fadeIn 250ms ease-in-out',
        slideUp: 'slideUp 250ms ease-out',
        slideDown: 'slideDown 250ms ease-out',
        scaleIn: 'scaleIn 200ms ease-out',
      },

      // 백드롭 블러 활성화
      backdropBlur: defaultTheme.backdropBlur,
    },
  },
  plugins: [],
};

export default config;