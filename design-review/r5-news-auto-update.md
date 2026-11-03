# R5 新闻每日自动更新（2026-11-01）

## 用户需求
新闻页"这个新闻可以每天自动更新吗"——希望新闻每天自动刷新，不再依赖手工写死的静态数据。

## 结论：可以，已实现并上线
项目自带的 `data-pipeline` 新闻抓取器已跑通真实抓取：OpenAI 官方 RSS → 12 条真实新闻（2026-10-28~10-30），标题/摘要/链接/时间全部真实，非 mock。

## 数据链路（真实数据，无写死）
```
每日定时触发
  → data-pipeline/.venv/bin/python -m pipeline run --dry-run   # 抓官方 RSS → out/news.json
  → apps/web/scripts/update-news.mjs                            # 校验非 mock → 生成 src/lib/news-data.ts
  → pnpm build + next-on-pages + wrangler pages deploy          # 自动构建部署上线
```

### 抓取器增强（data-pipeline/pipeline/news.py）
- 数据源：OpenAI news RSS（已验证 200，国内可达）；Anthropic/Google 官方 RSS 在国内不可达（404/超时），已容错跳过；机器之心/36氪无公开 RSS（返回 HTML），不硬凑假数据
- 每条新闻补全字段：`summary`（feed 描述去 HTML 截断）、`source`（来源名）、`time`（RFC822→ISO +08:00）、`category`（标题关键词分类：价格/评测/融资/政策）、`related_model`（标题关键词关联模型名）
- 全部源失败时回退 mock，且生成器检测 `is_mock` 后**跳过覆盖**，保留上次真实数据（杜绝假新闻上线）

### 前端接入（消灭写死数据）
- 新增 `apps/web/scripts/update-news.mjs`：读 out/news.json → 生成 `src/lib/news-data.ts`（导出 UI_NEWS）
- 4 处引用（news 页 / 首页新闻模块 / 搜索页新闻匹配 / derived-data 相关模型反查）全部从 seed-data 切换到 news-data
- 删除 seed-data.ts 里 8 条手写中文新闻（874~955 行）
- 新闻页分类标签动态化：空分类自动隐藏（当前显示"全部 12 / 发布 11 / 政策 1"）

## 每日定时（双保险）
| 载体 | 状态 | 说明 |
|---|---|---|
| 本地 launchd | ✅ 已加载 | `~/Library/LaunchAgents/com.modelrank.daily-news.plist`，每天 08:30 执行 `deploy/daily-news.sh`（抓取→生成→构建→部署，日志 deploy/daily-news.log） |
| GitHub Actions | 📄 模板已就绪 | `.github/workflows/daily-news.yml`，每天 UTC 00:30 云端执行；需在仓库 Secrets 配置 `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` 后启用 |

## 线上验证（headless Chrome 实测 /news）
- 聚合 12 条真实新闻（标题为官方英文原文，来源标注 OpenAI，相对时间 1天前/2天前/3天前）
- 分类标签动态：全部 12 / 发布 11 / 政策 1（空分类已隐藏）
- 卡片含真实摘要、阅读原文链接；"加载更多（剩余4条）"正常
- 截图：design-review/r5-news-online.png

## 部署
预览 https://99c65fdf.modelrank-1br.pages.dev （生产域名 modelrank-1br.pages.dev 已同步）

## 已知限制
- 当前真实数据源为 OpenAI 官方（国内网络下唯一可达的官方源）；Anthropic/Google 官方 RSS 在国内环境不可达，待网络条件或增加国内官方源（如 DeepSeek/通义官网动态）后扩充
- 标题保留英文原文（官方博客原文，真实可追溯）；如需中文标题，可后续加机翻或接中文媒体源
