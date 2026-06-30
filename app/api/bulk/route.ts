import { NextResponse } from "next/server";
import { generateMany } from "@/lib/generate";
import type { ProductInput } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  let body: { products?: ProductInput[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSONを解析できませんでした" }, { status: 400 });
  }

  const products = (Array.isArray(body?.products) ? body.products : [])
    .map((p) => ({
      name: (p?.name || "").trim(),
      features: (p?.features || "").trim(),
      audience: (p?.audience || "").toString().trim() || undefined,
      tone: (p?.tone || "").toString().trim() || undefined,
      price: (p?.price || "").toString().trim() || undefined,
    }))
    .filter((p) => p.name && p.features);

  if (products.length === 0) {
    return NextResponse.json(
      { error: "商品がありません。「商品名 | 特徴」の形式で入力してください" },
      { status: 400 }
    );
  }
  if (products.length > 20) {
    return NextResponse.json(
      { error: "一括生成はデモでは20件までです" },
      { status: 400 }
    );
  }

  const items = await generateMany(products);
  return NextResponse.json({ items });
}
