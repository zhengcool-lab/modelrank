import { Global, Module } from "@nestjs/common";
import { CACHE, CacheService } from "./cache.service";

@Global()
@Module({
  providers: [
    CacheService,
    { provide: CACHE, useExisting: CacheService },
  ],
  exports: [CACHE, CacheService],
})
export class CacheModule {}
