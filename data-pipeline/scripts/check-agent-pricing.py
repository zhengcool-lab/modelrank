#!/usr/bin/env python3
"""Agent 产品定价页每日核对。

目的：Agent 榜的套餐价格是逐条核对官网得来的手写数据（priceCheckedAt），如果长期
不核对就会悄悄过期。这个脚本每天抓一遍各产品官方定价页，检查「我们记录的价格数字
是否仍然出现在页面上」：

  verified     页面可访问，且至少一个已记录的付费档价格能在页面文本里找到
               → 说明官网仍在售同样价位的套餐，可以把 priceCheckedAt 刷成今天
  unverified   页面可访问，但一个已记录的价格都没找到（多为纯 JS 渲染，SSR 文本里没价格）
               → 不做任何判断，保持原核对日，等人工复核
  unreachable  403 / 超时 / 4xx 5xx
               → 同上，保持原核对日

关键原则：只做「是否还认得出来」的核对，绝不从页面抽取数字回写数据。页面上混着年付
折算价、token 单价、其他产品价格，自动抽取一定会写错。跟不上就诚实标 unverified，
不用猜测代替核对。
"""
from __future__ import annotations

import concurrent.futures
import datetime as dt
import json
import re
from pathlib import Path

import httpx

REPO = Path(__file__).resolve().parents[2]
AGENT_TS = REPO / "apps/web/src/lib/agent-data.ts"
OUT_DIR = REPO / "data-pipeline/out"
REPORT = OUT_DIR / "agent_pricing_report.json"

UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/131.0 Safari/537.36 ModelRankBot/0.1"
)

# 官方定价页。国内产品用国内站（价格以 CNY 计），海外产品用海外站。
PAGES: dict[str, str] = {
    "claude-code": "https://claude.com/pricing",
    "cursor": "https://cursor.com/pricing",
    "github-copilot": "https://github.com/features/copilot/plans",
    "devin": "https://devin.ai/pricing",
    "trae": "https://www.trae.cn/pricing",
    "workbuddy": "https://www.workbuddy.cn/pricing",
    "chatgpt": "https://openai.com/chatgpt/pricing/",
    "gemini": "https://gemini.google/subscriptions/",
    "coze": "https://www.coze.cn/pricing",
    "manus": "https://manus.im/pricing",
    "claude": "https://claude.com/pricing",
    "windsurf": "https://windsurf.com/pricing",
    "kiro": "https://kiro.dev/pricing",
    "augment": "https://www.augmentcode.com/pricing",
    "replit": "https://replit.com/pricing",
    "bolt": "https://bolt.new/pricing",
    "v0": "https://v0.app/pricing",
    "warp": "https://www.warp.dev/pricing",
    "zed": "https://zed.dev/pricing",
    "notion": "https://www.notion.com/pricing",
}


def parse_products() -> dict[str, dict]:
    """从 agent-data.ts 里取出每个产品的币种与已记录的付费档月价。

    只做正则级解析——这里是自家源码，结构稳定；不引入 TS 解析器。
    """
    src = AGENT_TS.read_text(encoding="utf-8")
    starts = [(m.start(), m.group(1)) for m in re.finditer(r'\n\s{2}\{\s*\n\s{4}id:\s*"([a-z0-9-]+)"', src)]
    products: dict[str, dict] = {}
    for i, (pos, pid) in enumerate(starts):
        end = starts[i + 1][0] if i + 1 < len(starts) else len(src)
        block = src[pos:end]
        currency = "CNY" if re.search(r'currency:\s*"CNY"', block) else "USD"
        prices = []
        for m in re.finditer(r"monthly:\s*([0-9]+(?:\.[0-9]+)?)", block):
            v = float(m.group(1))
            if v > 0:
                prices.append(v)
        for m in re.finditer(r"promo:\s*([0-9]+(?:\.[0-9]+)?)", block):
            v = float(m.group(1))
            if v > 0:
                prices.append(v)
        products[pid] = {"currency": currency, "prices": sorted(set(prices))}
    return products


def _plain(html: str) -> str:
    html = re.sub(r"<script[\s\S]*?</script>", " ", html)
    html = re.sub(r"<style[\s\S]*?</style>", " ", html)
    text = re.sub(r"<[^>]+>", " ", html)
    return re.sub(r"\s+", " ", text)


