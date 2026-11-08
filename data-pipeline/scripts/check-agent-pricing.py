#!/usr/bin/env python3
"""Agent 产品定价页每日核对（三级降级）。

目的：Agent 榜的套餐价格是逐条核对官网得来的手写数据（priceCheckedAt），如果长期
不核对就会悄悄过期。这个脚本每天走一遍各产品的「官方数据源页」，检查「我们记录的
价格数字是否仍然出现在页面上」，只在确认仍在售时把核对日刷成今天。

抓取走三级降级，每一级都可失败、可关闭：

  1) direct   httpx 直连（trust_env=False，不吃环境代理）
  2) proxy    httpx 走本地代理（默认 http://127.0.0.1:9090，AGENT_PRICING_PROXY 可改）
              实测收益：只有 gemini 这类被墙站点能从「连接超时」变成 200
  3) browser  真浏览器渲染（render-page.py），只在上面两级都拿不到时启用
              AGENT_PRICING_BROWSER=0 可整体关闭；缺 playwright / 缺 Chrome 时自动跳过

判定（与升级前的四态一致）：

  verified     页面可访问，且命中 ≥50% 已记录付费档 → priceCheckedAt 刷成今天
  weak         有命中但覆盖率 <50%                   → 保持原核对日
  unverified   页面可访问但一个价位都没命中           → 保持原核对日
  unreachable  403 / 超时 / 正文过短（拦截页）        → 保持原核对日

关键原则：只做「是否还认得出来」的核对，绝不从页面抽取数字回写数据。页面上混着年付
折算价、token 单价、其它产品价格，自动抽取一定会写错。跟不上就诚实标 unverified。
"""
from __future__ import annotations

import concurrent.futures
import datetime as dt
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

import httpx

REPO = Path(__file__).resolve().parents[2]
AGENT_TS = REPO / "apps/web/src/lib/agent-data.ts"
OUT_DIR = REPO / "data-pipeline/out"
REPORT = OUT_DIR / "agent_pricing_report.json"
RENDER = Path(__file__).resolve().parent / "render-page.py"

UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/131.0 Safari/537.36 ModelRankBot/0.1"
)

DEFAULT_PROXY = "http://127.0.0.1:9090"
MIN_TEXT = 200  # 低于这个字数基本是拦截页 / 空壳

# 核对目标：优先官方定价页；定价页抓不到（403 / 纯 JS / 已 404）的产品，改用我们
# 记录数据时实际依据的官方文档、帮助中心或官方博客页——口径与数据来源保持一致。
PAGES: dict[str, str] = {
    "claude-code": "https://claude.com/pricing",
    "cursor": "https://cursor.com/pricing",
    "github-copilot": "https://github.com/features/copilot/plans",
    "devin": "https://devin.ai/pricing",
    "trae": "https://www.trae.cn/pricing",
    "workbuddy": "https://www.workbuddy.cn/pricing/",
    "chatgpt": "https://help.openai.com/zh-hans-cn/articles/9793128-about-chatgpt-pro-tiers",
    "codex": "https://developers.openai.com/codex/pricing",
    "gemini": "https://one.google.com/about/google-ai-plans/",
    "coze": "https://docs.coze.cn/guides/edition",
    "manus": "https://help.manus.im/zh-CN/articles/11711111-manus-%E7%9B%AE%E5%89%8D%E7%9A%84%E4%BC%9A%E5%91%98%E5%AE%9A%E4%BB%B7%E6%98%AF%E5%A4%9A%E5%B0%91",
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


# ---------------------------------------------------------------- 三级抓取


def _proxy_url() -> str | None:
    raw = os.environ.get("AGENT_PRICING_PROXY", DEFAULT_PROXY).strip()
    return None if raw in ("", "0", "off", "none") else raw


def _browser_py() -> str | None:
    """找一个装了 playwright 的解释器；找不到就说明浏览器级不可用。"""
    if os.environ.get("AGENT_PRICING_BROWSER", "1").strip() in ("0", "off", "false"):
        return None
    if not RENDER.exists():
        return None
    candidates = [
        os.environ.get("AGENT_PRICING_BROWSER_PY"),
        sys.executable,  # 优先当前解释器：playwright 装在本 venv 里最稳
        shutil.which("python3"),
        "/usr/bin/python3",
        "/opt/homebrew/bin/python3",
    ]
    for cand in candidates:
        if not cand or not os.path.exists(cand):
            continue
        try:
            r = subprocess.run([cand, "-c", "import playwright"], capture_output=True, timeout=20)
        except Exception:  # noqa: BLE001
            continue
        if r.returncode == 0:
            return cand
    return None


def _plain(html: str) -> str:
    html = re.sub(r"<script[\s\S]*?</script>", " ", html)
    html = re.sub(r"<style[\s\S]*?</style>", " ", html)
    text = re.sub(r"<[^>]+>", " ", html)
    return re.sub(r"\s+", " ", text)


def fetch(tier: str, url: str, proxy: str | None, browser_py: str | None) -> tuple[str, str]:
    """返回 (纯文本, 说明)。失败抛异常，由调用方降级。"""
    if tier == "browser":
        if not browser_py:
            raise RuntimeError("browser tier unavailable")
        cmd = [browser_py, str(RENDER), url]
        if proxy:
            cmd += ["--proxy", proxy]
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=90)
        if r.returncode != 0:
            raise RuntimeError(f"render failed: {r.stdout.strip()[:80]}")
        return r.stdout, "浏览器渲染"

    kw = {"proxy": proxy} if tier == "proxy" else {}
    with httpx.Client(timeout=httpx.Timeout(25.0, connect=8.0), follow_redirects=True,
                      headers={"User-Agent": UA, "Accept": "text/html,*/*;q=0.8"},
                      trust_env=False, **kw) as client:
        resp = client.get(url)
    if resp.status_code != 200:
        raise RuntimeError(f"HTTP {resp.status_code}")
    return _plain(resp.text), ("本地代理" if tier == "proxy" else "直连")


