"use client";

import { useState } from "react";
import { parseCsv } from "@/lib/csv";
import { SAMPLE_CSV } from "@/lib/sample";
import type { AnalyzedItem } from "@/lib/types";
import type { TaxResult } from "@/lib/tax";

type ApiResult = {
  engine: "ai" | "mock";
  items: AnalyzedItem[];
  totals: { revenue: number; expenses: number; privateSpend: number; count: number };
  tax: TaxResult;
};

const yen = (n: number) => "¥" + Math.round(n).toLocaleString("ja-JP");

export default function Home() {
  const [text, setText] = useState("");
  const [social, setSocial] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResult | null>(null);

  async function analyze() {
    setError(null);
    const transactions = parseCsv(text);
    if (transactions.length === 0) {
      setError("取引データを読み取れませんでした。「日付,内容,金額」の形式で入力してください。");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactions, socialInsurance: social }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "分析に失敗しました");
      setResult(data as ApiResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "分析に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <header className="hero">
        <div className="wrap">
          <div className="brand">
            <span className="dot" />
            ZEIPILOT
          </div>
          <h1>
            確定申告を、<span className="accent">自動操縦</span>に。
          </h1>
          <p className="lede">
            フリーランス・個人事業主のためのAI経理エージェント。取引データを入れるだけで、AIが
            「事業の経費か / プライベートか」を判定して自動仕訳し、いまの手取りと払う税金の概算を即計算します。
          </p>
          <div className="chips">
            <span className="chip">AIが勘定科目まで自動判定</span>
            <span className="chip">手取り・税金が一目でわかる</span>
            <span className="chip">確定申告の下準備をゼロ手間に</span>
          </div>
        </div>
      </header>

      <section className="section">
        <div className="wrap">
          <div className="card lift">
            <h2>取引データを貼り付け</h2>
            <span className="label">形式: 日付,内容,金額（金額は 入金=正 / 出金=負）</span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={"2026-06-05,株式会社アクメ 制作費 入金,440000\n2026-06-09,Amazon Web Services 利用料,-8800"}
            />
            <div className="row">
              <button className="btn btn-primary" onClick={analyze} disabled={loading}>
                {loading ? "AIが仕訳中…" : "AIで分析する"}
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => setText(SAMPLE_CSV)}
                disabled={loading}
              >
                サンプルデータを入れる
              </button>
              <label className="si">
                社会保険料(概算/年)
                <input
                  type="number"
                  value={social}
                  min={0}
                  step={10000}
                  onChange={(e) => setSocial(Number(e.target.value) || 0)}
                />
              </label>
            </div>
            {error && <div className="err">{error}</div>}
          </div>

          {result && <Result data={result} />}
        </div>
      </section>

      <div className="foot">
        ZEIPILOT — AI bookkeeping for freelancers ・ 数字はすべて概算です。
      </div>
    </>
  );
}

function Result({ data }: { data: ApiResult }) {
  const { tax, totals, items, engine } = data;
  const lowConf = items.filter((it) => it.confidence < 0.5).length;

  return (
    <div>
      <div className="enginebar">
        仕訳エンジン:
        <span className={"pill" + (engine === "mock" ? " mock" : "")}>
          {engine === "ai" ? "Claude AI" : "ルールベース(モック)"}
        </span>
        {engine === "mock" && "（ANTHROPIC_API_KEY 未設定のため簡易判定）"}
      </div>

      <div className="grid">
        <div className="stat">
          <div className="k">売上</div>
          <div className="v pos">{yen(totals.revenue)}</div>
        </div>
        <div className="stat">
          <div className="k">経費（控除可）</div>
          <div className="v neg">{yen(totals.expenses)}</div>
        </div>
        <div className="stat">
          <div className="k">利益</div>
          <div className="v">{yen(tax.profit)}</div>
        </div>
        <div className="stat hl">
          <div className="k">税引後の手取り（概算）</div>
          <div className="v">{yen(tax.takeHome)}</div>
        </div>
      </div>

      <h2 className="sec">税金の内訳（概算 / 実効税率 {(tax.effectiveRate * 100).toFixed(1)}%）</h2>
      <div className="card">
        <div className="breakdown">
          <div className="lineitem">
            <span className="muted">所得税</span>
            <span>{yen(tax.incomeTax)}</span>
          </div>
          <div className="lineitem">
            <span className="muted">復興特別所得税</span>
            <span>{yen(tax.reconstructionTax)}</span>
          </div>
          <div className="lineitem">
            <span className="muted">住民税</span>
            <span>{yen(tax.residentTax)}</span>
          </div>
          <div className="lineitem">
            <span className="muted">個人事業税</span>
            <span>{yen(tax.businessTax)}</span>
          </div>
          <div className="lineitem">
            <span className="muted">青色申告特別控除</span>
            <span>− {yen(tax.blueDeduction)}</span>
          </div>
          <div className="lineitem">
            <span className="muted">課税所得（所得税）</span>
            <span>{yen(tax.taxableIncome)}</span>
          </div>
          <div className="lineitem total">
            <span>税金合計</span>
            <span>{yen(tax.totalTax)}</span>
          </div>
          <div className="lineitem total">
            <span>納税後に手元に残る額</span>
            <span>{yen(tax.takeHome)}</span>
          </div>
        </div>
      </div>

      <h2 className="sec">
        AIの自動仕訳（{totals.count}件{lowConf > 0 && ` ・ 要確認 ${lowConf}件`}）
      </h2>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>日付</th>
              <th>内容</th>
              <th>金額</th>
              <th>判定</th>
              <th>勘定科目</th>
              <th>確信度</th>
              <th>理由</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i} className={it.kind === "private" ? "is-private" : ""}>
                <td>{it.date}</td>
                <td>{it.description}</td>
                <td className="num">{yen(it.amount)}</td>
                <td>
                  <span className={"badge " + it.kind}>
                    {it.kind === "income" ? "売上" : it.kind === "business" ? "経費" : "プライベート"}
                  </span>
                </td>
                <td>{it.account}</td>
                <td className={"num conf" + (it.confidence < 0.5 ? " low" : "")}>
                  {Math.round(it.confidence * 100)}%
                </td>
                <td className="reason">{it.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="notice">
        ⚠️ 表示される税額・手取りはすべて<strong>概算・目安</strong>です。実際の申告内容は、各種所得控除や消費税の扱いによって変わります。最終的な申告は税理士・税務署にご確認ください。
      </div>
    </div>
  );
}
