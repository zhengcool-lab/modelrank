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
