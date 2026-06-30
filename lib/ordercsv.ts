import type { Order } from "./types";

function esc(v: string): string {
  const s = (v ?? "").toString();
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** 注文を「明細1行＝1レコード」のCSVにする（Excel/基幹に取り込みやすい形） */
export function orderToCsv(order: Order): string {
  const header = [
    "取引先",
    "注文番号",
    "注文日",
    "納品希望日",
    "配送先",
    "商品名",
    "品番",
    "数量",
    "単位",
    "単価",
    "金額",
    "備考",
  ];
  const rows = (order.items.length ? order.items : [{ name: "", code: "", quantity: "", unit: "", unitPrice: "", amount: "", note: "" }]).map(
    (it) =>
      [
        order.supplier,
        order.orderNo,
        order.orderDate,
        order.deliveryDate,
        order.shipTo,
        it.name,
        it.code,
        it.quantity,
        it.unit,
        it.unitPrice,
        it.amount,
        it.note || order.notes,
      ]
        .map(esc)
        .join(",")
  );
  // 先頭にBOMを付けてExcelの文字化けを防ぐ
  return "﻿" + [header.join(","), ...rows].join("\r\n");
}

/** 複数注文を1つのCSVに（先頭に「注文ID」列を付けて区別） */
export function ordersToCsv(orders: Order[]): string {
  const header = [
    "注文ID",
    "取引先",
    "注文番号",
    "注文日",
    "納品希望日",
    "配送先",
    "商品名",
    "品番",
    "数量",
    "単位",
    "単価",
    "金額",
    "備考",
  ];
  const rows: string[] = [];
  orders.forEach((order, idx) => {
    const items = order.items.length
      ? order.items
      : [{ name: "", code: "", quantity: "", unit: "", unitPrice: "", amount: "", note: "" }];
    for (const it of items) {
      rows.push(
        [
          String(idx + 1),
          order.supplier,
          order.orderNo,
          order.orderDate,
          order.deliveryDate,
          order.shipTo,
          it.name,
          it.code,
          it.quantity,
          it.unit,
          it.unitPrice,
          it.amount,
          it.note || order.notes,
        ]
          .map(esc)
          .join(",")
      );
    }
  });
  return "﻿" + [header.join(","), ...rows].join("\r\n");
}
