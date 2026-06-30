import Anthropic from "@anthropic-ai/sdk";
import type { ExtractInput, ExtractResult, Order } from "./types";

const MODEL = process.env.UKETORU_MODEL || "claude-opus-4-8";

const SYSTEM = `あなたは日本の卸・製造業の受発注業務を代行するAIです。
FAX・メール・電話メモなどの「注文」を読み取り、基幹システムやExcelにそのまま転記できる構造化データに変換します。

厳守:
- 書かれている内容だけを抽出する。推測で埋めない。
- 読み取れない／欠けている／曖昧な項目（数量不明、品番の判読不可、納期の記載なし等）は warnings に「要確認」として具体的に挙げる。
- 数量は単位込みでもよい（例「10ケース」）。単価・金額が書かれていなければ空文字。
- 商品が複数行あれば items を分けて、できるだけ漏れなく拾う。
- 取引先名・注文日・納品希望日・配送先・注文番号・備考も拾えれば埋める。`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["supplier", "orderNo", "orderDate", "deliveryDate", "shipTo", "items", "notes", "warnings"],
  properties: {
    supplier: { type: "string" },
    orderNo: { type: "string" },
    orderDate: { type: "string" },
    deliveryDate: { type: "string" },
    shipTo: { type: "string" },
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "code", "quantity", "unit", "unitPrice", "amount", "note"],
        properties: {
          name: { type: "string" },
          code: { type: "string" },
          quantity: { type: "string" },
          unit: { type: "string" },
          unitPrice: { type: "string" },
          amount: { type: "string" },
          note: { type: "string" },
        },
      },
    },
    notes: { type: "string" },
    warnings: { type: "array", items: { type: "string" } },
  },
} as const;

/** 複数の注文をまとめて処理（同時実行は控えめにしてレート制限を回避） */
export async function extractMany(inputs: ExtractInput[]): Promise<ExtractResult[]> {
  const out: ExtractResult[] = [];
  const CONCURRENCY = 3;
  for (let i = 0; i < inputs.length; i += CONCURRENCY) {
    const batch = inputs.slice(i, i + CONCURRENCY);
    const res = await Promise.all(batch.map(extractOrder));
    out.push(...res);
  }
  return out;
}

export async function extractOrder(input: ExtractInput): Promise<ExtractResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { engine: "mock", order: mockOrder(input.text || "") };
  }
  try {
    const client = new Anthropic();

    const content: Array<Record<string, unknown>> = [];
    if (input.image) {
      content.push({
        type: "image",
        source: { type: "base64", media_type: input.image.mediaType, data: input.image.data },
      });
    }
    content.push({
      type: "text",
      text:
        "次の注文内容を読み取り、構造化データにしてください。" +
        (input.text ? `\n\n---\n${input.text}\n---` : "（画像の注文書を読み取ってください）"),
    });

    const params = {
      model: MODEL,
      max_tokens: 4000,
      system: SYSTEM,
      messages: [{ role: "user", content }],
      output_config: { format: { type: "json_schema", schema: SCHEMA } },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    const res = await client.messages.create(params);
    const textOut =
      (res.content as Array<{ type: string; text?: string }>).find((b) => b.type === "text")?.text ?? "";
    const order = JSON.parse(textOut) as Order;
    return { engine: "ai", order };
  } catch (err) {
    console.error("[extract] AI失敗のためモックにフォールバック:", err);
    return { engine: "mock", order: mockOrder(input.text || "") };
  }
}

// ── キー無し・オフラインでも形だけ動くモック ──
function mockOrder(text: string): Order {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const items = lines
    .map((l) => {
      const m = l.match(/(.+?)[\s　]*[x×]?[\s　]*(\d+)\s*(個|本|箱|ケース|セット|枚|台)?/);
      if (m && m[2]) {
        return { name: m[1].trim(), code: "", quantity: m[2], unit: m[3] || "", unitPrice: "", amount: "", note: "" };
      }
      return null;
    })
    .filter(Boolean) as Order["items"];
  return {
    supplier: "",
    orderNo: "",
    orderDate: "",
    deliveryDate: "",
    shipTo: "",
    items: items.length ? items : [{ name: "（AIキー未設定の簡易抽出）", code: "", quantity: "", unit: "", unitPrice: "", amount: "", note: "" }],
    notes: "",
    warnings: ["ANTHROPIC_API_KEY 未設定のため簡易抽出です。実際はAIが取引先・納期・備考まで読み取ります。"],
  };
}
