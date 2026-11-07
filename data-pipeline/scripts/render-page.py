#!/usr/bin/env python3
"""用真浏览器把页面渲染成纯文本，供定价核对兜底。

只在 httpx（直连/代理）拿不到有效内容时才会被调用。脚本本身没有任何主机依赖：
Chrome 路径、是否带代理都由调用方传；跑不起来就以非 0 退出，调用方据此降级成
「unverified」，不会中断每日闭环。

用法：
    python3 render-page.py <url> [--proxy http://127.0.0.1:9090] [--wait 3500]
"""
from __future__ import annotations

import argparse
import os

CHROME = os.environ.get(
    "AGENT_PRICING_CHROME",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("url")
    ap.add_argument("--proxy", default=None)
    ap.add_argument("--wait", type=int, default=3500)
    ap.add_argument("--timeout", type=int, default=30000)
    args = ap.parse_args()

    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("playwright not installed in this interpreter", flush=True)
        return 2
    if not os.path.exists(CHROME):
        print(f"chrome not found: {CHROME}", flush=True)
        return 2

    try:
        with sync_playwright() as p:
            kw = {"executable_path": CHROME}
            if args.proxy:
                kw["proxy"] = {"server": args.proxy}
            browser = p.chromium.launch(**kw)
            page = browser.new_page(viewport={"width": 1366, "height": 900})
            page.goto(args.url, wait_until="domcontentloaded", timeout=args.timeout)
            page.wait_for_timeout(args.wait)
            print(page.inner_text("body"), flush=True)
            browser.close()
        return 0
    except Exception as e:  # noqa: BLE001 — 渲染失败必须能被调用方识别
        print(f"{type(e).__name__}: {e}", flush=True)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
