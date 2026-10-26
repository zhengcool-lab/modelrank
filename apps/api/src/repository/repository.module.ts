// 根据 DATABASE_URL 自动选择 PrismaRepository 或 InMemoryRepository。
// 本地无 PG 时，process.env.DATABASE_URL 为空，自动 fallback。
import { Module } from "@nestjs/common";
import { REPOSITORY, type IRepository } from "./repository.interface";
import { InMemoryRepository } from "./in-memory.repository";
import { PrismaRepository } from "./prisma.repository";

const repositoryProvider = {
  provide: REPOSITORY,
  useFactory: (): IRepository => {
    if (process.env.DATABASE_URL) {
      // eslint-disable-next-line no-console
      console.log("[repo] DATABASE_URL detected, using PrismaRepository (PostgreSQL)");
      return new PrismaRepository();
    }
    // eslint-disable-next-line no-console
    console.log("[repo] DATABASE_URL not set, using InMemoryRepository fallback");
    return new InMemoryRepository();
  },
};

// 注意：PrismaRepository 不注册进 providers，避免 NestJS 实例化它并触发 onModuleInit
// 去连真 PG。需要时由上面的 useFactory 通过 new PrismaRepository() 手动构造。
@Module({
  providers: [repositoryProvider, InMemoryRepository],
  exports: [REPOSITORY],
})
export class RepositoryModule {}
