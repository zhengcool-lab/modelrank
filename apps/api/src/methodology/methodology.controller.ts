// GET /api/methodology/benchmarks
import { Controller, Get, Inject } from "@nestjs/common";
import { REPOSITORY, type IRepository } from "../repository/repository.interface";
import type { BenchmarkRecord } from "../repository/types";

@Controller("methodology/benchmarks")
export class MethodologyController {
  constructor(@Inject(REPOSITORY) private readonly repo: IRepository) {}

  @Get()
  async list(): Promise<{ benchmarks: BenchmarkRecord[]; total: number }> {
    const benchmarks = await this.repo.listBenchmarks();
    return { benchmarks, total: benchmarks.length };
  }
}
