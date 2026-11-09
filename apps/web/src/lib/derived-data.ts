// ---------------------------------------------------------------------------
// 可复用数据派生层（derived-data）
// 唯一数据源：./seed-data.ts（只读，禁止修改）。
// 所有函数为纯函数、无副作用，供页面空态填充与写死数据替换消费。
// ---------------------------------------------------------------------------

import { UI_MODELS } from "./seed-data";
import { UI_NEWS } from "./news-data";
import type { UIModelRecord, UINewsItem } from "./types";

// ---------------------------------------------------------------------------
// 1. 价格中位数
// ---------------------------------------------------------------------------

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

/**
 * 对 UI_MODELS 全部模型的 priceInput / priceOutput 分别取中位数。
 * 偶数个取中间两值平均。
 */
export function getPriceMedian(): { input: number; output: number } {
  return {
    input: median(UI_MODELS.map((m) => m.priceInput)),
    output: median(UI_MODELS.map((m) => m.priceOutput)),
  };
}

// ---------------------------------------------------------------------------
// 2. 模型规格（仅从真实字段派生，严禁编造）
// ---------------------------------------------------------------------------

export interface SpecRow {
  label: string;
  value: string;
}

/**
 * 从 model 真实字段派生规格行：上下文窗口、参数量、模型类型、模态、许可证、发布日期、价格、更新日期。
 * 没有数据源的字段一律不输出（不编造）。
 */
export function getModelSpecs(model: UIModelRecord): SpecRow[] {
  const rows: SpecRow[] = [];

  // 上下文窗口
  if (model.context) {
    rows.push({ label: "上下文窗口", value: model.context });
  }

  // 参数量（AA 真实数据）
  if (model.params) {
    rows.push({ label: "参数量", value: model.params });
  }

  // 模型类型
  if (typeof model.isReasoning === "boolean") {
    rows.push({ label: "模型类型", value: model.isReasoning ? "推理模型" : "非推理模型" });
  }

  // 输入 / 输出模态
  if (model.modalities) {
    if (model.modalities.in.length) {
      rows.push({ label: "输入模态", value: model.modalities.in.join(" / ") });
    }
    if (model.modalities.out.length) {
      rows.push({ label: "输出模态", value: model.modalities.out.join(" / ") });
    }
  }

  // 许可证
  if (model.license) {
    rows.push({ label: "许可证", value: model.license });
  }

  // 发布日期
  if (model.releaseDate) {
    rows.push({ label: "发布日期", value: formatDate(model.releaseDate) });
  }

  // 知识截止
  if (model.knowledgeCutoff) {
    rows.push({ label: "知识截止", value: formatDate(model.knowledgeCutoff) });
  }

  // 价格（输入 / 输出，每 M tokens）
  rows.push({
    label: "API 价格",
    value: model.priceInput > 0 ? `$${model.priceInput} / $${model.priceOutput} 每 M tokens` : "待核对（官方定价）",
  });

  // 更新日期（优先价格更新日期，回退数据更新日期）
  const updateRaw = model.priceUpdatedAt || model.updatedAt;
  if (updateRaw) {
    rows.push({ label: "更新日期", value: formatDate(updateRaw) });
  }

  return rows;
}

// ---------------------------------------------------------------------------
// 3. 相关新闻
// ---------------------------------------------------------------------------

/**
 * 在 UI_NEWS 中按 relatedModel === modelName 精确匹配。
 * 若结果为空，回退返回 UI_NEWS 按 time 倒序最新的 limit 条（默认 2）。
 */
export function getRelatedNews(modelName: string, limit = 2): UINewsItem[] {
  const exact = UI_NEWS.filter((n) => n.relatedModel === modelName);
  if (exact.length > 0) return exact.slice(0, limit);

  // 兜底：按 time 倒序取最新
  const sorted = [...UI_NEWS].sort((a, b) => b.time.localeCompare(a.time));
  return sorted.slice(0, limit);
}

// ---------------------------------------------------------------------------
// 4. 相关模型
// ---------------------------------------------------------------------------

