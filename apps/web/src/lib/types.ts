// Domain DTOs — Prisma ORM 实体的干净投影。
// InMemoryRepository 与 PrismaRepository 都返回这些类型，controller 不感知底层存储。

export type ModelTier = "S" | "A" | "B" | "C";

/**
 * API 对外 DTO。数据源与页面完全同源（lib/seed-data.ts 的 UI_MODELS，来自
 * Artificial Analysis 真实抓取），不含任何原型假数据；只保留能溯源到真实字段的列。
 * 无法溯源的列（如「是否支持中文」「是否擅长编码」这类无官方字段的布尔）一律不下发。
 */
export interface ModelRecord {
  id: string; // slug
  name: string;
  vendor: string;
  /** 综合能力分 0–100（站内口径，见 /methodology） */
  score: number;
  /** USD / 1M tokens（AA 实测单价，非官方标价；是否估算见 priceEstimated） */
  priceInput: number;
  priceOutput: number;
  priceEstimated: boolean;
  /** 价格最后核对日期（YYYY-MM-DD） */
  priceCheckedAt: string;
  /** AA 实测输出速度（tokens/s），0 = 未测 */
  throughputTps: number;
  /** 上下文档位解析值；null = 未披露 */
  contextLength: number | null;
  /** 上下文档位原始文案，如 "1M"、"128K" */
  contextLabel: string;
  tier: ModelTier;
  openSource: boolean;
  reasoning: boolean;
  /** 输出模态是否含非文本（图像/语音/视频） */
  multimodal: boolean;
  releaseDate: string | null;
  /** 数据更新日期（MM-DD） */
  dataUpdatedAt: string;
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

/**
 * 测评子项清单。本榜不对子项设权重（能力分只由五维指数聚合，见 /methodology），
 * 因此这里只发布真实子项与覆盖度统计，不编造 weight / 污染风险评级。
 */
export interface BenchmarkRecord {
  id: string;
  /** AA 子项原始标签 */
  name: string;
  unit: "pct" | "pts";
  /** 有该子项成绩的模型数 */
  modelsCovered: number;
  /** 覆盖率 = modelsCovered / 榜单模型总数 */
  coverage: number;
  /** 该子项在榜内的最高分；null = 无数据 */
  top: number | null;
  /** 该子项在榜内的中位数；null = 无数据 */
  median: number | null;
  /** 数据源（AA 官方） */
  sourceUrl: string;
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
  /** 能力五维（AA Capability Indexes，0–100），缺省表示该模型无该维数据 */
  dims?: UIModelRecord["dims"];
  /** AA 官方评测子项（真实分数） */
  benchmarks?: { label: string; value: number; unit: "pct" | "pts" }[];
  license?: string;
  weightsUrl?: string;
  /** AA 每任务成本（USD）；null = 无数据 */
  costPerTask: number | null;
  /** AA 中位响应延迟（秒）；null = 无数据 */
  latencyS: number | null;
  /** 综合分趋势采样（站内真实采样序列） */
  scoreTrend: ModelTrendPoint[];
}

export interface ListModelsQuery {
  sort?: "score" | "priceInput" | "priceOutput" | "throughputTps" | "contextLength" | "releaseDate";
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
