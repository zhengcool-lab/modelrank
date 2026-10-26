// 缓存层：有 REDIS_URL 用 ioredis，否则用进程内 Map。
// 统一 get/set/del 三个方法，controller 不感知后端。
import { Injectable, OnModuleInit } from "@nestjs/common";
import Redis from "ioredis";

export const CACHE = Symbol("CACHE");

export interface ICache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
}

@Injectable()
export class CacheService implements ICache, OnModuleInit {
  private redis: Redis | null = null;
  private memory = new Map<string, { value: unknown; expireAt: number }>();

  async onModuleInit(): Promise<void> {
    const url = process.env.REDIS_URL;
    if (url) {
      this.redis = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 2 });
      await this.redis.connect();
      // eslint-disable-next-line no-console
      console.log("[cache] connected to redis:", url.replace(/:\/\/.*@/, "://***@"));
    } else {
      // eslint-disable-next-line no-console
      console.log("[cache] REDIS_URL not set, using in-memory map fallback");
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.redis) {
      const raw = await this.redis.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    }
    const hit = this.memory.get(key);
    if (!hit) return null;
    if (hit.expireAt && hit.expireAt < Date.now()) {
      this.memory.delete(key);
      return null;
    }
    return hit.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds = 60): Promise<void> {
    if (this.redis) {
      await this.redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
      return;
    }
    this.memory.set(key, {
      value,
      expireAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async del(key: string): Promise<void> {
    if (this.redis) {
      await this.redis.del(key);
      return;
    }
    this.memory.delete(key);
  }
}