/**
 * 从 UI_MODELS 找同 vendor 的其他模型优先，不足补同 tier 的，排除自身，默认 3 个。
 */
export function getRelatedModels(modelId: string, limit = 3): UIModelRecord[] {
  const self = UI_MODELS.find((m) => m.id === modelId);
  if (!self) return [];

  // 同 vendor（排除自身）
  const sameVendor = UI_MODELS.filter(
    (m) => m.id !== modelId && m.vendor === self.vendor,
  );

  if (sameVendor.length >= limit) {
    return sameVendor.slice(0, limit);
  }

  // 不足补同 tier（排除自身与已选的同 vendor 模型）
  const picked = new Set(sameVendor.map((m) => m.id));
  picked.add(modelId);
  const sameTier = UI_MODELS.filter(
    (m) => !picked.has(m.id) && m.tier === self.tier,
  );

  return [...sameVendor, ...sameTier].slice(0, limit);
}

// ---------------------------------------------------------------------------
// 5. 热门搜索
// ---------------------------------------------------------------------------

/**
 * 从 UI_MODELS 按 score 降序取前 N 个 name 去重；
 * 若不足 N，追加去重后的厂商名补位。默认 6 个。
 */
export function getHotSearches(limit = 6): string[] {
  const byScore = [...UI_MODELS].sort((a, b) => b.score - a.score);
  const names: string[] = [];
  const seen = new Set<string>();

  for (const m of byScore) {
    if (!seen.has(m.name)) {
      seen.add(m.name);
      names.push(m.name);
    }
    if (names.length >= limit) break;
  }

  // 不足则补厂商名
  if (names.length < limit) {
    for (const m of byScore) {
      if (!seen.has(m.vendor)) {
        seen.add(m.vendor);
        names.push(m.vendor);
      }
      if (names.length >= limit) break;
    }
  }

  return names.slice(0, limit);
}

// ---------------------------------------------------------------------------
// 6. 新闻反查模型 id
// ---------------------------------------------------------------------------

/**
 * 在 UI_MODELS 中按 name === news.relatedModel 反查模型 id。
 * 匹配不到（如"开源模型厂商"这类非模型名）返回 undefined。
 */
export function getNewsRelatedModelId(
  news: UINewsItem,
): string | undefined {
  if (!news.relatedModel) return undefined;
  const found = UI_MODELS.find((m) => m.name === news.relatedModel);
  return found?.id;
}

// ---------------------------------------------------------------------------
// 7. 日期格式化
// ---------------------------------------------------------------------------

/**
 * 把 "2026-10-12" / "10-12" / ISO 时间字符串统一输出为 "YYYY-MM-DD"。
 * 优先用 ISO 中的年份；无年份的补当前年份。
 */
export function formatDate(iso: string): string {
  // 已是完整日期格式 "YYYY-MM-DD" 或 ISO 时间含完整日期
  const fullMatch = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (fullMatch) {
    return `${fullMatch[1]}-${fullMatch[2]}-${fullMatch[3]}`;
  }

  // 仅 "MM-DD" 格式，补当前年份
  const mdMatch = iso.match(/^(\d{1,2})-(\d{1,2})$/);
  if (mdMatch) {
    const year = new Date().getFullYear();
    const mm = mdMatch[1].padStart(2, "0");
    const dd = mdMatch[2].padStart(2, "0");
    return `${year}-${mm}-${dd}`;
  }

  // 兜底：原样返回
  return iso;
}

// ---------------------------------------------------------------------------
// 8. 厂商背景（迁移自 detail/[id]/page.tsx VENDOR_BACKGROUND 常量）
// ---------------------------------------------------------------------------

