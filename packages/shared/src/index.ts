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

/** @deprecated 改用 @modelrank/web/src/lib/seed-data 的 UI_MODELS（前端）与 SEED_MODELS（API DTO）。
 *  本文件保留仅供其它仓库引用，apps/web 已不再从此处导入模型数据。 */
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

/** @deprecated 改用 @modelrank/web/src/lib/seed-data 的 UI_MODELS。本数组仅作向后兼容保留。 */
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
  // --- 以下为本地演示用虚构模型（B/C 档，用于库内分页与筛选演示） ---------------
  {
    id: "hunyuan-pro",
    name: "Hunyuan-Pro",
    vendor: "腾讯",
    openSource: false,
    score: 81.6,
    delta: 0.3,
    trend: "up",
    ci: 2.6,
    dims: { reasoning: 78, code: 76, math: 77, chinese: 88, multimodal: 76 },
    priceInput: 2.4,
    priceOutput: 9.6,
    priceLevel: "mid",
    tier: "B",
    source: "official",
    context: "128K",
    speedTokPerS: 88,
    updatedAt: "10-09",
    trendHistory: [78.4, 78.9, 78.6, 79.4, 79.1, 79.9, 79.6, 80.4, 80.1, 80.9, 81.3, 81.6],
    blurb: "腾讯混元商用主力，中文场景稳健",
  },
  {
    id: "step-3",
    name: "Step-3",
    vendor: "阶跃星辰",
    openSource: false,
    score: 80.4,
    delta: -0.6,
    trend: "down",
    ci: 3.0,
    dims: { reasoning: 79, code: 74, math: 78, chinese: 85, multimodal: 80 },
    priceInput: 1.8,
    priceOutput: 7.2,
    priceLevel: "low",
    tier: "B",
    source: "thirdparty",
    context: "256K",
    speedTokPerS: 78,
    updatedAt: "10-06",
    trendHistory: [78.9, 79.4, 79.1, 79.9, 79.6, 80.4, 80.1, 80.9, 80.6, 81.2, 81.0, 80.4],
    blurb: "多模态方向探索型商用模型",
  },
  {
    id: "minimax-text-01",
    name: "MiniMax-Text-01",
    vendor: "MiniMax",
    openSource: false,
    score: 79.2,
    delta: 0.8,
    trend: "up",
    ci: 3.1,
    dims: { reasoning: 76, code: 73, math: 74, chinese: 86, multimodal: 72 },
    priceInput: 1.5,
    priceOutput: 6,
    priceLevel: "low",
    tier: "B",
    source: "official",
    context: "1M",
    speedTokPerS: 92,
    updatedAt: "10-12",
    trendHistory: [75.1, 75.6, 75.3, 76.1, 75.8, 76.6, 76.3, 77.1, 76.8, 77.9, 78.6, 79.2],
    blurb: "长上下文与语音场景见长",
  },
  {
    id: "gemini-2-5-flash",
    name: "Gemini 2.5 Flash",
    vendor: "Google",
    openSource: false,
    score: 78.5,
    delta: null,
    trend: "flat",
    ci: 2.9,
    dims: { reasoning: 74, code: 72, math: 75, chinese: 70, multimodal: 84 },
    priceInput: 0.3,
    priceOutput: 1.2,
    priceLevel: "low",
    tier: "B",
    source: "thirdparty",
    context: "1M",
    speedTokPerS: 150,
    updatedAt: "10-14",
    trendHistory: [78.0, 78.2, 78.1, 78.4, 78.3, 78.5, 78.4, 78.6, 78.5, 78.6, 78.5, 78.5],
    blurb: "高性价比低延迟轻量模型",
  },
  {
    id: "qwen3-72b",
    name: "Qwen3-72B",
    vendor: "阿里",
    openSource: true,
    score: 77.8,
    delta: 0.2,
    trend: "up",
    ci: 2.7,
    dims: { reasoning: 75, code: 76, math: 76, chinese: 84, multimodal: 68 },
    priceInput: 0.8,
    priceOutput: 2.4,
    priceLevel: "low",
    tier: "B",
    source: "official",
    context: "128K",
    speedTokPerS: 105,
    updatedAt: "10-10",
    trendHistory: [75.2, 75.6, 75.4, 76.0, 75.8, 76.4, 76.2, 76.8, 76.6, 77.1, 77.6, 77.8],
    blurb: "可私有化部署的开源中型模型",
  },
  {
    id: "yi-lightning",
    name: "Yi-Lightning",
    vendor: "零一万物",
    openSource: false,
    score: 76.9,
    delta: -0.4,
    trend: "down",
    ci: 3.3,
    dims: { reasoning: 73, code: 71, math: 72, chinese: 82, multimodal: 66 },
    priceInput: 0.6,
    priceOutput: 1.8,
    priceLevel: "low",
    tier: "B",
    source: "thirdparty",
    context: "256K",
    speedTokPerS: 130,
    updatedAt: "10-05",
    trendHistory: [76.1, 76.5, 76.3, 76.9, 76.7, 77.3, 77.1, 77.6, 77.4, 77.2, 77.3, 76.9],
    blurb: "主打低延迟响应的轻量 API",
  },
  {
    id: "glm-4-9b",
    name: "GLM-4-9B",
    vendor: "智谱",
    openSource: true,
    score: 74.5,
    delta: 0.5,
    trend: "up",
    ci: 3.4,
    dims: { reasoning: 72, code: 70, math: 70, chinese: 83, multimodal: 62 },
    priceInput: 0.4,
    priceOutput: 1.2,
    priceLevel: "low",
    tier: "C",
    source: "official",
    context: "128K",
    speedTokPerS: 98,
    updatedAt: "10-08",
    trendHistory: [71.0, 71.4, 71.2, 71.9, 71.7, 72.4, 72.2, 72.9, 72.7, 73.4, 74.0, 74.5],
    blurb: "可本地部署的开源轻量模型",
  },
  {
    id: "llama-3-1-8b",
    name: "Llama 3.1 8B",
    vendor: "Meta",
    openSource: true,
    score: 72.8,
    delta: -0.2,
    trend: "flat",
    ci: 3.6,
    dims: { reasoning: 70, code: 68, math: 68, chinese: 60, multimodal: 58 },
    priceInput: 0.2,
    priceOutput: 0.8,
    priceLevel: "low",
    tier: "C",
    source: "self",
    context: "128K",
    speedTokPerS: 110,
    updatedAt: "10-04",
    trendHistory: [72.2, 72.4, 72.3, 72.6, 72.5, 72.8, 72.7, 72.9, 72.8, 73.0, 73.0, 72.8],
    blurb: "边缘部署友好的小参数模型",
  },
  {
    id: "phi-4-mini",
    name: "Phi-4 Mini",
    vendor: "Microsoft",
    openSource: true,
    score: 71.3,
    delta: 0.1,
    trend: "up",
    ci: 3.5,
    dims: { reasoning: 69, code: 71, math: 72, chinese: 58, multimodal: 55 },
    priceInput: 0.15,
    priceOutput: 0.6,
    priceLevel: "low",
    tier: "C",
    source: "thirdparty",
    context: "128K",
    speedTokPerS: 140,
    updatedAt: "10-03",
    trendHistory: [69.0, 69.3, 69.2, 69.7, 69.6, 70.1, 70.0, 70.4, 70.3, 70.8, 71.1, 71.3],
    blurb: "小参数推理与代码教学向模型",
  },
  {
    id: "baichuan4-turbo",
    name: "Baichuan4-Turbo",
    vendor: "百川",
    openSource: false,
    score: 70.6,
    delta: -0.7,
    trend: "down",
    ci: 3.8,
    dims: { reasoning: 68, code: 66, math: 67, chinese: 80, multimodal: 56 },
    priceInput: 0.5,
    priceOutput: 1.5,
    priceLevel: "low",
    tier: "C",
    source: "official",
    context: "64K",
    speedTokPerS: 90,
    updatedAt: "10-02",
    trendHistory: [69.8, 70.2, 70.0, 70.6, 70.4, 71.0, 70.8, 71.3, 71.1, 71.0, 71.3, 70.6],
    blurb: "中文垂类微调的 Turbo 版本",
  },
  {
    id: "mistral-7b-v0-3",
    name: "Mistral-7B v0.3",
    vendor: "Mistral",
    openSource: true,
    score: 68.9,
    delta: null,
    trend: "flat",
    ci: 4.0,
    dims: { reasoning: 66, code: 67, math: 66, chinese: 55, multimodal: 52 },
    priceInput: 0.1,
    priceOutput: 0.4,
    priceLevel: "low",
    tier: "C",
    source: "self",
    context: "32K",
    speedTokPerS: 120,
    updatedAt: "09-28",
    trendHistory: [68.5, 68.6, 68.6, 68.8, 68.7, 68.9, 68.8, 69.0, 68.9, 69.0, 68.9, 68.9],
    blurb: "经典开源 7B 底座，教育与实验常用",
  },
  {
    id: "yi-1-5-9b",
    name: "Yi-1.5-9B",
    vendor: "零一万物",
    openSource: true,
    score: 66.4,
    delta: -0.3,
    trend: "down",
    ci: 4.1,
    dims: { reasoning: 64, code: 63, math: 63, chinese: 76, multimodal: 50 },
    priceInput: 0.1,
    priceOutput: 0.3,
    priceLevel: "low",
    tier: "C",
    source: "self",
    context: "32K",
    speedTokPerS: 100,
    updatedAt: "09-25",
    trendHistory: [65.6, 65.9, 65.8, 66.2, 66.1, 66.5, 66.4, 66.8, 66.7, 66.6, 66.7, 66.4],
    blurb: "早期开源 9B 底座，仍可轻量微调",
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
