// GET /api/models, GET /api/models/:id
import {
  Controller,
  Get,
  Param,
  Query,
  Inject,
  NotFoundException,
} from "@nestjs/common";
import { REPOSITORY, type IRepository } from "../repository/repository.interface";
import { CACHE, type ICache } from "../cache/cache.service";
import type { ListModelsQuery, ModelRecord, Paginated } from "../repository/types";

@Controller("models")
export class ModelsController {
  constructor(
    @Inject(REPOSITORY) private readonly repo: IRepository,
    @Inject(CACHE) private readonly cache: ICache,
  ) {}

  @Get()
  async list(
    @Query("sort") sort?: ListModelsQuery["sort"],
    @Query("order") order?: ListModelsQuery["order"],
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ): Promise<Paginated<ModelRecord>> {
    const query: ListModelsQuery = {
      sort,
      order,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    };
    const cacheKey = `models:${JSON.stringify(query)}`;
    const cached = await this.cache.get<Paginated<ModelRecord>>(cacheKey);
    if (cached) return cached;

    const result = await this.repo.listModels(query);
    await this.cache.set(cacheKey, result, 30);
    return result;
  }

  @Get(":id")
  async detail(@Param("id") id: string) {
    const cacheKey = `model:${id}`;
    const cached = await this.cache.get<Record<string, unknown>>(cacheKey);
    if (cached) return cached;

    const detail = await this.repo.getModel(id);
    if (!detail) throw new NotFoundException(`model ${id} not found`);
    await this.cache.set(cacheKey, detail, 60);
    return detail;
  }
}
