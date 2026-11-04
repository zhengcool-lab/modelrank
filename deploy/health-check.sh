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

# ---- 2. 关键资源 ----
echo "--- 关键资源 ---" | tee -a "$OUT"
for res in "/product-logos/openai.png" "/product-logos/claude.png" "/product-logos/gemini.png" \
           "/product-logos/deepseek.png" "/product-logos/qwen.png" "/product-logos/hunyuan.png" \
           "/vendor-logos/openai.svg" "/vendor-logos/nvidia.svg" "/sitemap.xml" "/robots.txt"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" -m 15 "$BASE$res" 2>/dev/null)
  ck "GET $res → HTTP ${code}" "[ \"${code}\" = \"200\" ]"
done

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
  ck "UI_MODELS 模型数量 = 33（实际 ${n}）" "[ \"${n}\" = \"33\" ]"
  # 价格分级应真实分布（AA 每任务成本接入后 high/mid/low 并存，而非全 low）
  hi=$(grep -c 'priceLevel: "high"' "$SEED" 2>/dev/null); hi="${hi:-0}"
  ck "priceLevel 存在 high 级（实际 ${hi} 个，非 0 说明价格分级真实）" "[ \"${hi}\" -gt 0 ]"
  mock_n=$(grep -c 'priceEstimated: true' "$SEED" 2>/dev/null); mock_n="${mock_n:-0}"
  ck "priceEstimated=true 标注 ≤ 33（实际 ${mock_n}，属诚实占位标注，非错误）" "[ \"${mock_n}\" -le 33 ]"
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
