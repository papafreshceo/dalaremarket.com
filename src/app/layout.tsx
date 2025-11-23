// app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from '@/contexts/ThemeContext';
import { SessionProvider } from '@/contexts/SessionProvider';
import { ClientProviders } from '@/components/providers/ClientProviders';
import AgriChatbot from '@/components/chatbot/AgriChatbot';

export const metadata: Metadata = {
  title: "달래마켓",
  description: "B2B 통합 비즈니스 플랫폼",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "달래마켓",
  },
  icons: {
    icon: "/icon.svg",
  },
  applicationName: "달래마켓",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: "#2563eb",
};

// Pretendard 폰트 CDN으로 사용
const fontClassName = 'font-pretendard'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning data-scroll-behavior="smooth">
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // 무조건 라이트모드로 강제 설정
                  const path = window.location.pathname;
                  if (path.startsWith('/admin') || path.startsWith('/platform/orders')) {
                    document.documentElement.classList.remove('dark');
                    localStorage.setItem('theme', 'light');
                  }
                } catch(e) {}
              })();
            `
          }}
        />
      </head>
      <body className="font-pretendard antialiased" style={{ visibility: 'visible' }}>
        <SessionProvider>
          <ThemeProvider>
            <ClientProviders>
              {children}
              <AgriChatbot />
            </ClientProviders>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
