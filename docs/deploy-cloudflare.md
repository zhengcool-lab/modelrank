# ModelRank 部署到 Cloudflare Workers（免费层）

## 前置条件

- Cloudflare 账号（免费注册：https://dash.cloudflare.com/sign-up）
- 本机 Node.js ≥ 20、pnpm ≥ 9

## 一键部署

```bash
cd modelrank
pnpm install
cd apps/web
pnpm exec wrangler login        # 浏览器授权一次
pnpm deploy                     # = opennextjs-cloudflare build && wrangler deploy
```

部署成功后会输出一个 `https://modelrank.<your-subdomain>.workers.dev` 网址。

## 免费层配额

| 资源 | 免费额度 |
|---|---|
| Workers 请求 | 10 万次/天 |
| Workers CPU 时间 | 10ms/请求（榜单读多写少够用） |
| 静态资源（R2） | 10 GB 存储 + 100 万次/月读取 |
| CDN 带宽 | 无限 |

## 接真实数据库（可选，后续升级）

当前 MVP 用内存数据（每次冷启动重置）。要持久化：

1. **PostgreSQL**：注册 https://neon.tech 免费层（0.5 GB），拿 connection string
2. **Redis**：注册 https://upstash.com 免费层（10000 命令/天），拿 REST URL
3. 在 `apps/web/wrangler.toml` 加：
   ```toml
   [vars]
   DATABASE_URL = "postgresql://..."
   UPSTASH_REDIS_REST_URL = "https://..."
   UPSTASH_REDIS_REST_TOKEN = "..."
   ```
4. 把 `apps/web/src/lib/repo.ts` 里的内存单例换成 Prisma + @prisma/adapter-neon

## 自定义域名

1. 在 Cloudflare Dashboard → Workers & Pages → modelrank → Settings → Domains
2. 加自定义域名（需要把域名 NS 记录切到 Cloudflare，免费）
3. 国内访问：Cloudflare 免费节点在海外，速度一般；要国内快就得买 Cloudflare China Network（付费）或迁阿里云

## 本地开发

```bash
pnpm dev              # Next.js dev (port 3000)
pnpm --filter @modelrank/web preview:cf   # Cloudflare 模拟 (port 8787)
```
