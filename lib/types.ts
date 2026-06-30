// URIKO — 共有型定義

export const TONES = [
  "標準",
  "高級・上質",
  "カジュアル・親しみ",
  "感情に訴える",
  "スペック重視",
] as const;
export type Tone = (typeof TONES)[number];

/** ユーザーが入力する商品情報 */
export type ProductInput = {
  name: string;
  /** 特徴・素材・サイズなどのメモ（箇条書きでOK） */
  features: string;
  /** ターゲット顧客（任意） */
  audience?: string;
  tone?: Tone | string;
  price?: string;
};

/** AIが生成する「出品パック」 */
export type ListingPack = {
  /** キャッチコピー候補 */
  catchcopy: string[];
  /** 商品説明文（トーン違い複数） */
  descriptions: { label: string; text: string }[];
  /** 箇条書きの訴求ポイント */
  bullets: string[];
  /** SEO向けのタイトルとキーワード */
  seo: { title: string; keywords: string[] };
  /** SNS投稿（X / Instagram など） */
  social: { platform: string; text: string }[];
  /** 検索連動型広告などの見出し＋説明 */
  ads: { headline: string; body: string }[];
};

export type GenerateResult = {
  engine: "ai" | "mock";
  pack: ListingPack;
};
