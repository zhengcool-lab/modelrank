import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { RepositoryModule } from "./repository/repository.module";
import { CacheModule } from "./cache/cache.module";
import { ModelsController } from "./models/models.controller";
import { NewsController } from "./news/news.controller";
import { MethodologyController } from "./methodology/methodology.controller";
import { CostController } from "./cost/cost.controller";

@Module({
  imports: [CacheModule, RepositoryModule],
  controllers: [
    AppController,
    ModelsController,
    NewsController,
    MethodologyController,
    CostController,
  ],
})
export class AppModule {}
