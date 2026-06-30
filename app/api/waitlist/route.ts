import { NextResponse } from "next/server";

export const runtime = "nodejs";

// プリセール用の先行登録エンドポイント（MVP）。
// 本番では Supabase / ConvertKit / Google Sheet などに保存する想定。
// いまはバリデーションして受領を返すだけ（メールはサーバーログにのみ出力）。
export async function POST(req: Request) {
  let body: { email?: string; segment?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }
  const email = (body.email || "").trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "メールアドレスの形式を確認してください" }, { status: 400 });
  }
  console.log(`[waitlist] 先行登録: ${email} (${body.segment || "-"})`);
  return NextResponse.json({ ok: true });
}
