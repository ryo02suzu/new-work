// ZEIPILOT — 共有型定義

/** 1件の取引。amount: 正=入金(売上), 負=出金(支出) */
export type Txn = {
  date: string;
  description: string;
  amount: number;
};

/** AIが割り当てる勘定科目の候補（個人事業主向けの主要科目） */
export const ACCOUNTS = [
  "売上",
  "旅費交通費",
  "通信費",
  "消耗品費",
  "接待交際費",
  "会議費",
  "広告宣伝費",
  "外注費",
  "地代家賃",
  "水道光熱費",
  "新聞図書費",
  "支払手数料",
  "租税公課",
  "雑費",
  "事業主貸（プライベート）",
] as const;

export type Account = (typeof ACCOUNTS)[number];

/** 取引1件に対するAIの判定結果 */
export type Categorized = {
  index: number;
  /** income=売上, business=事業の経費, private=プライベート支出(事業主貸) */
  kind: "income" | "business" | "private";
  account: string;
  /** 所得から差し引ける経費か（売上・プライベートは false） */
  deductible: boolean;
  /** 0〜1。低いものは人間が確認すべき取引 */
  confidence: number;
  reason: string;
};

export type CategorizeResult = {
  engine: "ai" | "mock";
  results: Categorized[];
};

export type AnalyzedItem = Txn & Categorized;
