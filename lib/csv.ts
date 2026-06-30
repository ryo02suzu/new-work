import type { Txn } from "./types";

/**
 * シンプルなCSVパーサ。
 * 形式: 日付,内容,金額   （金額は 正=入金 / 負=出金）
 * 内容にカンマが含まれてもよいよう、先頭=日付・末尾=金額・中間=内容として解釈する。
 * 銀行/カードのCSVをそのまま貼っても動くよう、ヘッダ行や空行は読み飛ばす。
 */
export function parseCsv(text: string): Txn[] {
  const lines = text.split(/\r?\n/);
  const out: Txn[] = [];

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const parts = line.split(",");
    if (parts.length < 2) continue;

    const date = parts[0].trim();
    const amountRaw = parts[parts.length - 1].trim();
    const description =
      parts.length >= 3 ? parts.slice(1, parts.length - 1).join(",").trim() : "";

    const amount = Number(amountRaw.replace(/[¥,\s]/g, ""));
    if (!Number.isFinite(amount) || amount === 0) continue; // ヘッダ行や合計行を除外
    if (!date) continue;

    out.push({ date, description: description || `取引 ${date}`, amount });
  }

  return out;
}
