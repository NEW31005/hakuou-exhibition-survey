import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ハクオウロボティクス 展示会アンケート",
  description: "展示会ごとに切り替え可能な来場者アンケートフォーム"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
