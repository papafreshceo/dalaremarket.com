import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "달래아마켓",
  description: "B2B 통합 비즈니스 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}