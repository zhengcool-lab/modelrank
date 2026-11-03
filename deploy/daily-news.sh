#!/bin/bash
# ModelRank 每日新闻自动更新（本地定时任务入口）
# 流程：抓取真实新闻 → 生成前端数据 → 构建 → 部署 Cloudflare Pages
# 由 launchd（com.modelrank.daily-news）每天 08:30 调用，日志见同目录 daily-news.log
set -euo pipefail

ROOT="/Users/zhengyingbo/development/ModelRank"
LOG_DIR="$ROOT/deploy"
mkdir -p "$LOG_DIR"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

log "=== 开始每日新闻更新 ==="

# 1) 抓取真实新闻（失败回退 mock 时 update-news.mjs 会跳过覆盖）
log "1/4 抓取新闻源 ..."
cd "$ROOT/data-pipeline"
.venv/bin/python -m pipeline run --dry-run >> "$LOG_DIR/daily-news.log" 2>&1 \
  || { log "管道执行失败，跳过本次更新"; exit 1; }

# 2) 生成前端数据 news-data.ts
log "2/4 生成前端数据 ..."
cd "$ROOT/apps/web"
node scripts/update-news.mjs

# 3) 构建
log "3/4 构建 ..."
pnpm build > /tmp/mr-daily-build.log 2>&1
pnpm exec next-on-pages > /tmp/mr-daily-onp.log 2>&1

# 4) 部署
log "4/4 部署 Cloudflare Pages ..."
DEPLOY_OUT=$(pnpm exec wrangler pages deploy .vercel/output/static --project-name=modelrank 2>&1)
echo "$DEPLOY_OUT" >> "$LOG_DIR/daily-news.log"
URL=$(echo "$DEPLOY_OUT" | grep -oE 'https://[a-z0-9]+\.modelrank-1br\.pages\.dev' | tail -1)
log "部署完成: ${URL:-（未解析到预览地址，请查看 daily-news.log）}"

log "=== 每日新闻更新结束 ==="
