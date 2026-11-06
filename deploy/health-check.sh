#!/bin/bash
# ModelRank 线上健康巡检脚本
#
# 用法：deploy/health-check.sh           # 完整巡检，输出巡检报告
# 环境变量：MR_BASE（默认线上域名）
#
# 巡检范围：
#   - 页面可达性：首页/模型详情/新闻/对比/成本 各页面 HTTP 状态
#   - 关键资源：product-logos 图标、vendor-logos、sitemap、robots
#   - 数据完整性：seed-data.ts 模型数量、news-data.ts 新闻数量、mock 标记
#   - 性能预算：首页 HTML 体积（gzip 前后）
# 输出：deploy/logs/health-YYYY-MM-DD.txt；非零退出码 = 存在需要修复的问题
set -uo pipefail

BASE="${MR_BASE:-https://modelrank-1br.pages.dev}"
REPO="/Users/zhengyingbo/development/ModelRank"
LOG_DIR="$REPO/deploy/logs"
mkdir -p "$LOG_DIR"
OUT="$LOG_DIR/health-$(date +%Y-%m-%d).txt"
PASS=0; FAIL=0

ck() { # ck <描述> <条件>
  local desc="$1" cond="$2"
  if eval "$cond"; then
    echo "✅ $desc" | tee -a "$OUT"
    PASS=$((PASS+1))
  else
    echo "❌ $desc" | tee -a "$OUT"
    FAIL=$((FAIL+1))
  fi
}

echo "=== ModelRank 健康巡检 $(date '+%Y-%m-%d %H:%M:%S') ===" | tee "$OUT"
echo "目标: $BASE" | tee -a "$OUT"
echo "" | tee -a "$OUT"

# ---- 1. 页面可达性 ----
echo "--- 页面可达性 ---" | tee -a "$OUT"
for path in "/" "/detail/gpt-6-astra" "/detail/gemini-4-carbon" "/news" "/compare" "/cost"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" -m 15 "$BASE$path" 2>/dev/null)
  ck "GET $path → HTTP ${code}" "[ \"${code}\" = \"200\" ]"
done

