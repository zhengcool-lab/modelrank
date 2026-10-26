// 成本计算器纯函数 — 与 v7.1 HTML 原型 / 前端 packages/shared estimateMonthlyCost 严格对齐。
//
// 公式（v7.1 HTML 行 2464-2477、packages/shared/src/index.ts 行 327-337）：
//   totalTokensM = monthlyTokens / 1_000_000
//   inputCost    = totalTokensM * alpha * priceInput * (1 - cacheRatio)
//   outputCost   = totalTokensM * (1 - alpha) * priceOutput
//   monthlyCost  = inputCost + outputCost
//
// 语义：
//   alpha      = 输入 token 占比（0.05–0.5，默认 0.25）；非「cache 命中率溢价系数」。
//   cacheRatio = 缓存命中率（0 / 0.3 / 0.6 / 0.8），原型把它直接折减到输入价上
//                （mockup 简化：缓存命中价按 0 计，PRD §成本计算器规格中的
//                「缓存量 × 缓存价」项被原型省略）。
//   priceInput / priceOutput 单位：元 / 1M tokens。

export interface CostFormulaInput {
  /** 月总 tokens（输入+输出合计），原始 token 数 */
  monthlyTokens: number;
  /** 输入占比 α，默认 0.25 */
  alpha?: number;
  /** 缓存命中率 0..1，默认 0 */
  cacheRatio?: number;
  /** 输入单价 元/1M tokens */
  priceInput: number;
  /** 输出单价 元/1M tokens */
  priceOutput: number;
}

export const DEFAULT_ALPHA = 0.25;
export const DEFAULT_CACHE_RATIO = 0;

export function calculateMonthlyCost({
  monthlyTokens,
  alpha = DEFAULT_ALPHA,
  cacheRatio = DEFAULT_CACHE_RATIO,
  priceInput,
  priceOutput,
}: CostFormulaInput): number {
  const totalTokensM = monthlyTokens / 1_000_000;
  const inputCost = totalTokensM * alpha * priceInput * (1 - cacheRatio);
  const outputCost = totalTokensM * (1 - alpha) * priceOutput;
  return inputCost + outputCost;
}

/** 以「百万 tokens」为输入单位的便捷封装（成本计算器页面用）。 */
export interface MonthlyCostByMInput {
  totalTokensM: number;
  alpha: number;
  cacheRate: number;
  priceInput: number;
  priceOutput: number;
}

export function estimateMonthlyCost({
  totalTokensM,
  alpha,
  cacheRate,
  priceInput,
  priceOutput,
}: MonthlyCostByMInput): number {
  const inputCost = totalTokensM * alpha * priceInput * (1 - cacheRate);
  const outputCost = totalTokensM * (1 - alpha) * priceOutput;
  return inputCost + outputCost;
}
