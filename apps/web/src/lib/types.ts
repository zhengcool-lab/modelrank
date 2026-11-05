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
  /** 能力五维（Artificial Analysis Capability Indexes 真实数据，0–100 指数分） */
  dims?: {
    financeAndAccounting?: number;
    strategyAndOps?: number;
    legal?: number;
    engineering?: number;
    economics?: number;
  };
  /** USD / 百万 tokens（AA 真实单价） */
  priceInput: number;
  priceOutput: number;
  /** 价格为估算（非官方） */
  priceEstimated?: boolean;
  priceLevel: PriceLevel;
  tier: Tier;
  source: ModelSource;
  /** per-model 数据源链接（AA 模型专属详情页，真实可溯源） */
  website?: string;
  context: string;
  speedTokPerS: number;
  /** AA 每任务成本（USD，真实抓取）；null = 无数据 */
  costPerTask: number | null;
  /** AA 中位响应延迟（秒，真实抓取）；null = 无数据 */
  latencyS: number | null;
  /** 数据更新日期（MM-DD 展示用） */
  updatedAt: string;
  /** 价格最后核对日期（ISO date，YYYY-MM-DD） */
  priceUpdatedAt: string;
  /** 近 12 周综合分采样（趋势折线图） */
  trendHistory: number[];
  blurb: string;

  // ---- AA 真实补充字段（Artificial Analysis 全量数据解密所得，缺省表示该模型无该项数据）
  /** 发布日期 YYYY-MM-DD */
  releaseDate?: string;
  /** 参数量（含激活），如 "2.8T（激活 104B）" */
  params?: string;
  /** 是否推理模型 */
  isReasoning?: boolean;
  /** 许可证名称 */
  license?: string;
  /** 权重公开地址（仅开源权重模型） */
  weightsUrl?: string;
  /** 知识截止日期 */
  knowledgeCutoff?: string;
  /** 输入 / 输出模态 */
  modalities?: { in: string[]; out: string[] };
  /** AA 官方评测子项（真实分数）；unit: pct=百分比 pts=原始分 */
  benchmarks?: { label: string; value: number; unit: "pct" | "pts" }[];
  /** 厂商构成（同厂商在 AA 全量库中的模型数 / 开源数 / 闭源数 / 已评测数） */
  vendorStats?: { total: number; open: number; closed: number; rated: number };
  /** 同厂商其他模型（AA 全量库，含未进本期榜单的） */
  siblings?: {
    name: string;
    id: string;
    score: number | null;
    open: boolean | null;
    releaseDate: string | null;
    inBoard: boolean;
  }[];
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
