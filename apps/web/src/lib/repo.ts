// In-memory repository for Cloudflare Workers (no NestJS DI).
// Mirror of apps/api/src/repository/in-memory.repository.ts, pure TS.
import { SEED_BENCHMARKS, SEED_MODELS, SEED_NEWS } from "./seed-data";
import type {
  BenchmarkRecord,
  ListModelsQuery,
  ModelDetail,
  ModelRecord,
  NewsRecord,
  Paginated,
} from "./types";

// Workers isolate 是短命的，但同一个 isolate 内的全局变量在多次请求间复用。
// 模块级单例足够 MVP。
let models: ModelRecord[] | null = null;
let news: NewsRecord[] | null = null;
let benchmarks: BenchmarkRecord[] | null = null;

function init() {
  if (models) return;
  models = SEED_MODELS.map((m) => ({ ...m }));
  news = SEED_NEWS.map((n) => ({ ...n }));
  benchmarks = SEED_BENCHMARKS.map((b) => ({ ...b }));
}

export async function listModels(query: ListModelsQuery): Promise<Paginated<ModelRecord>> {
  init();
  const sort = query.sort ?? "score";
  const order = query.order ?? "desc";
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.max(1, Math.min(100, query.pageSize ?? 20));

  const sorted = [...models!].sort((a, b) => {
    const av = a[sort] as number;
    const bv = b[sort] as number;
    return order === "asc" ? av - bv : bv - av;
  });

  const total = sorted.length;
  const start = (page - 1) * pageSize;
  return {
    items: sorted.slice(start, start + pageSize),
    total,
    page,
    pageSize,
  };
}

export async function getModel(id: string): Promise<ModelDetail | null> {
  init();
  const m = models!.find((x) => x.id === id);
  if (!m) return null;
  return {
    ...m,
    priceHistory: [
      { capturedAt: "2026-06-01T00:00:00Z", priceInput: m.priceInput * 1.2, priceOutput: m.priceOutput * 1.2 },
      { capturedAt: "2026-08-01T00:00:00Z", priceInput: m.priceInput * 1.05, priceOutput: m.priceOutput * 1.05 },
      { capturedAt: "2026-10-01T00:00:00Z", priceInput: m.priceInput, priceOutput: m.priceOutput },
    ],
    scoreTrend: mockTrend(m.score),
  };
}

export async function listNews(category?: string): Promise<NewsRecord[]> {
  init();
  if (!category || category === "all") return news!;
  return news!.filter((n) => n.category === category);
}

export async function listBenchmarks(): Promise<BenchmarkRecord[]> {
  init();
  return benchmarks!;
}

export async function listAllModels(): Promise<ModelRecord[]> {
  init();
  return models!;
}

function mockTrend(base: number): Array<{ week: string; score: number }> {
  const points: Array<{ week: string; score: number }> = [];
  const now = new Date("2026-10-26T00:00:00Z");
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i * 7);
    const drift = Math.sin(i * 1.3) * 1.2;
    points.push({
      week: d.toISOString().slice(0, 10),
      score: Math.round((base - drift) * 10) / 10,
    });
  }
  return points;
}
