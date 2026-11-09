// API 数据访问层（Cloudflare Workers / edge runtime，无 DI）。
//
// 数据口径：只读页面上线用的真实数据源——
//   UI_MODELS（data-pipeline 从 Artificial Analysis 抓取生成）
//   UI_NEWS  （data-pipeline 每日从官方 RSS 抓取生成）
// 早期原型期的 SEED_MODELS / SEED_NEWS / SEED_BENCHMARKS（gpt-5、claude-opus-4-5 等手写样本）
// 已全部删除：对外 API 不允许再下发任何编造值，也不允许出现「接口与页面两套数据」。
import { UI_MODELS } from "./seed-data";
import { UI_NEWS } from "./news-data";
import type {
  BenchmarkRecord,
  ListModelsQuery,
  ModelDetail,
  ModelRecord,
  NewsRecord,
  Paginated,
} from "./types";

/** AA 官方数据源（模型页与评测子项均出自该站） */
const AA_SOURCE = "https://artificialanalysis.ai/";

/** 上下文档位文案 → 解析值。"1M" → 1000000；"128K" → 128000；无数字 → null */
function parseContext(label: string | undefined): number | null {
  if (!label) return null;
  const m = label.trim().match(/(\d+(?:\.\d+)?)\s*([KMkm])?/);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n) || n <= 0) return null;
  const unit = (m[2] ?? "").toUpperCase();
  if (unit === "M") return n * 1_000_000;
  if (unit === "K") return n * 1_000;
  return n;
}

function isMultimodal(out: string[] | undefined): boolean {
  if (!out || out.length === 0) return false;
  return out.some((m) => m === "图像" || m === "语音" || m === "视频" || /image|audio|video/i.test(m));
}

function toRecord(m: (typeof UI_MODELS)[number]): ModelRecord {
  return {
    id: m.id,
    name: m.name,
    vendor: m.vendor,
    score: m.score,
    priceInput: m.priceInput,
    priceOutput: m.priceOutput,
    priceEstimated: m.priceEstimated === true,
    priceCheckedAt: m.priceUpdatedAt,
    throughputTps: m.speedTokPerS,
    contextLength: parseContext(m.context),
    contextLabel: m.context,
    tier: m.tier,
    openSource: m.openSource,
    reasoning: m.isReasoning === true,
    multimodal: isMultimodal(m.modalities?.out),
    releaseDate: m.releaseDate ?? null,
    dataUpdatedAt: m.updatedAt,
  };
}

const RECORDS: ModelRecord[] = UI_MODELS.map(toRecord);

export async function listModels(query: ListModelsQuery): Promise<Paginated<ModelRecord>> {
  const sort = query.sort ?? "score";
  const order = query.order ?? "desc";
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.max(1, Math.min(100, query.pageSize ?? 20));

  const sorted = [...RECORDS].sort((a, b) => {
    const av = a[sort] as number | string | null;
    const bv = b[sort] as number | string | null;
    if (typeof av === "string" || typeof bv === "string") {
      const as = String(av ?? "");
      const bs = String(bv ?? "");
      return order === "asc" ? as.localeCompare(bs) : bs.localeCompare(as);
    }
    const an = av ?? -Infinity;
    const bn = bv ?? -Infinity;
    return order === "asc" ? an - bn : bn - an;
  });

  const total = sorted.length;
  const start = (page - 1) * pageSize;
  return { items: sorted.slice(start, start + pageSize), total, page, pageSize };
}

export async function getModel(id: string): Promise<ModelDetail | null> {
  const ui = UI_MODELS.find((x) => x.id === id);
  if (!ui) return null;
  // UI 的 trendHistory 是真实采样序列；为空时返回空数组，不补造点位
  const trend = ui.trendHistory ?? [];
  const scoreTrend = trend.map((score, i) => ({
    week: new Date(Date.UTC(2026, 10, 9) - (trend.length - 1 - i) * 7 * 86_400_000).toISOString().slice(0, 10),
    score,
  }));
  return {
    ...toRecord(ui),
    dims: ui.dims,
    benchmarks: ui.benchmarks,
    license: ui.license,
    weightsUrl: ui.weightsUrl,
    costPerTask: ui.costPerTask,
    latencyS: ui.latencyS,
    scoreTrend,
  };
}

export async function listNews(category?: string): Promise<NewsRecord[]> {
  const all: NewsRecord[] = UI_NEWS.map((n) => ({
    id: n.id,
    title: n.title,
    summary: n.summary,
    sourceUrl: n.url,
    category: n.category,
    relatedModelId: n.relatedModel ?? null,
    publishedAt: new Date(n.time).toISOString(),
  }));
  if (!category || category === "all") return all;
  return all.filter((n) => n.category === category);
}

/** AA 评测子项清单：按子项标签汇总榜内覆盖度/最高/中位数（真实统计，不做加权） */
export async function listBenchmarks(): Promise<BenchmarkRecord[]> {
  const groups = new Map<string, { unit: "pct" | "pts"; values: number[] }>();
  for (const m of UI_MODELS) {
    for (const b of m.benchmarks ?? []) {
      const g = groups.get(b.label) ?? { unit: b.unit, values: [] };
      g.values.push(b.value);
      groups.set(b.label, g);
    }
  }
  const total = UI_MODELS.length;
  return [...groups.entries()]
    .map(([label, g]) => {
      const sorted = [...g.values].sort((a, b) => a - b);
      const median =
        sorted.length % 2 === 1
          ? sorted[(sorted.length - 1) / 2]
          : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
      return {
        id: label
          .toLowerCase()
          .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
          .replace(/-+/g, "-")
          .replace(/(^-|-$)/g, ""),
        name: label,
        unit: g.unit,
        modelsCovered: sorted.length,
        coverage: Number((sorted.length / total).toFixed(3)),
        top: Math.max(...sorted),
        median: Number(median.toFixed(1)),
        sourceUrl: AA_SOURCE,
      } satisfies BenchmarkRecord;
    })
    .sort((a, b) => b.modelsCovered - a.modelsCovered);
}

export async function listAllModels(): Promise<ModelRecord[]> {
  return RECORDS;
}
