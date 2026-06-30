import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZEIPILOT — フリーランスのAI経理エージェント",
  description:
    "取引データを入れるだけ。AIが事業/プライベートを判定して自動仕訳し、手取りと税金の概算を即計算します。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
