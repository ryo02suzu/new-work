import type { ListingPack } from "./types";

export const MALLS = ["楽天市場", "Amazon", "BASE", "メルカリShops"] as const;
export type Mall = (typeof MALLS)[number];

function desc(pack: ListingPack, keyword: string): string {
  return (
    pack.descriptions.find((d) => d.label.includes(keyword))?.text ||
    pack.descriptions[0]?.text ||
    ""
  );
}

/** 出品パックを各モールの慣習に合わせた「そのまま貼れる」テキストに整形する。 */
export function formatForMall(mall: Mall, pack: ListingPack, productName: string): string {
  const bullets = pack.bullets.map((b) => `・${b}`).join("\n");
  const tags = pack.seo.keywords.slice(0, 5).map((k) => `#${k.replace(/\s/g, "")}`).join(" ");
  const insta = pack.social.find((s) => s.platform.toLowerCase().includes("insta"))?.text || "";

  switch (mall) {
    case "楽天市場":
      return [
        `【商品名（SEO最適化）】`,
        pack.seo.title,
        ``,
        `【キャッチコピー】`,
        pack.catchcopy[0] || "",
        ``,
        `【商品説明】`,
        desc(pack, "標準"),
        ``,
        `【選ばれる理由】`,
        bullets,
      ].join("\n");

    case "Amazon":
      return [
        `■ 商品タイトル`,
        pack.seo.title,
        ``,
        `■ 商品の特徴（箇条書き／5点）`,
        bullets,
        ``,
        `■ 商品説明`,
        desc(pack, "スペック") || desc(pack, "標準"),
      ].join("\n");

    case "BASE":
      return [
        productName,
        ``,
        desc(pack, "感情") || desc(pack, "標準"),
        ``,
        insta || tags,
      ].join("\n");

    case "メルカリShops":
      return [
        pack.catchcopy[0] || productName,
        ``,
        desc(pack, "カジュアル") || desc(pack, "標準"),
        ``,
        tags,
      ].join("\n");
  }
}

/** パック全体を1つのテキストにまとめる（全部コピー用） */
export function packToText(pack: ListingPack, productName: string): string {
  return [
    `# ${productName} — 出品パック（URIKO）`,
    ``,
    `## キャッチコピー`,
    pack.catchcopy.map((c) => `- ${c}`).join("\n"),
    ``,
    `## 商品説明文`,
    pack.descriptions.map((d) => `### ${d.label}\n${d.text}`).join("\n\n"),
    ``,
    `## 訴求ポイント`,
    pack.bullets.map((b) => `- ${b}`).join("\n"),
    ``,
    `## SEO`,
    `タイトル: ${pack.seo.title}`,
    `キーワード: ${pack.seo.keywords.join(", ")}`,
    ``,
    `## SNS投稿`,
    pack.social.map((s) => `### ${s.platform}\n${s.text}`).join("\n\n"),
    ``,
    `## 検索広告`,
    pack.ads.map((a) => `- ${a.headline} / ${a.body}`).join("\n"),
  ].join("\n");
}