# ---------------------------------------------------------------- 核对


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


def _money_in(text: str, currency: str) -> set[float]:
    found: set[float] = set()
    if currency == "USD":
        pat = r"\$\s?([0-9][0-9,]*(?:\.[0-9]+)?)"
        for x in re.findall(pat, text):
            found.add(float(x.replace(",", "")))
    else:
        # 国内页面的价格既可能是「¥49」也可能是「49元」或「39.9 元/月」，两种都要认
        for x in re.findall(r"[¥￥]\s?([0-9][0-9,]*(?:\.[0-9]+)?)", text):
            found.add(float(x.replace(",", "")))
        for x in re.findall(r"([0-9][0-9,]*(?:\.[0-9]+)?)\s*元", text):
            found.add(float(x.replace(",", "")))
    return found


def _near(p: float, values: list[float], tol: float = 0.01) -> float | None:
    """先精确匹配，再容忍 1% 内的舍入差（199.99 与 200 视为同一价位）。"""
    if p in values:
        return p
    for v in values:
        if p and abs(v - p) / abs(p) <= tol:
            return v
    return None


def evaluate(text: str, spec: dict) -> dict:
    """把一段页面文本判成 verified / weak / unverified。"""
    expected = spec["prices"]
    page_money = _money_in(text, spec["currency"])
    matched, near = [], []
    for p in expected:
        v = _near(p, page_money)
        if v is None:
            continue
        matched.append(p)
        if v != p:
            near.append(f"{p}≈{v}")
    coverage = round(len(matched) / len(expected), 2) if expected else 0.0
    tail = f"（舍入差视为同一价位：{'、'.join(near)}）" if near else ""
    if matched and coverage >= 0.5:
        return {"status": "verified", "coverage": coverage, "matched": matched,
                "reason": f"页面仍列出 {len(matched)}/{len(expected)} 个已记录价位{tail}"}
    if matched:
        return {"status": "weak", "coverage": coverage, "matched": matched,
                "reason": f"仅 {len(matched)}/{len(expected)} 个价位可见，覆盖率不足 50%，不刷新核对日{tail}"}
    return {"status": "unverified", "coverage": 0.0, "matched": [],
            "reason": f"页面未出现任何已记录价位（页内{spec['currency']}数字{len(page_money)}个）"}


