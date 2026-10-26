// POST /api/cost/calculate
// body: { modelId, monthlyTokens, alpha?, cacheRatio? }
// alpha = 输入 tokens 占比（默认 0.7）；cacheRatio = 输入命中缓存比例（默认 0，命中价按 0.25x 计）
import { Body, Controller, Inject, Post } from "@nestjs/common";
import { REPOSITORY, type IRepository } from "../repository/repository.interface";
import type { CostCalculateInput, CostRecommend } from "../repository/types";

@Controller("cost")
export class CostController {
  constructor(@Inject(REPOSITORY) private readonly repo: IRepository) {}

  @Post("calculate")
  async calculate(@Body() body: CostCalculateInput): Promise<{
    requested: CostRecommend;
    alternatives: CostRecommend[];
    assumptions: { alpha: number; cacheRatio: number; cacheDiscount: number };
  }> {
    const alpha = body.alpha ?? 0.7;
    const cacheRatio = body.cacheRatio ?? 0;
    const CACHE_DISCOUNT = 0.25; // 命中缓存的输入价折扣

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
        assumptions: { alpha, cacheRatio, cacheDiscount: CACHE_DISCOUNT },
      };
    }

    const costOf = (m: typeof target): CostRecommend => {
      const inputTokens = body.monthlyTokens * alpha;
      const outputTokens = body.monthlyTokens * (1 - alpha);
      const billedInput =
        inputTokens * (1 - cacheRatio) + inputTokens * cacheRatio * CACHE_DISCOUNT;
      // 价格单位：元 / 1M tokens
      const monthlyCost =
        (billedInput / 1_000_000) * m.priceInput +
        (outputTokens / 1_000_000) * m.priceOutput;
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
      assumptions: { alpha, cacheRatio, cacheDiscount: CACHE_DISCOUNT },
    };
  }
}
