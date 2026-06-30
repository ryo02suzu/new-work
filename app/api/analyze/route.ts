import { NextResponse } from "next/server";
import { categorize } from "@/lib/categorize";
import { estimateTax } from "@/lib/tax";
import type { AnalyzedItem, Txn } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  let body: { transactions?: Txn[]; socialInsurance?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSONを解析できませんでした" }, { status: 400 });
  }

  const txns = Array.isArray(body.transactions) ? body.transactions : [];
  if (txns.length === 0) {
    return NextResponse.json({ error: "取引データがありません" }, { status: 400 });
  }
  if (txns.length > 300) {
    return NextResponse.json(
      { error: "デモでは一度に300件までです" },
      { status: 400 }
    );
  }

  const { engine, results } = await categorize(txns);

  const items: AnalyzedItem[] = txns.map((t, i) => ({ ...t, ...results[i] }));

  const revenue = items
    .filter((it) => it.kind === "income")
    .reduce((s, it) => s + Math.max(0, it.amount), 0);
  const expenses = items
    .filter((it) => it.kind === "business" && it.deductible)
    .reduce((s, it) => s + Math.abs(it.amount), 0);
  const privateSpend = items
    .filter((it) => it.kind === "private")
    .reduce((s, it) => s + Math.abs(it.amount), 0);

  const tax = estimateTax({
    revenue,
    expenses,
    socialInsurance: Math.max(0, Number(body.socialInsurance) || 0),
  });

  return NextResponse.json({
    engine,
    items,
    totals: { revenue, expenses, privateSpend, count: items.length },
    tax,
  });
}