# ---- 2. 关键资源（动态对齐 MODEL_LOGO/VENDOR_SLUG 映射，新增模型自动纳入巡检） ----
echo "--- 关键资源 ---" | tee -a "$OUT"
# product-logos：从 model-logo.tsx 的 MODEL_LOGO 映射提取文件名（去重）
PRODUCT_LOGO_LIST=$(python3 -c "
import re
t=open('$REPO/apps/web/src/components/model-logo.tsx',encoding='utf-8').read()
m=re.search(r'const MODEL_LOGO.*?\n\};',t,re.S)
names=sorted(set(re.findall(r': \"([^\"\.]+)\.(png|svg)\"',m.group(0))))
for n,e in names:
    print(n+'.'+e)
" 2>/dev/null)
# vendor-logos：VENDOR_SLUG 值 + VENDOR_EXT 扩展名
VENDOR_LOGO_LIST=$(python3 -c "
import re
t=open('$REPO/apps/web/src/components/model-logo.tsx',encoding='utf-8').read()
sb=re.search(r'const VENDOR_SLUG.*?\n\};',t,re.S)
slugs=sorted(set(re.findall(r': \"([a-z0-9]+)\",',sb.group(0))))
eb=re.search(r'const VENDOR_EXT.*?\n\};',t,re.S)
ext=dict(re.findall(r'^  ([a-z0-9]+): \"(png|svg)\",',eb.group(0),re.M))
for s in slugs:
    print(s+'.'+ext.get(s,'svg'))
" 2>/dev/null)
for f in $PRODUCT_LOGO_LIST; do
  code=$(curl -s -o /dev/null -w "%{http_code}" -m 15 "$BASE/product-logos/$f" 2>/dev/null)
  ck "GET /product-logos/$f → HTTP ${code}" "[ \"${code}\" = \"200\" ]"
done
for f in $VENDOR_LOGO_LIST; do
  code=$(curl -s -o /dev/null -w "%{http_code}" -m 15 "$BASE/vendor-logos/$f" 2>/dev/null)
  ck "GET /vendor-logos/$f → HTTP ${code}" "[ \"${code}\" = \"200\" ]"
done
for res in "/sitemap.xml" "/robots.txt"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" -m 15 "$BASE$res" 2>/dev/null)
  ck "GET $res → HTTP ${code}" "[ \"${code}\" = \"200\" ]"
done

# ---- 2b. Agent 产品榜 ----
# 注：页面正文含 "$3.00" 之类字样，不能拼进 eval（会被当变量展开），
# 因此正文断言统一落临时文件后按 pattern 匹配。
echo "--- Agent 产品榜 ---" | tee -a "$OUT"
strip_html() { python3 -c "import sys,re,html; t=sys.stdin.read(); t=re.sub(r'<script.*?</script>|<style.*?</style>','',t,flags=re.S); t=re.sub(r'<[^>]+>',' ',t); print(re.sub(r'\s+',' ',html.unescape(t)))"; }
AGENT_TMP=$(mktemp -d)
trap 'rm -rf "$AGENT_TMP"' EXIT

ckf() { # ckf <描述> <文件> <pattern> [negate]
  local desc="$1" f="$2" pat="$3" neg="${4:-0}" hit=0
  grep -qE -- "$pat" "$f" 2>/dev/null && hit=1
  if { [ "$neg" = "1" ] && [ "$hit" = "0" ]; } || { [ "$neg" = "0" ] && [ "$hit" = "1" ]; }; then
    echo "✅ $desc" | tee -a "$OUT"; PASS=$((PASS+1))
  else
    echo "❌ $desc" | tee -a "$OUT"; FAIL=$((FAIL+1))
  fi
}

for id in claude-code cursor github-copilot devin trae workbuddy chatgpt gemini coze manus; do
  code=$(curl -s -o /dev/null -w "%{http_code}" -m 15 "$BASE/agent/$id" 2>/dev/null)
  ck "GET /agent/$id → HTTP ${code}" "[ \"${code}\" = \"200\" ]"
done

code=$(curl -s -o /dev/null -w "%{http_code}" -m 15 "$BASE/agent/not-exist" 2>/dev/null)
ck "不存在的 agent 返回 404（实际 ${code}）" "[ \"${code}\" = \"404\" ]"

curl -s -m 25 "$BASE/agents" 2>/dev/null | strip_html > "$AGENT_TMP/agents.txt"
ckf "列表页含「可调用强模型」列" "$AGENT_TMP/agents.txt" "可调用强模型"
ckf "列表页含询价档口径说明" "$AGENT_TMP/agents.txt" "询价"
ckf "列表页无旧文案「可调用最强模型」" "$AGENT_TMP/agents.txt" "可调用最强模型" 1

curl -s -m 25 "$BASE/agent/devin" 2>/dev/null | strip_html > "$AGENT_TMP/devin.txt"
ckf "Devin 页 Teams/Enterprise 显示询价（不再显示免费）" "$AGENT_TMP/devin.txt" "询价"
ckf "Devin 页强模型为 Gemini 4 Argon · 50" "$AGENT_TMP/devin.txt" "Gemini 4 Argon *（ *AA 智能指数 50"
ckf "Devin 页无 Argon·60 错配" "$AGENT_TMP/devin.txt" "Gemini 4 Argon *（ *AA 智能指数 60" 1

curl -s -m 25 "$BASE/sitemap.xml" > "$AGENT_TMP/sitemap.xml" 2>/dev/null
ckf "sitemap 指向 pages.dev 域" "$AGENT_TMP/sitemap.xml" "modelrank-1br.pages.dev"
ckf "sitemap 不含旧 workers.dev 域" "$AGENT_TMP/sitemap.xml" "zheng-cool.workers.dev" 1
ckf "sitemap 含 /agents" "$AGENT_TMP/sitemap.xml" "/agents"
ckf "sitemap 含模型详情页" "$AGENT_TMP/sitemap.xml" "/detail/"

curl -s -m 15 "$BASE/robots.txt" > "$AGENT_TMP/robots.txt" 2>/dev/null
ckf "robots.txt 指向 pages.dev 域" "$AGENT_TMP/robots.txt" "modelrank-1br.pages.dev"

curl -s -m 25 "$BASE/methodology" 2>/dev/null | strip_html > "$AGENT_TMP/methodology.txt"
ckf "方法论页含 Agent 榜口径段" "$AGENT_TMP/methodology.txt" "Agent 产品榜口径"

# ---- 3. 数据完整性（本地源码） ----
echo "--- 数据完整性 ---" | tee -a "$OUT"
SEED="$REPO/apps/web/src/lib/seed-data.ts"
NEWS="$REPO/apps/web/src/lib/news-data.ts"
if [ -f "$SEED" ]; then
  n=$(python3 -c "
import re,sys
t=open('$SEED',encoding='utf-8').read()
m=re.search(r'export const UI_MODELS.*?\n\];',t,re.S)
print(len(re.findall(r'^    id: \"',m.group(0),re.M)) if m else 0)
" 2>/dev/null); n="${n:-0}"
  ck "UI_MODELS 模型数量 ≥ 30（实际 ${n}）" "[ \"${n}\" -ge 30 ]"
  # 价格分级应真实分布（AA 每任务成本接入后 high/mid/low 并存，而非全 low）
  hi=$(grep -c 'priceLevel: "high"' "$SEED" 2>/dev/null); hi="${hi:-0}"
  ck "priceLevel 存在 high 级（实际 ${hi} 个，非 0 说明价格分级真实）" "[ \"${hi}\" -gt 0 ]"
  mock_n=$(grep -c 'priceEstimated: true' "$SEED" 2>/dev/null); mock_n="${mock_n:-0}"
  ck "priceEstimated=true 标注 ≤ 模型数（实际 ${mock_n}，属诚实占位标注，非错误）" "[ \"${mock_n}\" -le 40 ]"
else
  ck "seed-data.ts 存在" "false"
fi
if [ -f "$NEWS" ]; then
  m=$(grep -c '"category"' "$NEWS" 2>/dev/null || echo 0)
  ck "news-data.ts 新闻条数 ≥ 10（实际 ${m}）" "[ \"${m}\" -ge 10 ]"
else
  ck "news-data.ts 存在" "false"
fi

# ---- 4. 首页体积（性能预算 < 400KB raw HTML） ----
echo "--- 性能预算 ---" | tee -a "$OUT"
size=$(curl -s -m 20 "$BASE/" 2>/dev/null | wc -c | tr -d ' ')
ck "首页 HTML 体积 < 400000 字节（实际 ${size}）" "[ \"${size}\" -lt 400000 ]"

echo "" | tee -a "$OUT"
echo "=== 巡检结果：通过 $PASS / 失败 $FAIL ===" | tee -a "$OUT"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
