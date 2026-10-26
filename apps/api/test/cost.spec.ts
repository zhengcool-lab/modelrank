// 成本计算器单测 — 与 v7.1 HTML 原型 / 前端 estimateMonthlyCost 口径对齐。
// 运行：pnpm --filter @modelrank/api test
//
// 覆盖：4 档缓存（0% / 30% / 60% / 80%）× 2 模型（gpt-5 / deepseek-r1）
// 固定入参：monthlyTokens = 40_000_000（40M），alpha = 0.25
//
// 手算（v7.1 公式：cost = totalM * alpha * pin * (1-cache) + totalM * (1-alpha) * pout）
//   totalM=40, inM=10, outM=30
//   gpt-5        pin=12 pout=60  → outM*pout=1800
//     cache=0.0: 10*12*1.0=120  → 1920
//     cache=0.3: 10*12*0.7=84   → 1884（v7.1 原型基线）
//     cache=0.6: 10*12*0.4=48   → 1848
//     cache=0.8: 10*12*0.2=24   → 1824
//   deepseek-r1  pin=1.5 pout=6   → outM*pout=180
//     cache=0.0: 10*1.5*1.0=15   → 195
//     cache=0.3: 10*1.5*0.7=10.5→ 190.5
//     cache=0.6: 10*1.5*0.4=6    → 186
//     cache=0.8: 10*1.5*0.2=3    → 183
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateMonthlyCost } from "../src/cost/cost.formula";

const MONTHLY_TOKENS = 40_000_000; // 40M
const ALPHA = 0.25;

const MODELS = [
  { id: "gpt-5", pin: 12, pout: 60 },
  { id: "deepseek-r1", pin: 1.5, pout: 6 },
] as const;

const CACHES = [0.0, 0.3, 0.6, 0.8] as const;

// 期望值表（手算），key = `${modelId}:${cache}`
const EXPECTED: Record<string, number> = {
  "gpt-5:0": 1920,
  "gpt-5:0.3": 1884,
  "gpt-5:0.6": 1848,
  "gpt-5:0.8": 1824,
  "deepseek-r1:0": 195,
  "deepseek-r1:0.3": 190.5,
  "deepseek-r1:0.6": 186,
  "deepseek-r1:0.8": 183,
};

describe("cost.calculateMonthlyCost — v7.1 口径", () => {
  for (const m of MODELS) {
    for (const c of CACHES) {
      it(`${m.id} @ cache=${c * 100}% → ¥${EXPECTED[`${m.id}:${c}`]}`, () => {
        const got = calculateMonthlyCost({
          monthlyTokens: MONTHLY_TOKENS,
          alpha: ALPHA,
          cacheRatio: c,
          priceInput: m.pin,
          priceOutput: m.pout,
        });
        assert.ok(
          Math.abs(got - EXPECTED[`${m.id}:${c}`]) < 1e-9,
          `${m.id} cache=${c}: got ${got}, expected ${EXPECTED[`${m.id}:${c}`]}`
        );
      });
    }
  }

  it("v7.1 基线：gpt-5 / 40M / α=0.25 / cache=30% → ¥1,884", () => {
    const got = calculateMonthlyCost({
      monthlyTokens: MONTHLY_TOKENS,
      alpha: ALPHA,
      cacheRatio: 0.3,
      priceInput: 12,
      priceOutput: 60,
    });
    assert.equal(Math.round(got), 1884);
  });

  it("cache=0 时退化为无缓存公式（input 全价）", () => {
    // 40M * 0.25 * 12 + 40M * 0.75 * 60 = 120 + 1800 = 1920
    const got = calculateMonthlyCost({
      monthlyTokens: MONTHLY_TOKENS,
      alpha: ALPHA,
      cacheRatio: 0,
      priceInput: 12,
      priceOutput: 60,
    });
    assert.equal(got, 1920);
  });
});
