import type { ProductInput } from "./types";

/**
 * 一括生成用のパーサ。1行＝1商品。列は「|」区切り:
 *   商品名 | 特徴(；で複数) | ターゲット | トーン | 価格
 * 商品名と特徴のみ必須。ヘッダ行・空行は読み飛ばす。
 */
export function parseBulk(text: string): ProductInput[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const out: ProductInput[] = [];
  for (const line of lines) {
    if (/^商品名\s*[|｜]/.test(line)) continue; // ヘッダ
    const cols = line.split(/[|｜]/).map((c) => c.trim());
    const [name, features, audience, tone, price] = cols;
    if (!name || !features) continue;
    out.push({
      name,
      features: features.replace(/[；;]/g, "\n"),
      audience: audience || undefined,
      tone: tone || undefined,
      price: price || undefined,
    });
  }
  return out;
}
