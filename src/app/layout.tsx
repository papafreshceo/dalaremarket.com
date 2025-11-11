// app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ClientProviders } from '@/components/providers/ClientProviders';
import AgriChatbot from '@/components/chatbot/AgriChatbot';

export const metadata: Metadata = {
  title: "달래마켓",
  description: "B2B 통합 비즈니스 플랫폼",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

// Pretendard 폰트 CDN으로 사용
const fontClassName = 'font-pretendard'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          as="style"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
        {/* FOUC 방지: 관리자 화면에서만 테마 적용 */}
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                // 관리자 화면에서만 다크모드 적용
                if (window.location.pathname.startsWith('/admin')) {
                  const theme = localStorage.getItem('theme');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                }
              } catch (e) {}
            })();
          `
        }} />
      </head>
      <body className="font-pretendard antialiased" style={{ visibility: 'visible' }}>
        <ThemeProvider>
          <ClientProviders>
            {children}
            <AgriChatbot />
          </ClientProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
