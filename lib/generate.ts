import Anthropic from "@anthropic-ai/sdk";
import type { GenerateResult, ListingPack, ProductInput } from "./types";

const MODEL = process.env.URIKO_MODEL || "claude-opus-4-8";

const SYSTEM = `あなたは日本のネットショップ（EC）専門の超一流コピーライター兼ECコンサルタントです。
渡された商品情報をもとに、すぐ出品・販促に使える「出品パック」を作ります。

必ず守ること:
- 日本語。誇大広告・景品表示法に触れる断定（「絶対」「No.1」根拠なし等）は避け、魅力は具体的に表現する。
- 商品説明文は3パターン作る。それぞれ label に想定トーン（例: 標準 / 感情訴求 / スペック重視）を入れる。
- catchcopy は短く強い候補を5つ。
- bullets は購入の決め手になる訴求ポイントを5つ、簡潔に。
- seo.title は検索を意識した商品タイトル（全角30〜40字目安）、keywords は検索キーワードを8語前後。
- social は X(旧Twitter)用とInstagram用の2つ。Instagramは末尾にハッシュタグを5個程度付ける。
- ads は Google検索広告を想定し、見出し(headline 全角15字以内目安)＋説明(body 45字以内目安)を2セット。
- ユーザー指定のトーン・ターゲット・価格があれば最優先で反映する。`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["catchcopy", "descriptions", "bullets", "seo", "social", "ads"],
  properties: {
    catchcopy: { type: "array", items: { type: "string" } },
    descriptions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["label", "text"],
        properties: { label: { type: "string" }, text: { type: "string" } },
      },
    },
    bullets: { type: "array", items: { type: "string" } },
    seo: {
      type: "object",
      additionalProperties: false,
      required: ["title", "keywords"],
      properties: {
        title: { type: "string" },
        keywords: { type: "array", items: { type: "string" } },
      },
    },
    social: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["platform", "text"],
        properties: { platform: { type: "string" }, text: { type: "string" } },
      },
    },
    ads: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["headline", "body"],
        properties: { headline: { type: "string" }, body: { type: "string" } },
      },
    },
  },
} as const;

function buildPrompt(p: ProductInput): string {
  const lines = [
    `商品名: ${p.name}`,
    `特徴・メモ:\n${p.features}`,
    p.audience ? `ターゲット顧客: ${p.audience}` : "",
    p.tone ? `希望トーン: ${p.tone}` : "",
    p.price ? `価格: ${p.price}` : "",
  ].filter(Boolean);
  return `次の商品の出品パックを作ってください。\n\n${lines.join("\n")}`;
}

export type BulkItem = { product: ProductInput } & GenerateResult;

/** 複数商品をまとめて生成（同時実行は控えめにしてレート制限を回避） */
export async function generateMany(products: ProductInput[]): Promise<BulkItem[]> {
  const out: BulkItem[] = [];
  const CONCURRENCY = 4;
  for (let i = 0; i < products.length; i += CONCURRENCY) {
    const batch = products.slice(i, i + CONCURRENCY);
    const res = await Promise.all(
      batch.map((p) => generate(p).then((g) => ({ product: p, ...g })))
    );
    out.push(...res);
  }
  return out;
}

export async function generate(input: ProductInput): Promise<GenerateResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { engine: "mock", pack: mockPack(input) };
  }
  try {
    const client = new Anthropic();
    const params = {
      model: MODEL,
      max_tokens: 6000,
      system: SYSTEM,
      messages: [{ role: "user", content: buildPrompt(input) }],
      output_config: { format: { type: "json_schema", schema: SCHEMA } },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    const res = await client.messages.create(params);
    const text =
      (res.content as Array<{ type: string; text?: string }>).find(
        (b) => b.type === "text"
      )?.text ?? "";
    const pack = JSON.parse(text) as ListingPack;
    return { engine: "ai", pack };
  } catch (err) {
    console.error("[generate] AI失敗のためモックにフォールバック:", err);
    return { engine: "mock", pack: mockPack(input) };
  }
}

// ───────── キー無し・オフラインでも動くテンプレート版 ─────────
function mockPack(p: ProductInput): ListingPack {
  const feats = p.features
    .split(/[\n,、・]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const f0 = feats[0] || "こだわりの一品";
  const aud = p.audience || "あなた";
  return {
    catchcopy: [
      `毎日が変わる、${p.name}。`,
      `${aud}のための${p.name}。`,
      `${f0}を、もっと身近に。`,
      `選ばれる理由がある、${p.name}。`,
      `今日から使いたくなる${p.name}。`,
    ],
    descriptions: [
      {
        label: "標準",
        text: `${p.name}は、${feats.slice(0, 3).join("・") || f0}が特長の商品です。${aud}の毎日に寄り添い、使うほどに違いを感じられます。`,
      },
      {
        label: "感情訴求",
        text: `「これだ」と思える${p.name}に、出会えていますか。${f0}が、いつもの時間を少し特別に。${aud}へ、自信を持っておすすめします。`,
      },
      {
        label: "スペック重視",
        text: `【特長】${feats.join(" / ") || f0}${p.price ? `\n【価格】${p.price}` : ""}\n${aud}のニーズに応える仕様で、長く愛用いただけます。`,
      },
    ],
    bullets: (feats.length ? feats : [f0]).slice(0, 5).map((x) => `${x}`),
    seo: {
      title: `${p.name} ${feats.slice(0, 2).join(" ")}`.trim(),
      keywords: [p.name, ...feats.slice(0, 5), aud, "通販", "おすすめ"].filter(Boolean),
    },
    social: [
      {
        platform: "X",
        text: `新登場🎉 ${p.name}\n${f0}で毎日がちょっと快適に。\n${p.price ? `${p.price}〜 ` : ""}気になる方はチェック👀`,
      },
      {
        platform: "Instagram",
        text: `${p.name} ✨\n${feats.slice(0, 2).join(" / ") || f0}\n${aud}におすすめの一品です。\n\n#${p.name.replace(/\s/g, "")} #おすすめ #毎日使い #ギフト #ネットショップ`,
      },
    ],
    ads: [
      { headline: `${p.name}`, body: `${f0}。${aud}に人気。${p.price || "好評発売中"}。` },
      { headline: `${f0}なら`, body: `${p.name}が選ばれています。今すぐチェック。` },
    ],
  };
}
