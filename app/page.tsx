"use client";

import { useState } from "react";
import { SAMPLE_PRODUCT, SAMPLE_BULK } from "@/lib/sample";
import { TONES, type GenerateResult, type ListingPack } from "@/lib/types";
import { MALLS, formatForMall, packToText, type Mall } from "@/lib/malls";
import { parseBulk } from "@/lib/csvbulk";
import type { BulkItem } from "@/lib/generate";

export default function Home() {
  const [name, setName] = useState("");
  const [features, setFeatures] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState<string>("標準");
  const [price, setPrice] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResult | null>(null);

  function loadSample() {
    setName(SAMPLE_PRODUCT.name);
    setFeatures(SAMPLE_PRODUCT.features);
    setAudience(SAMPLE_PRODUCT.audience || "");
    setTone((SAMPLE_PRODUCT.tone as string) || "標準");
    setPrice(SAMPLE_PRODUCT.price || "");
  }

  async function run() {
    setError(null);
    if (!name.trim()) return setError("商品名を入力してください。");
    if (!features.trim()) return setError("特徴・メモを入力してください（箇条書きでOK）。");
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, features, audience, tone, price }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "生成に失敗しました");
      setResult(data as GenerateResult);
      setTimeout(
        () => document.getElementById("result")?.scrollIntoView({ behavior: "smooth" }),
        50
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成に失敗しました");
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
              <span className="mark">🛍️</span> URIKO
            </div>
            <a className="navcta" href="#presell">
              先行登録
            </a>
          </div>
          <h1>
            同じ商品が、言葉を変えるだけで
            <br />
            <span className="hl">売れていく。</span>
          </h1>
          <p className="lede">
            商品名を入れるだけで、商品説明・キャッチ・SEO・SNS・広告コピーまで、ネットショップに必要な
            “売れる日本語” を一括生成。プロに頼んだような買いたくなる文章が数十秒で揃い、あなたは
            売ることだけに集中できます。
          </p>
          <div className="chips">
            <span className="chip">売れる言葉でCVR改善</span>
            <span className="chip">書く時間がゼロに</span>
            <span className="chip">全チャネル一括対応</span>
            <span className="chip">CSV一括 / モール別出力</span>
          </div>
          <div className="herocta">
            <a className="btn btn-primary" href="#tool">
              無料で“売れるコピー”を試す
            </a>
            <a className="btn btn-light" href="#presell">
              先行メンバーになる
            </a>
          </div>
        </div>
      </header>

      <section className="section" id="tool">
        <div className="wrap">
          <div className="card lift">
            <h2>商品情報を入力</h2>
            <p className="sub">特徴は箇条書き・メモ書きでOK。多いほど精度が上がります。</p>

            <div className="field">
              <label>商品名 *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例）信楽焼 手づくりマグカップ"
              />
            </div>
            <div className="field">
              <label>特徴・メモ *</label>
              <textarea
                value={features}
                onChange={(e) => setFeatures(e.target.value)}
                placeholder={"職人の手づくり\n容量320ml・電子レンジ/食洗機対応\nくすみカラー全4色\nギフトにも人気"}
              />
            </div>
            <div className="grid2">
              <div className="field">
                <label>ターゲット顧客（任意）</label>
                <input
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="例）丁寧な暮らしが好きな30〜40代"
                />
              </div>
              <div className="field">
                <label>価格（任意）</label>
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="例）3,800円"
                />
              </div>
            </div>
            <div className="field">
              <label>トーン</label>
              <select value={tone} onChange={(e) => setTone(e.target.value)}>
                {TONES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="actions">
              <button className="btn btn-primary" onClick={run} disabled={loading}>
                {loading ? "AIが生成中…" : "出品パックを生成する"}
              </button>
              <button className="btn btn-ghost" onClick={loadSample} disabled={loading}>
                サンプルを入れる
              </button>
            </div>
            {error && <div className="err">{error}</div>}
            <p className="legal">
              ⚠️ 生成結果は下書きです。景品表示法・薬機法・各モール規約に沿って、最上級表現（No.1
              /最強/絶対 等）や効能・効果の表現などをご確認のうえご利用ください。
            </p>
          </div>

          {result && <Result data={result} productName={name || "商品"} />}
        </div>
      </section>

      <BulkTool />

      <Presell />

      <div className="foot">URIKO — AIで“売れる言葉”を、毎週まるごと。</div>
    </>
  );
}

