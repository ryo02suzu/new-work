import type { ListingPack } from "./types";

// 出品コピーの法務リスク（景表法・薬機法・ステマ規制）を簡易チェックする辞書ベースのスキャナ。
// 完全な判定ではなく「人間が確認すべき箇所」をハイライトするための補助。

export type Finding = {
  term: string;
  category: "景表法" | "薬機法" | "ステマ";
  severity: "high" | "mid";
  where: string;
  suggestion?: string;
};

const RULES: Array<{
  re: RegExp;
  category: Finding["category"];
  severity: Finding["severity"];
  suggestion?: string;
}> = [
  {
    re: /(No\.?\s?1|ナンバーワン|日本一|世界一|業界1位|売上1位|人気No)/i,
    category: "景表法",
    severity: "high",
    suggestion: "No.1表記は客観的な調査(主体・期間・範囲)の根拠併記が必須。根拠が無ければ削除を。",
  },
  {
    re: /(最高|最強|最安|最上級|究極|至高|世界初|日本初|業界初)/,
    category: "景表法",
    severity: "high",
    suggestion: "最上級表現は根拠が必要。「上質な」「こだわりの」等へ言い換えを。",
  },
  {
    re: /(絶対|完全に|100％|100%|必ず|誰でも|確実に)/,
    category: "景表法",
    severity: "high",
    suggestion: "断定・保証表現は優良誤認のリスク。「〜をめざす」「〜しやすい」等へ。",
  },
  {
    re: /(通常価格|定価|半額|今だけ|期間限定)/,
    category: "景表法",
    severity: "mid",
    suggestion: "二重価格・割引は過去の販売実績(原則8週間以上)等の根拠と期間明示が必要。",
  },
  {
    re: /(効く|効果がある|治る|治療|改善|予防|症状|アンチエイジング|シミが消え|デトックス|免疫力|血液をサラサラ|痩せる|ダイエット効果)/,
    category: "薬機法",
    severity: "high",
    suggestion: "化粧品/健康食品で医薬品的な効能効果はNG。化粧品は『56の効能効果』の範囲・使用感の表現に。",
  },
  {
    re: /(副作用がない|無添加だから安全|安全性は保証)/,
    category: "薬機法",
    severity: "mid",
    suggestion: "安全性の保証表現は避け、成分・製法など事実で訴求を。",
  },
  {
    re: /(お客様の声|体験談|使ってみた感想|愛用者の声)/,
    category: "ステマ",
    severity: "mid",
    suggestion: "AIが創作した『お客様の声』はステマ規制・優良誤認に該当。捏造せず事業者表示として扱う。",
  },
];

function scanText(where: string, text: string): Finding[] {
  const out: Finding[] = [];
  for (const r of RULES) {
    const m = text.match(r.re);
    if (m) {
      out.push({
        term: m[0],
        category: r.category,
        severity: r.severity,
        where,
        suggestion: r.suggestion,
      });
    }
  }
  return out;
}

export function scanPack(pack: ListingPack): Finding[] {
  const all: Finding[] = [];
  pack.catchcopy.forEach((c) => all.push(...scanText("キャッチコピー", c)));
  pack.descriptions.forEach((d) => all.push(...scanText(`商品説明(${d.label})`, d.text)));
  pack.bullets.forEach((b) => all.push(...scanText("訴求ポイント", b)));
  pack.social.forEach((s) => all.push(...scanText(`SNS(${s.platform})`, s.text)));
  pack.ads.forEach((a) => all.push(...scanText("広告", `${a.headline} ${a.body}`)));
  all.push(...scanText("SEOタイトル", pack.seo.title));

  const seen = new Set<string>();
  return all.filter((f) => {
    const k = `${f.term}|${f.where}|${f.category}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
