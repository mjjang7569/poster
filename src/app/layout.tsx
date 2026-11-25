import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KMGM 논현점 유튜버 초청 포스터",
  description: "KMGM 논현점 월간 유튜버 초청 일정 A2 인쇄용 포스터 편집기",
  robots: { index: false, follow: false },
  icons: { icon: "/favicon.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
