import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ウケトル — FAX・メール・電話の注文をAIがデータ化",
  description:
    "FAX・メール・電話メモの注文を、AIが数秒で“そのまま使えるデータ”に。Excel/基幹に転記できるCSVで出力。受発注の手入力をゼロにする、卸・製造の小さな会社のためのツール。",
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
