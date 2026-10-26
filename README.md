# ModelRank

Monorepo (pnpm + Turborepo) skeleton. 当前仅 hello-world：`apps/web` (Next.js) + `apps/api` (NestJS) + `packages/shared`。

## 启动

```bash
pnpm install           # 安装依赖
pnpm dev               # turbo 同时起 web(3000) + api(3001)
pnpm build             # 生产构建
pnpm lint              # 各包 lint（当前为 stub，待 B/C 接入 ESLint）
pnpm typecheck         # 全仓 tsc --noEmit
```

单 app：`pnpm -F web dev` / `pnpm -F api dev`。

## 端口 & 包引用

- `apps/web` → http://localhost:3000 （Next.js，App Router, React 19）
- `apps/api` → http://localhost:3001 （NestJS，`GET /health` 返回 `{"status":"ok","uptime":...}`）
- `packages/shared` 导出 `HealthStatus` 类型与 `API_PORTS` 常量；web 经 `transpilePackages` 直接消费 TS 源码，api 仅做 type-only import（运行时不打进 bundle）。
- env 示例：`apps/web/.env.local.example`、`apps/api/.env.example`（B/C 自行创建实际 `.env`）。

## 已知坑

- **Next 版本**：当前用 Next 15.5 + React 19（用户原要求 Next 16，未装；如要升级，注意 `transpilePackages` 与 App Router 的兼容，首次 `next dev` 会自动改 `tsconfig.json` 加 `allowJs`）。
- **NestJS 版本**：当前用 NestJS 11 + 装饰器（`emitDecoratorMetadata` / `experimentalDecorators`）。升级到 12 时注意是否切到 SWC 构建器。
- **Turborepo**：v2.x，`turbo.json` 中 `dev` 设为 `persistent: true`，不会被 turbo 缓存。
- **shared 包是 source-only**：不发 dist，靠 Next 打包时 transpile；如未来 api 需要在运行时 import 非 type 内容，需给 shared 加 `tsc` emit 步骤并在 turbo `build` 里 `^build` 先构建 shared。
