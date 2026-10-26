// 无 PG 环境下的 fallback 实现。
// 启动时把 SEED_* 拷进内存，所有查询在内存里完成。
import { Injectable } from "@nestjs/common";
import { SEED_BENCHMARKS, SEED_MODELS, SEED_NEWS } from "./seed-data";
import type { IRepository } from "./repository.interface";
import type {
  BenchmarkRecord,
  ListModelsQuery,
  ModelDetail,
  ModelRecord,
  NewsRecord,
  Paginated,
} from "./types";

@Injectable()
export class InMemoryRepository implements IRepository {
  private readonly models: ModelRecord[];
  private readonly news: NewsRecord[];
  private readonly benchmarks: BenchmarkRecord[];

  constructor() {
    // 深拷贝避免外部误改
    this.models = SEED_MODELS.map((m) => ({ ...m }));
    this.news = SEED_NEWS.map((n) => ({ ...n }));
    this.benchmarks = SEED_BENCHMARKS.map((b) => ({ ...b }));
  }

  async listModels(query: ListModelsQuery): Promise<Paginated<ModelRecord>> {
    const sort = query.sort ?? "score";
    const order = query.order ?? "desc";
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.max(1, Math.min(100, query.pageSize ?? 20));

    const sorted = [...this.models].sort((a, b) => {
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

  async getModel(id: string): Promise<ModelDetail | null> {
    const m = this.models.find((x) => x.id === id);
    if (!m) return null;
    return {
      ...m,
      priceHistory: [
        { capturedAt: "2026-06-01T00:00:00Z", priceInput: m.priceInput * 1.2, priceOutput: m.priceOutput * 1.2 },
        { capturedAt: "2026-08-01T00:00:00Z", priceInput: m.priceInput * 1.05, priceOutput: m.priceOutput * 1.05 },
        { capturedAt: "2026-10-01T00:00:00Z", priceInput: m.priceInput, priceOutput: m.priceOutput },
      ],
      scoreTrend: this.mockTrend(m.score),
    };
  }

  async listNews(category?: string): Promise<NewsRecord[]> {
    if (!category || category === "all") return this.news;
    return this.news.filter((n) => n.category === category);
  }

  async listBenchmarks(): Promise<BenchmarkRecord[]> {
    return this.benchmarks;
  }

  async listAllModels(): Promise<ModelRecord[]> {
    return this.models;
  }

  // 12 周 mock 趋势：以当前 score 为锚点，±1.5 内随机漂移
  private mockTrend(base: number): Array<{ week: string; score: number }> {
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
}
