#!/usr/bin/env python3
"""A组交互态取证：搜索有结果/无结果、首页对比条预置、模型库筛选应用、移动端汉堡菜单。
只用 webkit。截图命名 <名称>__<宽>x<高>__<主题>__<状态>.png"""
import json, sys, time
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path(__file__).resolve().parent
BASE = "https://modelrank-1br.pages.dev"

def shot(page, name, vp, theme, state):
    stem = f"{name}__{vp[0]}x{vp[1]}__{theme}__{state}.png"
    page.screenshot(path=str(OUT / stem), full_page=True)
    print("SHOT", stem, "url=", page.url)

def run(theme, vp, full_page=True):
    pass

def main():
    with sync_playwright() as p:
        bw = p.webkit.launch()

        # 1. 搜索有结果 q=gpt
        for theme, vp in [("light", (1440, 900)), ("light", (390, 844)), ("dark", (390, 844))]:
            ctx = bw.new_context(viewport={"width": vp[0], "height": vp[1]}, device_scale_factor=2 if vp[0] < 768 else 1)
            ctx.add_init_script(f"localStorage.setItem('theme','{theme}')")
            pg = ctx.new_page()
            pg.goto(f"{BASE}/search?q=gpt", wait_until="networkidle")
            time.sleep(1.2)
            shot(pg, "search", vp, theme, "query-gpt")
            ctx.close()

        # 2. 搜索无结果 q=zzzqqqx
        for theme, vp in [("light", (1440, 900)), ("light", (390, 844))]:
            ctx = bw.new_context(viewport={"width": vp[0], "height": vp[1]}, device_scale_factor=2 if vp[0] < 768 else 1)
            ctx.add_init_script(f"localStorage.setItem('theme','{theme}')")
            pg = ctx.new_page()
            pg.goto(f"{BASE}/search?q=zzzqqqx", wait_until="networkidle")
            time.sleep(1.2)
            shot(pg, "search", vp, theme, "noresult-zzzqqqx")
            ctx.close()

        # 3. 首页底部对比条（预置 compare），视口截图（非整页，抓 fixed bar）
        for theme, vp in [("light", (390, 844)), ("dark", (390, 844)), ("light", (1440, 900))]:
            ctx = bw.new_context(viewport={"width": vp[0], "height": vp[1]}, device_scale_factor=2 if vp[0] < 768 else 1)
            ctx.add_init_script(
                f"localStorage.setItem('theme','{theme}');"
                f"localStorage.setItem('modelrank:compare', {json.dumps(json.dumps(['gemini-4-carbon','claude-opus-5-5']))});"
            )
            pg = ctx.new_page()
            pg.goto(f"{BASE}/", wait_until="networkidle")
            time.sleep(1.2)
            stem = f"home__{vp[0]}x{vp[1]}__{theme}__comparebar.png"
            pg.screenshot(path=str(OUT / stem), full_page=False)
            print("SHOT", stem, "url=", pg.url)
            ctx.close()

        # 4. 模型库：点击 Anthropic 厂商筛选 + 清空路径
        ctx = bw.new_context(viewport={"width": 1440, "height": 900})
        ctx.add_init_script("localStorage.setItem('theme','light')")
        pg = ctx.new_page()
        pg.goto(f"{BASE}/library", wait_until="networkidle")
        time.sleep(1.0)
        # 点击 Anthropic chip
        pg.get_by_role("button", name="Anthropic", exact=True).first.click()
        time.sleep(1.2)
        shot(pg, "library", (1440, 900), "light", "filtered-anthropic")
        # 检查页面上是否有“清空”入口
        has_clear = pg.get_by_text("清空", exact=False).count()
        print("CLEAR_ENTRIES", has_clear, "url=", pg.url)
        ctx.close()

        # 5. 移动端汉堡菜单打开态
        ctx = bw.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2)
        ctx.add_init_script("localStorage.setItem('theme','light')")
        pg = ctx.new_page()
        pg.goto(f"{BASE}/", wait_until="networkidle")
        time.sleep(1.0)
        # 直接点击汉堡（aria-label 或菜单图标）
        try:
            pg.locator("button[aria-label*='菜单'], button[aria-label*='menu'], button:has-text('☰')").first.click(timeout=2000)
        except Exception:
            # 回退：nav 最后一个按钮
            pg.locator("nav button").last.click()
        time.sleep(1.0)
        stem = "home__390x844__light__navmenu.png"
        pg.screenshot(path=str(OUT / stem), full_page=False)
        print("SHOT", stem, "url=", pg.url)
        ctx.close()

        bw.close()

if __name__ == "__main__":
    main()
