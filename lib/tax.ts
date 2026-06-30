// ZEIPILOT — 税金の概算エンジン（個人事業主・青色申告を想定）
//
// ⚠️ これはあくまで「概算・目安」です。実際の申告は税理士・税務署にご確認ください。
// 細かい所得控除（扶養・配偶者・医療費・小規模企業共済等）や消費税は未対応です。

export type TaxInput = {
  /** 売上合計 */
  revenue: number;
  /** 経費合計（事業の控除可能な経費） */
  expenses: number;
  /** 青色申告特別控除（既定65万円） */
  blueDeduction?: number;
  /** 基礎控除（所得税、既定48万円） */
  basicDeduction?: number;
  /** 社会保険料控除（国民年金・国民健康保険などの概算、既定0） */
  socialInsurance?: number;
};

export type TaxResult = {
  revenue: number;
  expenses: number;
  /** 利益 = 売上 - 経費 */
  profit: number;
  blueDeduction: number;
  basicDeduction: number;
  socialInsurance: number;
  /** 青色控除後の事業所得 */
  businessIncome: number;
  /** 所得税の課税所得 */
  taxableIncome: number;
  incomeTax: number;
  reconstructionTax: number;
  residentTax: number;
  businessTax: number;
  totalTax: number;
  /** 税引き後の手取り = 利益 - 税金合計 - 社会保険料 */
  takeHome: number;
  /** 実効税率（対利益） */
  effectiveRate: number;
};

/** 所得税の超過累進税率（令和の速算表） */
function incomeTaxFromTaxable(taxable: number): number {
  const brackets: Array<[number, number, number]> = [
    [1_950_000, 0.05, 0],
    [3_300_000, 0.1, 97_500],
    [6_950_000, 0.2, 427_500],
    [9_000_000, 0.23, 636_000],
    [18_000_000, 0.33, 1_536_000],
    [40_000_000, 0.4, 2_796_000],
    [Infinity, 0.45, 4_796_000],
  ];
  for (const [cap, rate, deduction] of brackets) {
    if (taxable <= cap) return Math.max(0, Math.floor(taxable * rate - deduction));
  }
  return 0;
}

export function estimateTax(input: TaxInput): TaxResult {
  const revenue = Math.max(0, Math.round(input.revenue));
  const expenses = Math.max(0, Math.round(input.expenses));
  const blueDeduction = input.blueDeduction ?? 650_000;
  const basicDeduction = input.basicDeduction ?? 480_000;
  const socialInsurance = Math.max(0, Math.round(input.socialInsurance ?? 0));

  const profit = revenue - expenses;
  const businessIncome = Math.max(0, profit - blueDeduction);

  // 所得税
  const taxableIncome =
    Math.floor(Math.max(0, businessIncome - basicDeduction - socialInsurance) / 1000) * 1000;
  const incomeTax = incomeTaxFromTaxable(taxableIncome);
  const reconstructionTax = Math.floor(incomeTax * 0.021);

  // 住民税（基礎控除43万円・税率10%・均等割5,000円の概算）
  const residentTaxable = Math.max(0, businessIncome - 430_000 - socialInsurance);
  const residentTax =
    residentTaxable > 0 ? Math.floor(residentTaxable * 0.1) + 5_000 : 0;

  // 個人事業税（事業主控除290万円・税率5%の概算。業種により非課税の場合あり）
  const businessTax = Math.max(0, Math.floor((profit - 2_900_000) * 0.05));

  const totalTax = incomeTax + reconstructionTax + residentTax + businessTax;
  const takeHome = profit - totalTax - socialInsurance;
  const effectiveRate = profit > 0 ? totalTax / profit : 0;

  return {
    revenue,
    expenses,
    profit,
    blueDeduction,
    basicDeduction,
    socialInsurance,
    businessIncome,
    taxableIncome,
    incomeTax,
    reconstructionTax,
    residentTax,
    businessTax,
    totalTax,
    takeHome,
    effectiveRate,
  };
}
