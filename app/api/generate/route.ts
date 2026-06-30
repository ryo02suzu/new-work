import { NextResponse } from "next/server";
import { generate } from "@/lib/generate";
import type { ProductInput } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  let body: ProductInput;
  try {
    body = (await req.json()) as ProductInput;
  } catch {
    return NextResponse.json({ error: "JSONを解析できませんでした" }, { status: 400 });
  }

  const name = (body?.name || "").trim();
  const features = (body?.features || "").trim();
  if (!name) {
    return NextResponse.json({ error: "商品名を入力してください" }, { status: 400 });
  }
  if (!features) {
    return NextResponse.json(
      { error: "特徴・メモを入力してください（箇条書きでOK）" },
      { status: 400 }
    );
  }
  if (name.length > 200 || features.length > 4000) {
    return NextResponse.json({ error: "入力が長すぎます" }, { status: 400 });
  }

  const result = await generate({
    name,
    features,
    audience: (body.audience || "").trim() || undefined,
    tone: (body.tone || "").toString().trim() || undefined,
    price: (body.price || "").trim() || undefined,
  });

  return NextResponse.json(result);
}
