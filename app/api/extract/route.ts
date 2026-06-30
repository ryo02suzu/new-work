import { NextResponse } from "next/server";
import { extractOrder } from "@/lib/extract";
import type { ExtractInput } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  let body: ExtractInput;
  try {
    body = (await req.json()) as ExtractInput;
  } catch {
    return NextResponse.json({ error: "JSONを解析できませんでした" }, { status: 400 });
  }

  const text = (body?.text || "").trim();
  const image = body?.image;

  if (!text && !image) {
    return NextResponse.json(
      { error: "注文テキストを貼り付けるか、注文書の画像をアップロードしてください" },
      { status: 400 }
    );
  }
  if (text.length > 8000) {
    return NextResponse.json({ error: "テキストが長すぎます" }, { status: 400 });
  }
  if (image?.data && image.data.length > 8_000_000) {
    return NextResponse.json({ error: "画像が大きすぎます（約6MBまで）" }, { status: 400 });
  }

  const result = await extractOrder({ text: text || undefined, image });
  return NextResponse.json(result);
}
