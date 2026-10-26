// GET /api/news?category=all
import { Controller, Get, Inject, Query } from "@nestjs/common";
import { REPOSITORY, type IRepository } from "../repository/repository.interface";
import type { NewsRecord } from "../repository/types";

@Controller("news")
export class NewsController {
  constructor(@Inject(REPOSITORY) private readonly repo: IRepository) {}

  @Get()
  async list(@Query("category") category?: string): Promise<NewsRecord[]> {
    return this.repo.listNews(category ?? "all");
  }
}
