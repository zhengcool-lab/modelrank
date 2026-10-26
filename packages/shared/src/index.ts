// Shared types + mock data between apps/web and apps/api.
// C agent (backend) will replace the mock array with a real API later;
// web consumes `MOCK_MODELS` statically for now (no network calls).

export type HealthStatus = {
  status: "ok";
  uptime: number;
};

export const API_PORTS = {
  web: 3000,
  api: 3001,
} as const;

// ---------------------------------------------------------------------------
// Mock model-rating baseline (must stay aligned with UI v7.1 prototype + PRD)
// ---------------------------------------------------------------------------

export type Tier = "S" | "A" | "B" | "C";
export type TrendDir = "up" | "down" | "flat";
export type ModelSource = "official" | "thirdparty" | "self";
export type PriceLevel = "high" | "mid" | "low";

export type ModelRecord = {
  /** url-friendly id, used by /detail/[id] */
  id: string;
  name: string;
  vendor: string;
  openSource: boolean;
  /** overall score 0-100 */
  score: number;
  /** week-over-week delta, null = flat */
  delta: number | null;
  trend: TrendDir;
  /** 95% confidence interval half-width */
  ci: number;
  /** sub-dimensions */
  dims: {
    reasoning: number;
    code: number;
    math: number;
    chinese: number;
    multimodal: number;
  };
  /** ¥ per million tokens */
  priceInput: number;
  priceOutput: number;
  /** price is estimated (not official) */
  priceEstimated?: boolean;
  priceLevel: PriceLevel;
  tier: Tier;
  source: ModelSource;
  context: string;
  speedTokPerS: number;
  updatedAt: string;
  /** 12 weekly score samples for the trend line chart */
  trendHistory: number[];
  blurb: string;
};

export const MOCK_MODELS: ModelRecord[] = [
  {
    id: "gpt-5",
    name: "GPT-5",
    vendor: "OpenAI",
    openSource: false,
    score: 96.3,
    delta: 2.1,
    trend: "up",
    ci: 2.1,
    dims: { reasoning: 94, code: 90, math: 93, chinese: 88, multimodal: 96 },
    priceInput: 12,
    priceOutput: 60,
    priceLevel: "high",
    tier: "S",
    source: "official",
    context: "128K",
    speedTokPerS: 90,
    updatedAt: "10-12",
    trendHistory: [88.2, 88.9, 88.6, 90.1, 89.8, 91.4, 92.3, 91.9, 93.4, 94.0, 95.1, 96.3],
    blurb: "面向通用任务的旗舰多模态模型",
  },
  {
    id: "claude-opus-4-5",
    name: "Claude Opus 4.5",
    vendor: "Anthropic",
    openSource: false,
    score: 94.1,
    delta: -1.3,
    trend: "down",
    ci: 1.8,
    dims: { reasoning: 90, code: 92, math: 88, chinese: 82, multimodal: 84 },
    priceInput: 15,
    priceOutput: 75,
    priceLevel: "high",
    tier: "A",
    source: "thirdparty",
    context: "200K",
    speedTokPerS: 75,
    updatedAt: "10-10",
    trendHistory: [95.6, 95.2, 95.8, 94.9, 95.4, 94.6, 95.0, 94.4, 94.8, 94.2, 95.4, 94.1],
    blurb: "长上下文与编码见长的闭源旗舰",
  },
  {
    id: "gemini-3-pro",
    name: "Gemini 3 Pro",
    vendor: "Google",
    openSource: false,
    score: 93.8,
    delta: null,
    trend: "flat",
    ci: 2.4,
    dims: { reasoning: 89, code: 86, math: 90, chinese: 85, multimodal: 92 },
    priceInput: 11,
    priceOutput: 44,
    priceLevel: "mid",
    tier: "S",
    source: "thirdparty",
    context: "1M",
    speedTokPerS: 80,
    updatedAt: "10-14",
    trendHistory: [93.2, 93.5, 93.1, 93.6, 93.4, 93.9, 93.5, 93.7, 93.6, 93.9, 93.7, 93.8],
    blurb: "超长上下文与多模态输入",
  },
  {
    id: "claude-sonnet-4-5",
    name: "Claude Sonnet 4.5",
    vendor: "Anthropic",
    openSource: false,
    score: 90.5,
    delta: 0.9,
    trend: "up",
    ci: 2.2,
    dims: { reasoning: 88, code: 89, math: 86, chinese: 84, multimodal: 80 },
    priceInput: 3,
    priceOutput: 15,
    priceLevel: "mid",
    tier: "A",
    source: "thirdparty",
    context: "200K",
    speedTokPerS: 100,
    updatedAt: "10-13",
    trendHistory: [87.1, 87.6, 87.4, 88.2, 88.0, 88.9, 89.2, 88.8, 89.6, 89.9, 89.6, 90.5],
    blurb: "兼顾速度与能力的中端旗舰",
  },
  {
    id: "deepseek-r1",
    name: "DeepSeek-R1",
    vendor: "深度求索",
    openSource: true,
    score: 89.5,
    delta: 1.6,
    trend: "up",
    ci: 1.5,
    dims: { reasoning: 91, code: 85, math: 92, chinese: 87, multimodal: 70 },
    priceInput: 1.5,
    priceOutput: 3,
    priceLevel: "low",
    tier: "S",
    source: "official",
    context: "128K",
    speedTokPerS: 120,
    updatedAt: "10-08",
    trendHistory: [84.2, 84.9, 84.6, 85.8, 86.1, 86.9, 87.4, 87.1, 88.0, 88.4, 87.9, 89.5],
    blurb: "开源推理模型，性价比标杆",
  },
  {
    id: "qwen3-max",
    name: "Qwen3-Max",
    vendor: "阿里",
    openSource: true,
    score: 88.2,
    delta: -0.8,
    trend: "down",
    ci: 2.0,
    dims: { reasoning: 85, code: 87, math: 86, chinese: 93, multimodal: 78 },
    priceInput: 2,
    priceOutput: 6,
    priceLevel: "low",
    tier: "B",
    source: "official",
    context: "256K",
    speedTokPerS: 95,
    updatedAt: "10-11",
    trendHistory: [86.4, 86.9, 86.6, 87.4, 87.1, 88.0, 88.6, 88.2, 88.9, 88.5, 89.0, 88.2],
    blurb: "中文能力突出的开源模型",
  },
  {
    id: "llama-4-maverick",
    name: "Llama 4 Maverick",
    vendor: "Meta",
    openSource: true,
    score: 85.0,
    delta: 0.4,
    trend: "up",
    ci: 3.2,
    dims: { reasoning: 80, code: 78, math: 79, chinese: 74, multimodal: 82 },
    priceInput: 3,
    priceOutput: 9,
    priceEstimated: true,
    priceLevel: "mid",
    tier: "C",
    source: "self",
    context: "1M",
    speedTokPerS: 70,
    updatedAt: "10-05",
    trendHistory: [82.1, 82.6, 82.4, 83.0, 82.8, 83.4, 83.2, 83.9, 83.7, 84.4, 84.6, 85.0],
    blurb: "开源多模态 MoE 模型",
  },
  {
    id: "mistral-large-3",
    name: "Mistral Large 3",
    vendor: "Mistral",
    openSource: true,
    score: 83.2,
    delta: -0.5,
    trend: "down",
    ci: 2.8,
    dims: { reasoning: 79, code: 82, math: 78, chinese: 72, multimodal: 74 },
    priceInput: 2,
    priceOutput: 8,
    priceLevel: "mid",
    tier: "B",
    source: "thirdparty",
    context: "128K",
    speedTokPerS: 85,
    updatedAt: "10-07",
    trendHistory: [82.4, 82.9, 82.6, 83.4, 83.1, 83.8, 83.5, 84.0, 83.7, 84.2, 83.7, 83.2],
    blurb: "欧洲开源阵营主力",
  },
];

