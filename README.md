# ウケトル（UKETORU）

> FAX・メール・電話の注文を、AIが **“そのまま使えるデータ”** に変換する。
> 注文書を貼り付ける／写真をアップするだけで、取引先・納期・商品・数量を読み取り、
> Excel・基幹システムに取り込めるCSVで出力。**受発注の手入力・転記ミスをゼロに。**

買い手は **FAX・電話注文が多い、IT担当者のいない卸・製造の小さな会社**。毎日発生する「注文を見ながらExcelに手打ち」を消すための、縦特化の受発注AIツール。

---

## なぜこれなのか（一次データの結論）

深掘りリサーチ（反証検証済み）が指した勝ち筋に張っている：

- **買い手はもう生成AIに金を払っている**：SMEのAI前向き層39%、導入済みの82.6%が生成AI。需要は製造でなく**バックオフィス(68.3%)・営業(60.3%)**に集中。([中小機構 n=1万](https://www.smrj.go.jp/research_case/questionnaire/fbrion0000002pjw-att/202603_AI_point.pdf))
- **痛点が紙のまま放置**：受発注の**24.6%が電話・FAX**、顧客管理の約44%が紙＋Excel。([東京商工会議所 n=1,218](https://www.tokyo-cci.or.jp/file.jsp?id=1205203))
- **ソロの手売りが届く相手が定量化**：**10〜29名の48.2%がIT担当不在**。([kubell n=1,093](https://www.kubell.com/news/2025/12/research.html))
- **罠**：「AIを速く作れる」は差別化にならない（新規アプリの月1万ドル到達は4.6%）。安いAIは即解約（月$50未満はGRR23%）。→ **高単価×業務に深く埋め込む**。([RevenueCat](https://www.revenuecat.com/state-of-subscription-apps/) / [ChartMogul](https://chartmogul.com/reports/saas-retention-the-ai-churn-wave/))

→ だから **「特定業種の繰り返し業務（＝受発注）を1つだけ深く自動化する縦特化AI」** に絞る。ChatGPTでは解けず、大手基幹は重く高い隙間。

---

## いま動くもの（MVP）

- **注文の読み取り**：FAX/メール/電話メモのテキスト、または**注文書の画像（FAX・スキャン・写真）**をAI（`claude-opus-4-8`、画像対応）が読み取り、構造化。
- **構造化データ**：取引先・注文日・納品希望日・配送先・商品明細（商品名/品番/数量/単位/単価/金額/備考）。
- **要確認の自動フラグ**：数量未定・単位不明・判読不可などを **推測で埋めず** `要確認` として提示（＝誤発注を防ぐ信頼の核）。
- **CSV出力**：Excel・基幹にそのまま取り込めるCSV（BOM付き）をダウンロード／コピー。
- **キー無しでも動く**：`ANTHROPIC_API_KEY` 未設定時は簡易抽出にフォールバック。
- **先行登録**：`#presell` で「注文書1週間ぶんを無料でデータ化」＝コンシェルジュMVPの入口。

`サンプルを入れる → データ化する` で、雑な手書きFAX風の注文が構造化＋要確認フラグされます。

---

## セットアップ

```bash
npm install
cp .env.example .env.local   # ANTHROPIC_API_KEY を設定（任意）
npm run dev                  # http://localhost:3000
```

本番ビルド: `npm run build && npm run start`

| 変数 | 必須 | 説明 |
|---|---|---|
| `ANTHROPIC_API_KEY` | 任意 | 注文読み取りに使用。未設定なら簡易抽出にフォールバック。 |
| `UKETORU_MODEL` | 任意 | 既定 `claude-opus-4-8`（画像・手書きに強い）。 |

---

## 技術構成

- **Next.js 16（App Router）+ React 19 + TypeScript**
- **Anthropic SDK** — テキスト＋**画像（Vision）**入力、構造化出力（JSON Schema）で注文を抽出
- `app/api/extract` … 注文（テキスト/画像）→ 構造化データ
- `app/api/waitlist` … 先行登録（本番は Supabase 等に保存）
- Vercel にそのままデプロイ可能

```
app/
  page.tsx              # LP + 読み取りツール + 先行登録
  api/extract/route.ts  # 注文→構造化（テキスト/画像）
  api/waitlist/route.ts # 先行登録
lib/
  extract.ts            # Claude読み取り(Vision対応) + 簡易フォールバック
  ordercsv.ts           # 注文→CSV(BOM付き)
  types.ts              # 注文の型
  sample.ts             # デモ用サンプル注文
```

---

## 売り方は [ROADMAP.md](./ROADMAP.md) に

最速の現金化は**「御社の注文書1週間ぶんを無料でデータ化（コンシェルジュMVP）→数字の出た事例→同業へ横展開」**。価格・GTM・検証基準・週次アクションは ROADMAP.md にまとめてある。

> 注: 読み取り結果は下書きです。最終的な発注内容は必ず確認のうえご利用ください。
