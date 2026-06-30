import type { ListingPack, ProductInput } from "./types";

const KEY = "uriko_history_v1";
const MAX = 50;

export type HistoryEntry = {
  id: string;
  ts: number;
  productName: string;
  engine: "ai" | "mock";
  input: ProductInput;
  pack: ListingPack;
};

export function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function save(entries: HistoryEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(entries.slice(0, MAX)));
  } catch {
    /* quota / unavailable */
  }
}

export function addEntry(
  input: ProductInput,
  pack: ListingPack,
  engine: "ai" | "mock"
): HistoryEntry[] {
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : String(Date.now()) + Math.round(performance.now());
  const entry: HistoryEntry = {
    id,
    ts: Date.now(),
    productName: input.name || "商品",
    engine,
    input,
    pack,
  };
  const next = [entry, ...loadHistory()].slice(0, MAX);
  save(next);
  return next;
}

export function removeEntry(id: string): HistoryEntry[] {
  const next = loadHistory().filter((e) => e.id !== id);
  save(next);
  return next;
}
