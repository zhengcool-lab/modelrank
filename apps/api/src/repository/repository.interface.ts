// Repository 接口 — controller 依赖这个抽象，不依赖 Prisma。
import type {
  BenchmarkRecord,
  ListModelsQuery,
  ModelDetail,
  ModelRecord,
  NewsRecord,
  Paginated,
} from "./types";

export const REPOSITORY = Symbol("REPOSITORY");

export interface IRepository {
  listModels(query: ListModelsQuery): Promise<Paginated<ModelRecord>>;
  getModel(id: string): Promise<ModelDetail | null>;
  listNews(category?: string): Promise<NewsRecord[]>;
  listBenchmarks(): Promise<BenchmarkRecord[]>;
  listAllModels(): Promise<ModelRecord[]>; // 用于成本推荐
}
