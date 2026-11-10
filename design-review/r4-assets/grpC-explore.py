#!/usr/bin/env python3
"""Group C exploration: dump nav buttons, news filter chips, footer links."""
from playwright.sync_api import sync_playwright

BASE = "https://modelrank-1br.pages.dev"

with sync_playwright() as p:
    b = p.webkit.launch()
    # desktop news
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    pg.goto(f"{BASE}/news", wait_until="load", timeout=45000)
    pg.wait_for_timeout(2500)
    print("--- NEWS 1440 buttons ---")
    for el in pg.query_selector_all("button, a[role], [role='button']"):
        t = (el.inner_text() or "").strip().replace("\n", " ")[:50]
        tag = el.evaluate("e => e.tagName + '|' + (e.getAttribute('aria-label')||'') + '|' + (e.className||'').toString().slice(0,60)")
        if t:
            print(f"  BTN: {t!r}  [{tag}]")
    print("--- NEWS list item first 3 ---")
    items = pg.query_selector_all("article, li")
    for it in items[:3]:
        print("  ITEM:", (it.inner_text() or "").strip().replace("\n", " | ")[:200])
    pg.close()

    # mobile news: hamburger
    pg2 = b.new_page(viewport={"width": 390, "height": 844})
    pg2.goto(f"{BASE}/news", wait_until="load", timeout=45000)
    pg2.wait_for_timeout(2500)
    print("--- NEWS 390 top header buttons ---")
    header = pg2.query_selector("header") or pg2.query_selector("nav")
    if header:
        for el in header.query_selector_all("button, a"):
            t = (el.inner_text() or "").strip().replace("\n", " ")[:40]
            al = el.get_attribute("aria-label") or ""
            print(f"  HDR: {t!r} aria={al!r}")
    b.close()