export const getModel = (id: string): ModelRecord | undefined =>
  MOCK_MODELS.find((m) => m.id === id);

// --- mock news feed ---------------------------------------------------------

export type NewsCategory = "发布" | "评测" | "融资" | "政策" | "价格";

export type NewsItem = {
  id: string;
  category: NewsCategory;
  title: string;
  summary: string;
  source: string;
  time: string;
  relatedModel?: string;
  url: string;
};

export const MOCK_NEWS: NewsItem[] = [
  {
    id: "n1",
    category: "发布",
    title: "Anthropic 发布 Claude Opus 4.5，推理与代码能力显著提升",
    summary: "官方博客更新，新版本已开放 API 灰度。",
    source: "Anthropic",
    time: "2 小时前",
    relatedModel: "Claude Opus 4.5",
    url: "https://www.anthropic.com/news",
  },
  {
    id: "n2",
    category: "价格",
    title: "阿里开源发布 Qwen3-Max，输出价格下调约 40%",
    summary: "同步开放 256K 上下文长上下文 API。",
    source: "机器之心",
    time: "5 小时前",
    relatedModel: "Qwen3-Max",
    url: "https://www.jiqizhixin.com",
  },
  {
    id: "n3",
    category: "评测",
    title: "第三方评测：DeepSeek-R1 盲测胜率升至 58%",
    summary: "LMSYS Arena 近两周榜单，性价比领先。",
    source: "LMArena",
    time: "昨天",
    relatedModel: "DeepSeek-R1",
    url: "https://lmarena.ai",
  },
  {
    id: "n4",
    category: "发布",
    title: "Google 更新 Gemini 3 Pro，上下文窗口扩至 1M",
    summary: "超长文档处理与多模态输入同步升级。",
    source: "Google 官方博客",
    time: "2 天前",
    relatedModel: "Gemini 3 Pro",
    url: "https://blog.google/technology/ai",
  },
  {
    id: "n5",
    category: "融资",
    title: "某国产大模型厂商完成 B 轮融资，估值 80 亿元",
    summary: "资金将投向推理芯片与开源生态。",
    source: "36 氪",
    time: "3 天前",
    relatedModel: "开源模型厂商",
    url: "https://36kr.com",
  },
  {
    id: "n6",
    category: "政策",
    title: "生成式 AI 服务备案新规：明确上线前备案流程",
    summary: "工信部发布征求意见稿，附合规时间线。",
    source: "工信部",
    time: "上周",
    relatedModel: "生成式 AI 备案",
    url: "https://www.miit.gov.cn",
  },
];

// --- cost calculator helpers -------------------------------------------------

export type CostInput = {
  /** total monthly tokens in millions (M) */
  totalTokensM: number;
  /** input share 0.05–0.5 */
  alpha: number;
  /** cache hit rate 0 / 0.3 / 0.6 */
  cacheRate: number;
  priceInput: number;
  priceOutput: number;
};

export function estimateMonthlyCost({
  totalTokensM,
  alpha,
  cacheRate,
  priceInput,
  priceOutput,
}: CostInput): number {
  const inputCost = totalTokensM * alpha * priceInput * (1 - cacheRate);
  const outputCost = totalTokensM * (1 - alpha) * priceOutput;
  return inputCost + outputCost;
}
