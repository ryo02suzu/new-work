"use client";

import { useState } from "react";
import { SAMPLE_ORDER } from "@/lib/sample";
import { orderToCsv, ordersToCsv } from "@/lib/ordercsv";
import type { ExtractInput, ExtractResult, Order } from "@/lib/types";

type ImageData = { data: string; mediaType: string; name: string };

export default function Home() {
  const [text, setText] = useState("");
  const [image, setImage] = useState<ImageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExtractResult | null>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const m = String(reader.result).match(/^data:(.+?);base64,(.*)$/);
      if (m) setImage({ mediaType: m[1], data: m[2], name: f.name });
    };
    reader.readAsDataURL(f);
  }

  async function run() {
    setError(null);
    if (!text.trim() && !image) {
      return setError("注文テキストを貼り付けるか、注文書の画像をアップロードしてください。");
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim() || undefined,
          image: image ? { data: image.data, mediaType: image.mediaType } : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "読み取りに失敗しました");
      setResult(data as ExtractResult);
      setTimeout(
        () => document.getElementById("result")?.scrollIntoView({ behavior: "smooth" }),
        50
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "読み取りに失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <header className="hero">
        <div className="wrap">
          <div className="nav">
            <div className="brand">
              <span className="mark">受</span> ウケトル
            </div>
            <a className="navcta" href="#presell">
              先行登録
            </a>
          </div>
          <h1>
            FAX・メール・電話の注文を、
            <br />
            AIが<span className="hl">“そのまま使えるデータ”</span>に。
          </h1>
          <p className="lede">
            注文書を貼り付ける／写真をアップするだけ。AIが取引先・納期・商品・数量を読み取って、
            Excelや基幹システムに取り込めるCSVで出力します。受発注の<strong>手入力・転記ミスをゼロ</strong>に。
          </p>
          <div className="chips">
            <span className="chip">FAX画像もそのまま読取</span>
            <span className="chip">数秒で構造化</span>
            <span className="chip">要確認を自動フラグ</span>
            <span className="chip">CSVで出力</span>
          </div>
          <div className="herocta">
            <a className="btn btn-primary" href="#tool">
              無料で試す
            </a>
            <a className="btn btn-light" href="#presell">
              導入相談・先行登録
            </a>
          </div>
        </div>
      </header>

      <section className="section" id="tool">
        <div className="wrap">
          <div className="card lift">
            <h2>注文を読み取る</h2>
            <p className="sub">
              FAX/メール/電話メモの内容を貼り付け、または注文書の写真・スキャン画像をアップロード。
            </p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={"〇〇商事 御中\n発注書 6/30\n納品希望 7/3\n・みかんジュース1L ケース ×5\n・野菜ジュース 24本入 2箱 …"}
            />
            <div className="actions">
              <button className="btn btn-primary" onClick={run} disabled={loading}>
                {loading ? "AIが読み取り中…" : "データ化する"}
              </button>
              <button className="btn btn-ghost" onClick={() => setText(SAMPLE_ORDER)} disabled={loading}>
                サンプルを入れる
              </button>
              <label className="filelabel">
                <span className="filepill">画像を選択</span>
                <input type="file" accept="image/*" onChange={onFile} />
                {image && <span className="imgname">📎 {image.name}</span>}
              </label>
            </div>
            {error && <div className="err">{error}</div>}
          </div>

          {result && <Result data={result} />}

          <div className="how">
            <div className="howc">
              <div className="n">1</div>
              <h3>貼る／撮る</h3>
              <p>FAXやメールの注文をコピペ、または注文書をスマホで撮影してアップ。</p>
            </div>
            <div className="howc">
              <div className="n">2</div>
              <h3>AIが読み取る</h3>
              <p>取引先・納期・商品・数量を構造化。曖昧な箇所は「要確認」で自動フラグ。</p>
            </div>
            <div className="howc">
              <div className="n">3</div>
              <h3>CSVで出力</h3>
              <p>Excel・基幹システムにそのまま取り込めるCSVをダウンロード。手入力ゼロ。</p>
            </div>
          </div>
        </div>
      </section>

      <BatchTool />

      <Presell />

      <div className="foot">
        ウケトル — 受発注の手入力をなくす ・ 読み取り結果は最終確認のうえご利用ください。
      </div>
    </>
  );
}