/** 厂商背景原文键值（保留 detail 页面全部文案） */
const VENDOR_BACKGROUND_SOURCE: Record<string, string> = {
  OpenAI:
    "2015 年成立于美国旧金山，由 Sam Altman、Greg Brockman、Ilya Sutskever 等联合创立，初期以非营利研究机构形态起步，后由微软战略投资、转向商业化运营。主营 ChatGPT 与 GPT 系列基础模型，旗舰模型闭源、通过 API 与订阅产品提供；部分研究权重、评测集与开源工具对外发布。",
  Anthropic:
    "2021 年由前 OpenAI 成员 Dario Amodei、Daniela Amodei 等在旧金山创立，主打安全对齐研究。代表产品为 Claude 系列对话与编程模型，以 API 与 Claude.ai 订阅形式提供，旗舰模型闭源，强调 Constitutional AI 与可解释性研究。",
  Google:
    "Google 于 2017 年提出 Transformer 架构，旗下 DeepMind 与 Google Research 长期主导基础模型研究。Gemini 系列多模态模型通过 API、Gemini App 与 Workspace 产品分发，部分模型权重（如 Gemma）开放下载。",
  DeepSeek:
    "深度求索（DeepSeek）2023 年成立于杭州，由量化私募幻方孵化。代表模型 DeepSeek-V3 / R1 以开源权重发布，主打低成本高性能推理，同步提供 API 服务。",
};

/**
 * 厂商名中英文别名 → 背景原文 key 的映射。
 * UI_MODELS 中 vendor 使用中文（如"深度求索"），VENDOR_BACKGROUND 键使用英文（如"DeepSeek"），
 * 通过此映射兼容两种写法。
 */
const VENDOR_ALIAS: Record<string, string> = {
  DeepSeek: "DeepSeek",
  深度求索: "DeepSeek",
  OpenAI: "OpenAI",
  Anthropic: "Anthropic",
  Google: "Google",
};

/**
 * 按厂商名查背景介绍，兼容中英文键。
 * 未收录的厂商返回 undefined，由调用方决定兜底文案。
 */
export function getVendorBackground(vendor: string): string | undefined {
  const key = VENDOR_ALIAS[vendor];
  if (key) return VENDOR_BACKGROUND_SOURCE[key];
  return undefined;
}

// ---------------------------------------------------------------------------
// 9. 方法论权重口径
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 9. 模型搜索匹配（品牌别名扩展）
// ---------------------------------------------------------------------------

/**
 * 品牌别名：搜品牌词（gpt/claude/gemini…）时命中该厂商全部模型，
 * 避免"搜 GPT 只出名字带 gpt 的"漏掉 o4-mini 等 OpenAI 系模型。
 * 键为小写搜索词，值为匹配的厂商名（小写）。
 */
const BRAND_ALIASES: Record<string, string[]> = {
  gpt: ["openai"],
  chatgpt: ["openai"],
  openai: ["openai"],
  claude: ["anthropic"],
  anthropic: ["anthropic"],
  gemini: ["google"],
  google: ["google"],
  qwen: ["alibaba", "aliyun"],
  "通义": ["alibaba", "aliyun"],
  千问: ["alibaba", "aliyun"],
  deepseek: ["deepseek"],
  llama: ["meta"],
  meta: ["meta"],
  mistral: ["mistral"],
  kimi: ["moonshot"],
  豆包: ["bytedance", "doubao"],
  doubao: ["bytedance", "doubao"],
  hunyuan: ["tencent", "hunyuan"],
  混元: ["tencent", "hunyuan"],
  ernie: ["baidu"],
  文心: ["baidu"],
  glm: ["zhipu", "zhipuai"],
  智谱: ["zhipu", "zhipuai"],
  minimax: ["minimax"],
  longcat: ["meituan"],
  百川: ["baichuan"],
  baichuan: ["baichuan"],
  step: ["stepfun"],
  阶跃: ["stepfun"],
};

/** 按查询词匹配模型：名称/厂商/简介子串 + 品牌别名厂商扩展（纯函数、无副作用）。 */
export function matchModelsByQuery(models: UIModelRecord[], query: string): UIModelRecord[] {
  const kw = query.trim().toLowerCase();
  if (!kw) return [];
  const brandVendors = BRAND_ALIASES[kw] ?? [];
  return models.filter(
    (m) =>
      m.name.toLowerCase().includes(kw) ||
      m.vendor.toLowerCase().includes(kw) ||
      m.blurb.toLowerCase().includes(kw) ||
      brandVendors.includes(m.vendor.toLowerCase())
  );
}
