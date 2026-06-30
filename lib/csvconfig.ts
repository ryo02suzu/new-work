import type { Order, OrderItem } from "./types";

export type ColKey =
  | "supplier"
  | "orderNo"
  | "orderDate"
  | "deliveryDate"
  | "shipTo"
  | "name"
  | "code"
  | "quantity"
  | "unit"
  | "unitPrice"
  | "amount"
  | "note";

export const ALL_COLUMNS: { key: ColKey; label: string }[] = [
  { key: "supplier", label: "取引先" },
  { key: "orderNo", label: "注文番号" },
  { key: "orderDate", label: "注文日" },
  { key: "deliveryDate", label: "納品希望日" },
  { key: "shipTo", label: "配送先" },
  { key: "name", label: "商品名" },
  { key: "code", label: "品番" },
  { key: "quantity", label: "数量" },
  { key: "unit", label: "単位" },
  { key: "unitPrice", label: "単価" },
  { key: "amount", label: "金額" },
  { key: "note", label: "備考" },
];

export type Column = { key: ColKey; header: string; enabled: boolean };
export type CsvConfig = { withOrderId: boolean; columns: Column[] };

export function defaultConfig(): CsvConfig {
  return {
    withOrderId: false,
    columns: ALL_COLUMNS.map((c) => ({ key: c.key, header: c.label, enabled: true })),
  };
}

function emptyItem(): OrderItem {
  return { name: "", code: "", quantity: "", unit: "", unitPrice: "", amount: "", note: "" };
}

function fieldValue(order: Order, it: OrderItem, key: ColKey): string {
  switch (key) {
    case "supplier":
      return order.supplier;
    case "orderNo":
      return order.orderNo;
    case "orderDate":
      return order.orderDate;
    case "deliveryDate":
      return order.deliveryDate;
    case "shipTo":
      return order.shipTo;
    case "name":
      return it.name;
    case "code":
      return it.code;
    case "quantity":
      return it.quantity;
    case "unit":
      return it.unit;
    case "unitPrice":
      return it.unitPrice;
    case "amount":
      return it.amount;
    case "note":
      return it.note || order.notes;
  }
}

function esc(v: string): string {
  const s = (v ?? "").toString();
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** 設定（列の有無・名前・順序）に従ってCSVを組み立てる。先頭BOM付き。 */
export function buildCsv(orders: Order[], config: CsvConfig): string {
  const cols = config.columns.filter((c) => c.enabled);
  const header = [...(config.withOrderId ? ["注文ID"] : []), ...cols.map((c) => c.header)];
  const rows: string[] = [];
  orders.forEach((order, idx) => {
    const items = order.items.length ? order.items : [emptyItem()];
    for (const it of items) {
      const row = [
        ...(config.withOrderId ? [String(idx + 1)] : []),
        ...cols.map((c) => fieldValue(order, it, c.key)),
      ];
      rows.push(row.map(esc).join(","));
    }
  });
  return "﻿" + [header.join(","), ...rows].join("\r\n");
}

const KEY = "uketoru_csvconfig_v1";

export function loadConfig(): CsvConfig {
  if (typeof window === "undefined") return defaultConfig();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultConfig();
    const c = JSON.parse(raw) as CsvConfig;
    if (c?.columns?.length) {
      // 既知キーのみ採用（壊れ・将来差分に強く）
      const valid = c.columns.filter((col) => ALL_COLUMNS.some((a) => a.key === col.key));
      if (valid.length) return { withOrderId: !!c.withOrderId, columns: valid };
    }
  } catch {
    /* ignore */
  }
  return defaultConfig();
}

export function saveConfig(c: CsvConfig): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(c));
  } catch {
    /* ignore */
  }
}

export function moveColumn(config: CsvConfig, index: number, dir: -1 | 1): CsvConfig {
  const cols = [...config.columns];
  const j = index + dir;
  if (j < 0 || j >= cols.length) return config;
  [cols[index], cols[j]] = [cols[j], cols[index]];
  return { ...config, columns: cols };
}
