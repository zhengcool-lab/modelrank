import { NextRequest, NextResponse } from "next/server";
import { listAllModels } from "@/lib/repo";
import {
  calculateMonthlyCost,
  DEFAULT_ALPHA,
  DEFAULT_CACHE_RATIO,
} from "@/lib/cost-formula";
import type { CostCalculateInput, CostRecommend } from "@/lib/types";


export async function POST(req: NextRequest) {
  const body = (await req.json()) as CostCalculateInput;
  const alpha = body.alpha ?? DEFAULT_ALPHA;
  const cacheRatio = body.cacheRatio ?? DEFAULT_CACHE_RATIO;

  const all = await listAllModels();
  const target = all.find((m) => m.id === body.modelId);
  if (!target) {
    return NextResponse.json({
      requested: { modelId: body.modelId, name: body.modelId, monthlyCost: 0, priceInput: 0, priceOutput: 0 },
      alternatives: [],
      assumptions: { alpha, cacheRatio },
    });
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

  return NextResponse.json({ requested, alternatives, assumptions: { alpha, cacheRatio } });
}