function CopyBtn({ text, label = "コピー" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      className={"copybtn" + (done ? " done" : "")}
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
      {done ? "コピー済" : label}
    </button>
  );
}

function MallExport({ pack, productName }: { pack: ListingPack; productName: string }) {
  const [mall, setMall] = useState<Mall>(MALLS[0]);
  const text = formatForMall(mall, pack, productName);
  return (
    <div className="card" style={{ marginTop: 18 }}>
      <div className="block" style={{ marginTop: 0 }}>
        <h3>
          <span className="ico">🏬</span> モール別に出力（そのまま貼れる）
        </h3>
        <div className="malltabs">
          {MALLS.map((m) => (
            <button
              key={m}
              className={"mallbtn" + (m === mall ? " active" : "")}
              onClick={() => setMall(m)}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="copyrow" style={{ marginTop: 12 }}>
          <pre className="malltext">{text}</pre>
          <CopyBtn text={text} />
        </div>
      </div>
    </div>
  );
}

function Result({ data, productName }: { data: GenerateResult; productName: string }) {
  const p: ListingPack = data.pack;
  return (
    <div id="result">
      <div className="enginebar">
        生成エンジン:
        <span className={"pill" + (data.engine === "mock" ? " mock" : "")}>
          {data.engine === "ai" ? "Claude AI" : "テンプレート(モック)"}
        </span>
        {data.engine === "mock" && "（ANTHROPIC_API_KEY 未設定のため簡易生成）"}
        <span style={{ marginLeft: "auto" }}>
          <CopyBtn text={packToText(p, productName)} label="全部コピー" />
        </span>
      </div>

      <div className="card">
        <div className="block">
          <h3>
            <span className="ico">✨</span> キャッチコピー
          </h3>
          <div className="copylist">
            {p.catchcopy.map((c, i) => (
              <div className="copyrow" key={i}>
                <span className="txt">{c}</span>
                <CopyBtn text={c} />
              </div>
            ))}
          </div>
        </div>

        <div className="block">
          <h3>
            <span className="ico">📝</span> 商品説明文
          </h3>
          <div className="copylist">
            {p.descriptions.map((d, i) => (
              <div className="copyrow" key={i}>
                <div>
                  <span className="label">{d.label}</span>
                  <div className="txt">{d.text}</div>
                </div>
                <CopyBtn text={d.text} />
              </div>
            ))}
          </div>
        </div>

        <div className="block">
          <h3>
            <span className="ico">✅</span> 訴求ポイント
          </h3>
          <div className="copyrow">
            <ul className="txt" style={{ margin: 0, paddingLeft: 18 }}>
              {p.bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
            <CopyBtn text={p.bullets.map((b) => `・${b}`).join("\n")} />
          </div>
        </div>

        <div className="block">
          <h3>
            <span className="ico">🔍</span> SEOタイトル・キーワード
          </h3>
          <div className="copyrow">
            <div className="txt">{p.seo.title}</div>
            <CopyBtn text={p.seo.title} />
          </div>
          <div className="kw">
            {p.seo.keywords.map((k, i) => (
              <span className="kwtag" key={i}>
                {k}
              </span>
            ))}
          </div>
        </div>

        <div className="block">
          <h3>
            <span className="ico">📣</span> SNS投稿
          </h3>
          <div className="copylist">
            {p.social.map((s, i) => (
              <div className="copyrow" key={i}>
                <div>
                  <span className="label">{s.platform}</span>
                  <div className="txt">{s.text}</div>
                </div>
                <CopyBtn text={s.text} />
              </div>
            ))}
          </div>
        </div>

        <div className="block">
          <h3>
            <span className="ico">🎯</span> 検索広告コピー
          </h3>
          <div className="copylist">
            {p.ads.map((a, i) => (
              <div className="copyrow" key={i}>
                <div>
                  <div className="txt" style={{ fontWeight: 700 }}>
                    {a.headline}
                  </div>
                  <div className="txt">{a.body}</div>
                </div>
                <CopyBtn text={`${a.headline}\n${a.body}`} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <MallExport pack={p} productName={productName} />
    </div>
  );
}

function BulkTool() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<BulkItem[] | null>(null);

  async function run() {
    setError(null);
    const products = parseBulk(text);
    if (products.length === 0)
      return setError("「商品名 | 特徴」の形式で、1行ずつ入力してください。");
    if (products.length > 20) return setError("デモでは一度に20件までです。");
    setLoading(true);
    setItems(null);
    try {
      const res = await fetch("/api/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "生成に失敗しました");
      setItems(data.items as BulkItem[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="section" id="bulk">
      <div className="wrap">
        <div className="card">
          <h2>
            CSV一括生成 <span className="beta">Starter以上</span>
          </h2>
          <p className="sub">
            1行＝1商品：「商品名 | 特徴（；で複数） | ターゲット | トーン | 価格」。複数商品をまとめて出品パック化します。
          </p>
          <div className="field">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={"信楽焼マグカップ | 手づくり；320ml；食洗機対応 | 30〜40代 | 高級・上質 | 3,800円\nベビースタイ | オーガニックコットン；名入れ可 | 出産祝い | カジュアル・親しみ | 1,980円"}
              style={{ minHeight: 120 }}
            />
          </div>
          <div className="actions">
            <button className="btn btn-primary" onClick={run} disabled={loading}>
              {loading ? "一括生成中…" : "まとめて生成する"}
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => setText(SAMPLE_BULK)}
              disabled={loading}
            >
              サンプルを入れる
            </button>
          </div>
          {error && <div className="err">{error}</div>}

          {items && (
            <div style={{ marginTop: 16 }}>
              <div className="enginebar">
                {items.length}商品を生成
                <span className={"pill" + (items[0]?.engine === "mock" ? " mock" : "")}>
                  {items[0]?.engine === "ai" ? "Claude AI" : "テンプレート"}
                </span>
              </div>
              <div className="bulklist">
                {items.map((it, i) => (
                  <BulkCard key={i} item={it} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function BulkCard({ item }: { item: BulkItem }) {
  const [open, setOpen] = useState(false);
  const p = item.pack;
  const name = item.product.name;
  const std =
    p.descriptions.find((d) => d.label.includes("標準"))?.text ||
    p.descriptions[0]?.text ||
    "";
  return (
    <div className="bulkcard">
      <div className="bulkhead">
        <div className="bulkname">{name}</div>
        <div className="bulkactions">
          <CopyBtn text={packToText(p, name)} label="全部コピー" />
          <button className="copybtn" onClick={() => setOpen((v) => !v)}>
            {open ? "閉じる" : "詳細"}
          </button>
        </div>
      </div>
      <div className="bulkcatch">{p.catchcopy[0]}</div>
      <div className="bulkdesc">{std}</div>
      {open && <MallExport pack={p} productName={name} />}
    </div>
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
        body: JSON.stringify({ email, segment: "ec-seller" }),
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
          <h2>先行メンバー募集中</h2>
          <p>
            いま登録すると、リリース時に<strong>先行メンバー価格</strong>でご案内します。
            正式版は一括生成・レビュー分析・ブランドトーン記憶に対応予定。
          </p>
          <div className="tiers">
            <div className="tier">
              <div className="tname">Free</div>
              <div className="tprice">
                ¥0<small> / 月</small>
              </div>
              <ul>
                <li>生成 月20回</li>
                <li>商品説明・SNS</li>
                <li>履歴7日</li>
              </ul>
            </div>
            <div className="tier pop">
              <div className="tbadge">おすすめ</div>
              <div className="tname">Starter</div>
              <div className="tprice">
                ¥4,980<small> / 月</small>
              </div>
              <ul>
                <li>生成 月300回・全チャネル</li>
                <li>CSV一括（50商品）</li>
                <li>モール別出力・履歴保存</li>
              </ul>
            </div>
            <div className="tier">
              <div className="tname">Pro</div>
              <div className="tprice">
                ¥14,800<small> / 月</small>
              </div>
              <ul>
                <li>生成 月2,000回</li>
                <li>CSV一括（500商品）</li>
                <li>ブランドボイス・チーム3席</li>
              </ul>
            </div>
          </div>
          <p style={{ fontSize: 12.5, color: "#cfc9ee", margin: "4px 0 0" }}>
            年払いは2ヶ月無料。先行登録の方にはリリース時に先行価格でご案内します。
          </p>
          {state === "ok" ? (
            <div className="thanks">
              ✅ 登録ありがとうございます！リリース時にご連絡します。
            </div>
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
                  先行登録する
                </button>
              </div>
              {state === "err" && (
                <div className="thanks" style={{ background: "rgba(255,90,95,0.18)" }}>
                  {msg}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