def _money_in(text: str, currency: str) -> set[float]:
    pat = r"\$\s?([0-9][0-9,]*(?:\.[0-9]+)?)" if currency == "USD" else r"[¥￥]\s?([0-9][0-9,]*(?:\.[0-9]+)?)"
    return {float(x.replace(",", "")) for x in re.findall(pat, text)}


def check_one(pid: str, spec: dict) -> dict:
    url = PAGES.get(pid)
    if not url:
        return {"status": "no_url", "reason": "未配置官方定价页", "matched": [], "checkedAt": None}
    try:
        with httpx.Client(timeout=httpx.Timeout(25.0, connect=8.0), follow_redirects=True,
                          headers={"User-Agent": UA, "Accept": "text/html,*/*;q=0.8"},
                          trust_env=True) as client:
            r = client.get(url)
        if r.status_code != 200:
            return {"status": "unreachable", "reason": f"HTTP {r.status_code}", "matched": [], "checkedAt": None}
        text = _plain(r.text)
        if len(text) < 200:
            return {"status": "unreachable", "reason": f"正文过短({len(text)}字)，疑似拦截页", "matched": [], "checkedAt": None}
        page_money = _money_in(text, spec["currency"])
        expected = [p for p in spec["prices"]]
        matched = [p for p in expected if p in page_money]
        coverage = round(len(matched) / len(expected), 2) if expected else 0.0
        if matched and coverage >= 0.5:
            return {"status": "verified", "coverage": coverage,
                    "reason": f"页面仍列出 {len(matched)}/{len(expected)} 个已记录价位",
                    "matched": matched, "checkedAt": dt.date.today().isoformat()}
        if matched:
            # 只验证到少数价位（其余档位在 JS 里），不足以断言整表未变
            return {"status": "weak", "coverage": coverage,
                    "reason": f"仅 {len(matched)}/{len(expected)} 个价位可见，覆盖率不足 50%，不刷新核对日",
                    "matched": matched, "checkedAt": None}
        return {"status": "unverified", "reason": f"页面未出现任何已记录价位（页内{spec['currency']}数字{len(page_money)}个，多为JS渲染）",
                "matched": [], "checkedAt": None}
    except Exception as e:  # noqa: BLE001 — 核对失败不该中断每日闭环
        return {"status": "unreachable", "reason": f"{type(e).__name__}: {e}", "matched": [], "checkedAt": None}


def main() -> int:
    if not AGENT_TS.exists():
        print(f"❌ 找不到 {AGENT_TS}", flush=True)
        return 1
    products = parse_products()
    if len(products) < 10:
        print(f"❌ 只解析到 {len(products)} 个产品，解析规则可能失效", flush=True)
        return 1

    results: dict[str, dict] = {}
    with concurrent.futures.ThreadPoolExecutor(8) as ex:
        futures = {ex.submit(check_one, pid, spec): pid for pid, spec in products.items()}
        for f in concurrent.futures.as_completed(futures):
            pid = futures[f]
            results[pid] = f.result()

    order = [pid for pid in products]
    summary = {"verified": 0, "weak": 0, "unverified": 0, "unreachable": 0, "no_url": 0}
    for pid in order:
        summary[results[pid]["status"]] = summary.get(results[pid]["status"], 0) + 1

    report = {
        "generated_at": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "products": {pid: {**results[pid], "url": PAGES.get(pid), "currency": products[pid]["currency"],
                           "recorded_prices": products[pid]["prices"]} for pid in order},
        "summary": summary,
    }
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    for pid in order:
        r = results[pid]
        icon = {"verified": "✅", "weak": "🟡", "unverified": "⚠️", "unreachable": "❌", "no_url": "·"}[r["status"]]
        print(f"{icon} {pid:15s} {r['status']:11s} {r['reason']}")
    print(f"\n核对汇总：verified {summary.get('verified',0)} / weak {summary.get('weak',0)} / "
          f"unverified {summary.get('unverified',0)} / unreachable {summary.get('unreachable',0)}")
    print(f"报告已写入 {REPORT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