function CopyBtn({ text, label = "コピー" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      className="btn btn-ghost"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1400);
        } catch {
          /* clipboard unavailable */
        }
      }}
    >
      {done ? "コピーしました" : label}
    </button>
  );
}

function downloadCsv(order: Order) {
  const csv = orderToCsv(order);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `order_${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadAll(orders: Order[]) {
  const blob = new Blob([ordersToCsv(orders)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `orders_${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function MetaCell({ k, v }: { k: string; v: string }) {
  return (
    <div className="metac">
      <div className="k">{k}</div>
      <div className={"v" + (v ? "" : " empty")}>{v || "—"}</div>
    </div>
  );
}

function Result({ data }: { data: ExtractResult }) {
  const o = data.order;
  return (
    <div id="result" style={{ marginTop: 18 }}>
      <div className="enginebar">
        読み取りエンジン:
        <span className={"pill" + (data.engine === "mock" ? " mock" : "")}>
          {data.engine === "ai" ? "Claude AI" : "簡易抽出(モック)"}
        </span>
        {data.engine === "mock" && "（ANTHROPIC_API_KEY 未設定）"}
      </div>

      <div className="card">
        <div className="meta">
          <MetaCell k="取引先" v={o.supplier} />
          <MetaCell k="注文日" v={o.orderDate} />
          <MetaCell k="納品希望日" v={o.deliveryDate} />
          <MetaCell k="配送先" v={o.shipTo} />
        </div>

        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>商品名</th>
                <th>品番</th>
                <th>数量</th>
                <th>単位</th>
                <th>単価</th>
                <th>金額</th>
                <th>備考</th>
              </tr>
            </thead>
            <tbody>
              {o.items.map((it, i) => (
                <tr key={i}>
                  <td>{it.name}</td>
                  <td>{it.code || "—"}</td>
                  <td className={"num" + (it.quantity ? "" : " flag")}>
                    {it.quantity || "要確認"}
                  </td>
                  <td>{it.unit || "—"}</td>
                  <td className="num">{it.unitPrice || "—"}</td>
                  <td className="num">{it.amount || "—"}</td>
                  <td>{it.note || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {o.notes && (
          <p style={{ fontSize: 13.5, color: "var(--muted)", marginTop: 10 }}>備考：{o.notes}</p>
        )}

        {o.warnings.length > 0 ? (
          <div className="warn">
            <div className="wh">⚠️ 要確認 {o.warnings.length}件（AIが推測で埋めなかった箇所）</div>
            <ul>
              {o.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="ok">✅ 読み取り完了。最終確認のうえCSVをご利用ください。</div>
        )}

        <div className="resactions">
          <button className="btn btn-primary" onClick={() => downloadCsv(o)}>
            CSVをダウンロード
          </button>
          <CopyBtn text={orderToCsv(o)} label="CSVをコピー" />
        </div>
      </div>
    </div>
  );
}

function BatchTool() {
  const [text, setText] = useState("");
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ExtractResult[] | null>(null);

  function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    Promise.all(
      files.map(
        (f) =>
          new Promise<ImageData | null>((resolve) => {
            const r = new FileReader();
            r.onload = () => {
              const m = String(r.result).match(/^data:(.+?);base64,(.*)$/);
              resolve(m ? { mediaType: m[1], data: m[2], name: f.name } : null);
            };
            r.readAsDataURL(f);
          })
      )
    ).then((arr) => setImages(arr.filter(Boolean) as ImageData[]));
  }

  async function run() {
    setError(null);
    const textOrders: ExtractInput[] = text
      .split(/^\s*-{3,}\s*$/m)
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => ({ text: t }));
    const imageOrders: ExtractInput[] = images.map((im) => ({
      image: { data: im.data, mediaType: im.mediaType },
    }));
    const inputs = [...textOrders, ...imageOrders];
    if (inputs.length === 0)
      return setError("注文を「---」の行で区切って貼るか、画像を複数選択してください。");
    if (inputs.length > 20) return setError("デモでは一度に20件までです。");
    setLoading(true);
    setItems(null);
    try {
      const res = await fetch("/api/extract-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputs }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "処理に失敗しました");
      setItems(data.items as ExtractResult[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "処理に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="section" id="batch">
      <div className="wrap">
        <div className="card">
          <h2>
            複数注文を一括処理 <span className="beta">今日ぶん、まとめて</span>
          </h2>
          <p className="sub">
            注文を「---」の行で区切って貼り付け、または注文書の画像を複数選択。まとめてデータ化し、1つのCSVにまとめます。
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"〇〇商事 注文 …\n---\n△△工業 注文 …\n---\n□□フード 注文 …"}
            style={{ minHeight: 130 }}
          />
          <div className="actions">
            <button className="btn btn-primary" onClick={run} disabled={loading}>
              {loading ? "一括処理中…" : "まとめてデータ化"}
            </button>
            <label className="filelabel">
              <span className="filepill">画像を複数選択</span>
              <input type="file" accept="image/*" multiple onChange={onFiles} />
              {images.length > 0 && <span className="imgname">📎 {images.length}枚</span>}
            </label>
          </div>
          {error && <div className="err">{error}</div>}

          {items && (
            <div style={{ marginTop: 16 }}>
              <div className="enginebar">
                {items.length}件を処理
                <span className={"pill" + (items[0]?.engine === "mock" ? " mock" : "")}>
                  {items[0]?.engine === "ai" ? "Claude AI" : "簡易抽出"}
                </span>
                <span style={{ marginLeft: "auto" }}>
                  <button className="btn btn-primary" onClick={() => downloadAll(items.map((it) => it.order))}>
                    全件まとめてCSV
                  </button>
                </span>
              </div>
              <div className="batchlist">
                {items.map((it, i) => (
                  <div className="batchrow" key={i}>
                    <div>
                      <div className="bname">
                        {i + 1}. {it.order.supplier || "（取引先 要確認）"}
                      </div>
                      <div className="bmeta">
                        納期 {it.order.deliveryDate || "—"}・{it.order.items.length}明細
                        {it.order.warnings.length > 0 && (
                          <span className="bwarn"> ・要確認{it.order.warnings.length}</span>
                        )}
                      </div>
                    </div>
                    <button className="btn btn-ghost" onClick={() => downloadCsv(it.order)}>
                      CSV
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Presell() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "ok" | "err">("idle");
  const [msg, setMsg] = useState("");

  async function join() {
    setState("idle");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, segment: "order-dx" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "登録に失敗しました");
      setState("ok");
    } catch (e) {
      setState("err");
      setMsg(e instanceof Error ? e.message : "登録に失敗しました");
    }
  }

  return (
    <section className="section" id="presell">
      <div className="wrap">
        <div className="presell">
          <h2>導入相談・先行登録</h2>
          <p>
            FAX・電話注文が多い卸・製造の現場向け。正式版は基幹システム連携・複数注文の一括処理・
            取引先別の読み取りルール学習に対応予定。まずは御社の注文書1週間ぶんを、無料でデータ化します。
          </p>
          <div className="price">
            ¥9,800<small> / 月〜（先行価格・予定）</small>
          </div>
          {state === "ok" ? (
            <div className="thanks">✅ ありがとうございます！担当よりご連絡します。</div>
          ) : (
            <>
              <div className="waitform">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="メールアドレス"
                />
                <button className="btn btn-primary" onClick={join}>
                  無料でデータ化を申し込む
                </button>
              </div>
              {state === "err" && (
                <div className="thanks" style={{ background: "rgba(245,165,36,0.2)" }}>{msg}</div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
