#!/bin/bash
# ModelRank 统一自动化入口：数据管道 → 前端数据生成 → 构建 → 部署 → git 提交
#
# 用法：
#   deploy/run-all.sh            # 完整数据更新闭环
#   deploy/run-all.sh --no-git  # 跳过 git 提交（巡检/调试用）
#
# 特性：
#   - flock 互斥锁：同一时间只允许一个实例运行，防止并发 wrangler 部署/git 冲突
#   - 失败日志：deploy/logs/audit-YYYY-MM-DD.log（每天一个，供巡检任务检查）
#   - diff 无变化跳过部署：模型/新闻无变化时不重复构建部署
#   - git push 依赖本地代理 127.0.0.1:9090；代理不可用时仅本地 commit 并提示
set -euo pipefail

REPO="/Users/zhengyingbo/development/ModelRank"
LOCK_DIR="$REPO/deploy/.run-lock"
LOG_DIR="$REPO/deploy/logs"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/audit-$(date +%Y-%m-%d).log"
SKIP_GIT="${1:-}"

log() { echo "[$(date '+%F %T')] $*" | tee -a "$LOG"; }

# ---- 互斥锁（macOS 无 flock，用 mkdir 原子锁 + trap 清理） ----
if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  log "⚠️ 另一个 ModelRank 任务正在运行（锁目录存在），本次跳过"
  exit 0
fi
trap 'rmdir "$LOCK_DIR" 2>/dev/null || true' EXIT

log "=== ModelRank 自动化任务开始 ==="

# ---- 1. 数据管道（AA 模型/成本 + 新闻） ----
cd "$REPO/data-pipeline"
log "1/5 运行数据管道 ..."
if ! .venv/bin/python -m pipeline run --dry-run >>"$LOG" 2>&1; then
  log "❌ 数据管道失败，中止（避免用坏数据覆盖生产）"
  exit 1
fi

# 管道全 mock 时中止（防 mock 混入生产）
IS_MOCK=$(python3 -c "import json;d=json.load(open('$REPO/data-pipeline/out/news.json'));print(d.get('is_mock'))" 2>/dev/null || echo "false")
if [ "$IS_MOCK" = "True" ]; then
  log "❌ 管道回退 mock（新闻全失败），中止部署，保留上次线上数据"
  exit 1
fi

# ---- 2. 生成前端数据（UI_MODELS 段 / 新闻 TS） ----
log "2/5 生成前端数据 ..."
.venv/bin/python scripts/gen-ui-models.py --write > /tmp/ui_models_new.txt 2>>"$LOG"
cd "$REPO/apps/web"
node scripts/update-news.mjs >>"$LOG" 2>&1

# ---- 2.5 Agent 产品定价核对（非阻断） ----
# 逐个抓官方定价页，检查「已记录的价位是否仍出现在页面」，核对通过才刷新 priceCheckedAt。
# 抓不到/看不到价格的产品保持原核对日，绝不因为「今天跑过脚本」就把日期改成今天。
log "2.5/5 Agent 产品定价核对 ..."
if ( cd "$REPO/data-pipeline" && .venv/bin/python scripts/check-agent-pricing.py >>"$LOG" 2>&1 ); then
  if ! ( cd "$REPO/data-pipeline" && .venv/bin/python scripts/refresh-agent-price-date.py >>"$LOG" 2>&1 ); then
    log "⚠️ Agent 核对日刷新失败（不影响模型/新闻数据）"
  fi
else
  log "⚠️ Agent 定价核对失败（不阻断，各产品保持上次核对日）"
fi

# ---- 3. 变化检测：模型段已由 --write 写回 seed-data.ts，统一由下方 git diff 判定 ----

# ---- 4. 构建 + 部署（模型/新闻/Agent 核对日有变化时执行） ----
cd "$REPO/apps/web"
if git diff --quiet -- src/lib/seed-data.ts src/lib/news-data.ts src/lib/agent-data.ts; then
  log "3/5 模型/新闻/Agent 核对日均无变化，跳过构建部署"
else
  log "3/5 数据有变化，开始构建 ..."
  if ! pnpm build >>"$LOG" 2>&1; then
    log "❌ 构建失败，中止（不部署坏版本）"
    exit 1
  fi
  if ! pnpm exec next-on-pages >>"$LOG" 2>&1; then
    log "❌ next-on-pages 失败，中止"
    exit 1
  fi
  log "4/5 部署到 Cloudflare Pages ..."
  if ! pnpm exec wrangler pages deploy .vercel/output/static --project-name=modelrank >>"$LOG" 2>&1; then
    log "❌ 部署失败"
    exit 1
  fi
  log "✅ 部署完成 https://modelrank-1br.pages.dev"
fi

# ---- 5. git 提交（尝试推送，代理可用则推） ----
if [ "$SKIP_GIT" = "--no-git" ]; then
  log "5/5 跳过 git 提交（--no-git）"
else
  log "5/5 git 提交 ..."
  cd "$REPO"
  git add -A >>"$LOG" 2>&1
  if ! git diff --cached --quiet; then
    git commit -m "chore: 每日数据更新 $(date '+%Y-%m-%d')" >>"$LOG" 2>&1 || true
    if git -c http.proxy=http://127.0.0.1:9090 -c https.proxy=http://127.0.0.1:9090 push origin main >>"$LOG" 2>&1; then
      log "✅ git push 成功（经代理）"
    else
      log "⚠️ git push 失败（代理 127.0.0.1:9090 可能未开），已本地 commit，待代理可用后补推"
    fi
  else
    log "git 无改动"
  fi
fi

log "=== 任务完成 ✅ ==="
exit 0
