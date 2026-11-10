#!/usr/bin/env python3
"""Group C interaction shots: news category filter state + mobile hamburger open."""
from playwright.sync_api import sync_playwright

BASE = "https://modelrank-1br.pages.dev"
OUT = "/Users/zhengyingbo/development/ModelRank/design-review/r4-assets"

def init(theme):
    return "(() => { localStorage.setItem('theme', '%s'); })" % theme

with sync_playwright() as p:
    b = p.webkit.launch()

    # 1) news-filter 1440 light: click 发布 chip
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    pg.add_init_script(init("light"))
    pg.goto(f"{BASE}/news", wait_until="load", timeout=45000)
    pg.wait_for_timeout(2000)
    chip = pg.get_by_role("button", name="发布", exact=False)
    chip.first.click()
    pg.wait_for_timeout(1200)
    pg.evaluate("window.scrollTo(0, 0)")
    pg.wait_for_timeout(500)
    pg.screenshot(path=f"{OUT}/news-filter__1440x900__light.png", full_page=True)
    print("shot news-filter 1440 done")
    # record selected chip visual state + count of items
    active = pg.evaluate("""() => {
        const btns = [...document.querySelectorAll('button')].slice(0,10);
        return btns.filter(x=>/全部|发布|评测|融资/.test(x.innerText)).map(x=>({t:x.innerText.trim(), cls:(x.className||'').toString().slice(0,100)}));
    }""")
    print("chips:", active)
    pg.close()

    # 2) news-filter 390 light: click 评测 chip (small category, check empty-ish state)
    pg2 = b.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
    pg2.add_init_script(init("light"))
    pg2.goto(f"{BASE}/news", wait_until="load", timeout=45000)
    pg2.wait_for_timeout(2000)
    pg2.get_by_role("button", name="评测", exact=False).first.click()
    pg2.wait_for_timeout(1000)
    pg2.screenshot(path=f"{OUT}/news-filter__390x844__light.png", full_page=True)
    print("shot news-filter 390 done")
    pg2.close()

    # 3) news 390 dark hamburger open
    pg3 = b.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
    pg3.add_init_script(init("dark"))
    pg3.goto(f"{BASE}/news", wait_until="load", timeout=45000)
    pg3.wait_for_timeout(2000)
    print("theme class:", pg3.evaluate("document.documentElement.className"))
    ham = pg3.get_by_role("button", name="打开菜单")
    ham.click()
    pg3.wait_for_timeout(900)
    pg3.screenshot(path=f"{OUT}/news__390x844__dark__hamburger-open.png", full_page=False)
    print("shot news hamburger open dark done")
    menu_text = pg3.evaluate("""() => {
        const vis = e => { const r=e.getBoundingClientRect(); const s=getComputedStyle(e); return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'; };
        return [...document.querySelectorAll('a,button')].filter(vis).map(e=>(e.innerText||e.getAttribute('aria-label')||'').trim().replace(/\\n/g,' ')).filter(t=>t).slice(0,40);
    }""")
    print("menu items:", menu_text)
    # close path: press Escape then shot
    pg3.keyboard.press("Escape")
    pg3.wait_for_timeout(600)
    visible_after_close = pg3.evaluate("""() => {
        const vis = e => { const r=e.getBoundingClientRect(); const s=getComputedStyle(e); return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'; };
        return [...document.querySelectorAll('a,button')].filter(vis).map(e=>(e.innerText||'').trim()).filter(t=>/榜单|Agent|模型库|对比|成本|方法论|新闻|搜索/.test(t)).length;
    }""")
    print("nav items visible after Escape:", visible_after_close)
    pg3.screenshot(path=f"{OUT}/news__390x844__dark__hamburger-closed.png", full_page=False)
    pg3.close()

    # 4) news 390 light hamburger open
    pg4 = b.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
    pg4.add_init_script(init("light"))
    pg4.goto(f"{BASE}/news", wait_until="load", timeout=45000)
    pg4.wait_for_timeout(2000)
    pg4.get_by_role("button", name="打开菜单").click()
    pg4.wait_for_timeout(800)
    pg4.screenshot(path=f"{OUT}/news__390x844__light__hamburger-open.png", full_page=False)
    print("shot news hamburger open light done")
    pg4.close()

    b.close()
print("ALL DONE")
