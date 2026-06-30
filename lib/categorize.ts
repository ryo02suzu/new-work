import Anthropic from "@anthropic-ai/sdk";
import { ACCOUNTS, type Categorized, type CategorizeResult, type Txn } from "./types";

const MODEL = process.env.ZEIPILOT_MODEL || "claude-opus-4-8";

const SYSTEM = `あなたは日本のフリーランス・個人事業主の経理を担当するAIアシスタントです。
渡された取引明細を1件ずつ分類してください。

判定ルール:
- 入金（売上・報酬）は kind="income"、account="売上"、deductible=false。
- 事業に使った支出は kind="business"、適切な勘定科目を account に設定、deductible=true。
- 私的な支出（食料品・趣味・家族の生活費など事業と関係ないもの）は kind="private"、account="事業主貸（プライベート）"、deductible=false。
- 家賃・電気・通信など事業と私用が混在しうるものは、事業利用が妥当なら business とし、reason に「家事按分が必要」と添える。
- confidence は 0〜1。判断に迷うものは低めにし、人間の確認を促す。
- reason は日本語で1文、なぜその判定にしたかを簡潔に。

使用してよい勘定科目（account）はこの中から選ぶ:
${ACCOUNTS.join(" / ")}`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["results"],
  properties: {
    results: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["index", "kind", "account", "deductible", "confidence", "reason"],
        properties: {
          index: { type: "integer" },
          kind: { type: "string", enum: ["income", "business", "private"] },
          account: { type: "string" },
          deductible: { type: "boolean" },
          confidence: { type: "number" },
          reason: { type: "string" },
        },
      },
    },
  },
} as const;

function buildUserPrompt(txns: Txn[]): string {
  const lines = txns.map((t, i) => {
    const sign = t.amount >= 0 ? "入金" : "出金";
    return `${i}. [${t.date}] ${t.description} / ${sign} ¥${Math.abs(
      t.amount
    ).toLocaleString("ja-JP")}`;
  });
  return `次の取引を分類し、各取引の index に対応する results を返してください。\n\n${lines.join(
    "\n"
  )}`;
}

/** Anthropic API を使ったAI仕訳。キーが無い／失敗時はモックにフォールバック。 */
export async function categorize(txns: Txn[]): Promise<CategorizeResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { engine: "mock", results: txns.map((t, i) => mockOne(t, i)) };
  }

  try {
    const client = new Anthropic();
    const params = {
      model: MODEL,
      max_tokens: 8000,
      system: SYSTEM,
      messages: [{ role: "user", content: buildUserPrompt(txns) }],
      output_config: { format: { type: "json_schema", schema: SCHEMA } },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    const res = await client.messages.create(params);
    const text =
      (res.content as Array<{ type: string; text?: string }>).find(
        (b) => b.type === "text"
      )?.text ?? "";
    const parsed = JSON.parse(text) as { results: Categorized[] };

    const byIndex = new Map<number, Categorized>();
    for (const r of parsed.results) byIndex.set(r.index, r);

    const results = txns.map((t, i) => byIndex.get(i) ?? mockOne(t, i));
    return { engine: "ai", results };
  } catch (err) {
    console.error("[categorize] AI失敗のためモックにフォールバック:", err);
    return { engine: "mock", results: txns.map((t, i) => mockOne(t, i)) };
  }
}

// ───────────────────────────────────────────────────────────
// ルールベースのモック（キー無し・オフラインでもデモが動くように）
// ───────────────────────────────────────────────────────────
const RULES: Array<{ re: RegExp; account: string; kind: "business" | "private" }> = [
  { re: /(suica|pasmo|jr|電車|タクシー|交通|新幹線)/i, account: "旅費交通費", kind: "business" },
  { re: /(aws|amazon web|さくら|サーバ|ドメイン|通信|携帯|softbank|docomo|au )/i, account: "通信費", kind: "business" },
  { re: /(adobe|notion|figma|github|saas|月額|サブスク|ソフト|弥生)/i, account: "消耗品費", kind: "business" },
  { re: /(コワーキング|wework|レンタルオフィス|家賃|賃料)/i, account: "地代家賃", kind: "business" },
  { re: /(外注|ランサーズ|crowdworks|委託|制作 依頼)/i, account: "外注費", kind: "business" },
  { re: /(電気|ガス|水道|東京電力|光熱)/i, account: "水道光熱費", kind: "business" },
  { re: /(書|オライリー|技術書|新聞|雑誌)/i, account: "新聞図書費", kind: "business" },
  { re: /(名刺|チラシ|広告|ラクスル|印刷)/i, account: "広告宣伝費", kind: "business" },
  { re: /(会食|飲み|居酒屋|鳥貴族|接待)/i, account: "接待交際費", kind: "business" },
  { re: /(スターバックス|カフェ|打ち合わせ|打合せ|ミーティング|会議)/i, account: "会議費", kind: "business" },
  { re: /(usb|ハブ|文具|消耗|備品|amazon)/i, account: "消耗品費", kind: "business" },
  { re: /(netflix|spotify|スーパー|食料|コンビニ|薬|衣|趣味)/i, account: "事業主貸（プライベート）", kind: "private" },
];

function mockOne(t: Txn, index: number): Categorized {
  if (t.amount > 0) {
    return {
      index,
      kind: "income",
      account: "売上",
      deductible: false,
      confidence: 0.95,
      reason: "入金のため売上として計上。",
    };
  }
  for (const rule of RULES) {
    if (rule.re.test(t.description)) {
      const isPrivate = rule.kind === "private";
      return {
        index,
        kind: rule.kind,
        account: rule.account,
        deductible: !isPrivate,
        confidence: 0.6,
        reason: isPrivate
          ? "私的な支出と推定（ルールベース判定）。"
          : `「${rule.account}」に該当（ルールベース判定）。`,
      };
    }
  }
  return {
    index,
    kind: "business",
    account: "雑費",
    deductible: true,
    confidence: 0.35,
    reason: "科目を特定できず雑費に分類。要確認。",
  };
}
