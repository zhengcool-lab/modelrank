// POST /api/cost/calculate
// body: { modelId, monthlyTokens, alpha?, cacheRatio? }
//
// 口径（与 v7.1 HTML 原型 / 前端 packages/shared estimateMonthlyCost 对齐）：
//   alpha      = 输入 token 占比（默认 0.25）
//   cacheRatio = 缓存命中率（默认 0），直接折减输入价（原型 mockup 简化）
//   公式：monthlyCost = (monthlyTokens/1e6) * alpha * priceInput * (1-cacheRatio)
//                     + (monthlyTokens/1e6) * (1-alpha) * priceOutput
import { Body, Controller, Inject, Post } from "@nestjs/common";
import { REPOSITORY, type IRepository } from "../repository/repository.interface";
import type { CostCalculateInput, CostRecommend } from "../repository/types";
import {
  calculateMonthlyCost,
  DEFAULT_ALPHA,
  DEFAULT_CACHE_RATIO,
} from "./cost.formula";

@Controller("cost")
export class CostController {
  constructor(@Inject(REPOSITORY) private readonly repo: IRepository) {}

  @Post("calculate")
  async calculate(@Body() body: CostCalculateInput): Promise<{
    requested: CostRecommend;
    alternatives: CostRecommend[];
    assumptions: { alpha: number; cacheRatio: number };
  }> {
    const alpha = body.alpha ?? DEFAULT_ALPHA;
    const cacheRatio = body.cacheRatio ?? DEFAULT_CACHE_RATIO;

    const all = await this.repo.listAllModels();
    const target = all.find((m) => m.id === body.modelId);
    if (!target) {
      return {
        requested: {
          modelId: body.modelId,
          name: body.modelId,
          monthlyCost: 0,
          priceInput: 0,
          priceOutput: 0,
        },
        alternatives: [],
        assumptions: { alpha, cacheRatio },
      };
    }

    const costOf = (m: typeof target): CostRecommend => {
      const monthlyCost = calculateMonthlyCost({
        monthlyTokens: body.monthlyTokens,
        alpha,
        cacheRatio,
        priceInput: m.priceInput,
        priceOutput: m.priceOutput,
      });
      return {
        modelId: m.id,
        name: m.name,
        monthlyCost: Math.round(monthlyCost * 100) / 100,
        priceInput: m.priceInput,
        priceOutput: m.priceOutput,
      };
    };

    const requested = costOf(target);
    // 同预算推荐：找出月成本 <= requested.monthlyCost 的其他模型，按 score 倒序取前 3
    const alternatives = all
      .filter((m) => m.id !== target.id)
      .map(costOf)
      .filter((r) => r.monthlyCost <= requested.monthlyCost)
      .sort((a, b) => {
        const sa = all.find((m) => m.id === a.modelId)?.score ?? 0;
        const sb = all.find((m) => m.id === b.modelId)?.score ?? 0;
        return sb - sa;
      })
      .slice(0, 3);

    return {
      requested,
      alternatives,
      assumptions: { alpha, cacheRatio },
    };
  }
}
