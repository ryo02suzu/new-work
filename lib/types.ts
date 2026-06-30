// ウケトル — 共有型定義

/** 注文1明細 */
export type OrderItem = {
  /** 商品名 */
  name: string;
  /** 品番・型番（あれば） */
  code: string;
  /** 数量（"10"や"5ケース"など単位込みもOK） */
  quantity: string;
  /** 単位（個/ケース/箱 など。明細側に含まれていれば空でも可） */
  unit: string;
  /** 単価（読み取れれば。無ければ空） */
  unitPrice: string;
  /** 金額（読み取れれば。無ければ空） */
  amount: string;
  /** 明細単位の備考 */
  note: string;
};

/** 構造化された1件の注文 */
export type Order = {
  /** 発注元（取引先名） */
  supplier: string;
  /** 注文番号（あれば） */
  orderNo: string;
  /** 注文日 */
  orderDate: string;
  /** 納品希望日 */
  deliveryDate: string;
  /** 配送先・宛先（あれば） */
  shipTo: string;
  items: OrderItem[];
  /** 全体の備考 */
  notes: string;
  /** 要確認（読み取れない・欠落・曖昧な箇所）。推測で埋めず、ここに挙げる */
  warnings: string[];
};

export type ExtractInput = {
  text?: string;
  image?: { data: string; mediaType: string };
};

export type ExtractResult = {
  engine: "ai" | "mock";
  order: Order;
};
