import { NextResponse } from "next/server";
import { extractMany } from "@/lib/extract";
import type { ExtractInput } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  let body: { inputs?: ExtractInput[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSONを解析できませんでした" }, { status: 400 });
  }

  const inputs = (Array.isArray(body?.inputs) ? body.inputs : []).filter(
    (i) => (i?.text && i.text.trim()) || i?.image?.data
  );

  if (inputs.length === 0) {
    return NextResponse.json(
      { error: "注文がありません。テキストを「---」で区切るか、画像を複数選択してください" },
      { status: 400 }
    );
  }
  if (inputs.length > 20) {
    return NextResponse.json({ error: "一括処理はデモでは20件までです" }, { status: 400 });
  }

  const items = await extractMany(inputs);
  return NextResponse.json({ items });
}