def check_one(pid: str, spec: dict, proxy: str | None, browser_py: str | None) -> dict:
    url = PAGES.get(pid)
    if not url:
        return {"status": "no_url", "reason": "未配置官方数据源页", "matched": [], "tier": None,
                "coverage": 0.0, "attempts": [], "checkedAt": None}

    tiers = ["direct"] + (["proxy"] if proxy else []) + (["browser"] if browser_py else [])
    attempts: list[dict] = []
    best: dict | None = None

    for tier in tiers:
        try:
            text, note = fetch(tier, url, proxy, browser_py)
        except Exception as e:  # noqa: BLE001 — 单级失败只是降级，不是错误
            attempts.append({"tier": tier, "ok": False, "note": f"{type(e).__name__}: {e}"})
            continue
        if len(text) < MIN_TEXT:
            attempts.append({"tier": tier, "ok": False, "note": f"正文过短({len(text)}字)，疑似拦截页"})
            continue
        res = evaluate(text, spec)
        res.update({"tier": tier, "tier_note": note, "chars": len(text)})
        attempts.append({"tier": tier, "ok": True, "status": res["status"],
                         "coverage": res["coverage"], "chars": len(text)})
        if best is None or res["coverage"] > best["coverage"]:
            best = res
        if res["status"] == "verified":
            break  # 已确认，不必再上更重的通道

    if best is None:
        tail = attempts[-1]["note"] if attempts else "无可用通道"
        return {"status": "unreachable", "reason": tail, "matched": [], "tier": None,
                "coverage": 0.0, "attempts": attempts, "checkedAt": None}

    best["attempts"] = attempts
    best["checkedAt"] = dt.date.today().isoformat() if best["status"] == "verified" else None
    return best


def main() -> int:
    if not AGENT_TS.exists():
        print(f"❌ 找不到 {AGENT_TS}", flush=True)
        return 1
    products = parse_products()
    if len(products) < 10:
        print(f"❌ 只解析到 {len(products)} 个产品，解析规则可能失效", flush=True)
        return 1

    proxy = _proxy_url()
    browser_py = _browser_py()
    print(f"通道：直连{' + 代理(' + proxy + ')' if proxy else ''}"
          f"{' + 浏览器(' + Path(browser_py).name + ')' if browser_py else ''}", flush=True)
    if not proxy:
        print("  代理级已关闭（AGENT_PRICING_PROXY=off）", flush=True)
    if not browser_py:
        print("  浏览器级不可用（无 playwright 或 AGENT_PRICING_BROWSER=0），将停在代理级", flush=True)

    results: dict[str, dict] = {}

    # 浏览器要起 Chrome，并发压到 2，避免多实例互相挤爆
    def run(pid: str) -> dict:
        return check_one(pid, products[pid], proxy, browser_py)

    with concurrent.futures.ThreadPoolExecutor(6) as ex:
        futures = {ex.submit(run, pid): pid for pid in products}
        for f in concurrent.futures.as_completed(futures):
            pid = futures[f]
            results[pid] = f.result()

    order = list(products)
    summary: dict[str, int] = {}
    for pid in order:
        summary[results[pid]["status"]] = summary.get(results[pid]["status"], 0) + 1
    by_tier: dict[str, int] = {}
    for pid in order:
        t = results[pid].get("tier")
        if t:
            by_tier[t] = by_tier.get(t, 0) + 1

    report = {
        "generated_at": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "channels": {"direct": True, "proxy": proxy, "browser": bool(browser_py)},
        "products": {pid: {**results[pid], "url": PAGES.get(pid),
                           "currency": products[pid]["currency"],
                           "recorded_prices": products[pid]["prices"]} for pid in order},
        "summary": summary,
        "verified_by_tier": by_tier,
    }
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    icons = {"verified": "✅", "weak": "🟡", "unverified": "⚠️", "unreachable": "❌", "no_url": "·"}
    for pid in order:
        r = results[pid]
        tier = f"[{r.get('tier')}]" if r.get("tier") else ""
        print(f"{icons[r['status']]} {pid:15s} {r['status']:11s} {tier:10s} {r['reason']}")
    print(f"\n核对汇总：verified {summary.get('verified',0)} / weak {summary.get('weak',0)} / "
          f"unverified {summary.get('unverified',0)} / unreachable {summary.get('unreachable',0)}")
    if by_tier:
        print("通过通道：" + "，".join(f"{k} {v} 家" for k, v in sorted(by_tier.items())))
    print(f"报告已写入 {REPORT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
