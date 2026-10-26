import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // MVP 阶段不需要 R2/KV 缓存，直接 edge runtime
  r2Bucket: undefined,
});
