import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "URIKO — ネットショップの“売る言葉”をAIが量産",
  description:
    "商品名と特徴を入れるだけ。商品説明文・キャッチコピー・SEO・SNS投稿・広告コピーをAIが一発で生成。ネットショップ運営者のための出品コピー自動生成ツール。",
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
