// 生产环境真实 PG 实现。本地无 DATABASE_URL 时不会被实例化。
// 这里只做查询映射，不写业务逻辑。
import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
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
export class PrismaRepository implements IRepository, OnModuleInit {
  private readonly prisma = new PrismaClient();

  async onModuleInit(): Promise<void> {
    await this.prisma.$connect();
  }

  async listModels(query: ListModelsQuery): Promise<Paginated<ModelRecord>> {
    const sort = query.sort ?? "score";
    const order = query.order ?? "desc";
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.max(1, Math.min(100, query.pageSize ?? 20));

    const [rows, total] = await Promise.all([
      this.prisma.model.findMany({
        orderBy: { [sort]: order },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.model.count(),
    ]);

    return { items: rows.map(toModelRecord), total, page, pageSize };
  }

  async getModel(id: string): Promise<ModelDetail | null> {
    const m = await this.prisma.model.findUnique({
      where: { id },
      include: { priceSnapshots: { orderBy: { capturedAt: "desc" }, take: 12 } },
    });
    if (!m) return null;
    return {
      ...toModelRecord(m),
      priceHistory: m.priceSnapshots.map((s) => ({
        capturedAt: s.capturedAt.toISOString(),
        priceInput: s.priceInput,
        priceOutput: s.priceOutput,
      })),
      scoreTrend: [],
    };
  }

  async listNews(category?: string): Promise<NewsRecord[]> {
    const rows = await this.prisma.newsArticle.findMany({
      where: category && category !== "all" ? { category } : undefined,
      orderBy: { publishedAt: "desc" },
    });
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      summary: r.summary,
      sourceUrl: r.sourceUrl,
      category: r.category as NewsRecord["category"],
      relatedModelId: r.relatedModelId,
      publishedAt: r.publishedAt.toISOString(),
    }));
  }

  async listBenchmarks(): Promise<BenchmarkRecord[]> {
    const rows = await this.prisma.benchmark.findMany({ orderBy: { weight: "desc" } });
    return rows.map((b) => ({
      id: b.id,
      name: b.name,
      weight: b.weight,
      sourceUrl: b.sourceUrl,
      contaminationRisk: b.contaminationRisk as BenchmarkRecord["contaminationRisk"],
    }));
  }

  async listAllModels(): Promise<ModelRecord[]> {
    const rows = await this.prisma.model.findMany();
    return rows.map(toModelRecord);
  }
}

function toModelRecord(m: {
  id: string;
  name: string;
  vendor: string;
  score: number;
  priceInput: number;
  priceOutput: number;
  throughputTps: number;
  contextLength: number;
  tier: string;
  multimodal: boolean;
  coding: boolean;
  chinese: boolean;
  reasoning: boolean;
  publishedAt: Date;
}): ModelRecord {
  return {
    id: m.id,
    name: m.name,
    vendor: m.vendor,
    score: m.score,
    priceInput: m.priceInput,
    priceOutput: m.priceOutput,
    throughputTps: m.throughputTps,
    contextLength: m.contextLength,
    tier: m.tier as ModelRecord["tier"],
    multimodal: m.multimodal,
    coding: m.coding,
    chinese: m.chinese,
    reasoning: m.reasoning,
    publishedAt: m.publishedAt.toISOString(),
  };
}
