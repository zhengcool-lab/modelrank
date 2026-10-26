// Domain DTOs — Prisma ORM 实体的干净投影。
// InMemoryRepository 与 PrismaRepository 都返回这些类型，controller 不感知底层存储。

export type ModelTier = "S" | "A" | "B" | "C";

export interface ModelRecord {
  id: string; // slug
  name: string;
  vendor: string;
  score: number;
  priceInput: number; // 元 / 1M tokens
  priceOutput: number;
  throughputTps: number;
  contextLength: number;
  tier: ModelTier;
  multimodal: boolean;
  coding: boolean;
  chinese: boolean;
  reasoning: boolean;
  publishedAt: string; // ISO
  priceUpdatedAt: string; // 价格最后核对日期（ISO date，YYYY-MM-DD）
}

// ---------------------------------------------------------------------------
// UI 展示层类型（榜单/对比/详情页用）。
// 与上面 API DTO 的 ModelRecord 刻意不强行合并字段（context 字符串 vs contextLength 数字等），
// 仅在 apps/web 内部使用，数据来自 lib/seed-data.ts 的 UI_MODELS。
// ---------------------------------------------------------------------------

export type Tier = ModelTier;
export type TrendDir = "up" | "down" | "flat";
export type ModelSource = "official" | "thirdparty" | "self";
export type PriceLevel = "high" | "mid" | "low";

export interface UIModelRecord {
  /** url-friendly id，用于 /detail/[id] */
  id: string;
  name: string;
  vendor: string;
  openSource: boolean;
  /** 综合分 0–100 */
  score: number;
  /** 周环比变化，null 表示持平 */
  delta: number | null;
  trend: TrendDir;
  /** 95% 置信区间半宽 */
  ci: number;
  /** 子维度 */
  dims: {
    reasoning: number;
    code: number;
    math: number;
    chinese: number;
    multimodal: number;
  };
  /** ¥ / 百万 tokens */
  priceInput: number;
  priceOutput: number;
  /** 价格为估算（非官方） */
  priceEstimated?: boolean;
  priceLevel: PriceLevel;
  tier: Tier;
  source: ModelSource;
  context: string;
  speedTokPerS: number;
  /** 数据更新日期（MM-DD 展示用） */
  updatedAt: string;
  /** 价格最后核对日期（ISO date，YYYY-MM-DD） */
  priceUpdatedAt: string;
  /** 近 12 周综合分采样（趋势折线图） */
  trendHistory: number[];
  blurb: string;
}

export type NewsCategory = "发布" | "评测" | "融资" | "政策" | "价格";

export interface UINewsItem {
  id: string;
  category: NewsCategory;
  title: string;
  summary: string;
  source: string;
  time: string;
  relatedModel?: string;
  url: string;
}

export interface BenchmarkRecord {
  id: string;
  name: string;
  weight: number;
  sourceUrl: string;
  contaminationRisk: "low" | "med" | "high";
}

export interface NewsRecord {
  id: string;
  title: string;
  summary: string;
  sourceUrl: string;
  category: "发布" | "评测" | "融资" | "政策" | "价格";
  relatedModelId: string | null;
  publishedAt: string;
}

export interface ModelTrendPoint {
  week: string; // ISO date (Monday of week)
  score: number;
}

export interface ModelDetail extends ModelRecord {
  priceHistory: Array<{ capturedAt: string; priceInput: number; priceOutput: number }>;
  scoreTrend: ModelTrendPoint[]; // 12 周
}

export interface ListModelsQuery {
  sort?: "score" | "priceInput" | "priceOutput" | "throughputTps" | "publishedAt";
  order?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CostCalculateInput {
  modelId: string;
  monthlyTokens: number; // 月总 tokens（输入+输出合计，按 alpha 拆）
  alpha?: number; // 输入占比，默认 0.25（v7.1 口径）
  cacheRatio?: number; // 缓存命中率 0..1，默认 0
}

export interface CostRecommend {
  modelId: string;
  name: string;
  monthlyCost: number;
  priceInput: number;
  priceOutput: number;
}
