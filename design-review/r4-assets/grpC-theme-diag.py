#!/usr/bin/env python3
from playwright.sync_api import sync_playwright

BASE = "https://modelrank-1br.pages.dev"

with sync_playwright() as p:
    b = p.webkit.launch()
    pg = b.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
    pg.add_init_script("() => { localStorage.setItem('theme', 'dark'); }")
    pg.goto(f"{BASE}/news", wait_until="load", timeout=45000)
    pg.wait_for_timeout(2000)
    info = pg.evaluate("""() => ({
        ls: Object.keys(localStorage).map(k => k + '=' + localStorage.getItem(k)),
        htmlClass: document.documentElement.className,
        htmlData: document.documentElement.dataset ? Object.keys(document.documentElement.dataset) : null,
        bodyBg: getComputedStyle(document.body).backgroundColor,
        headerBg: (() => { const h = document.querySelector('header'); return h ? getComputedStyle(h).backgroundColor : null; })(),
    })""")
    print(info)
    b.close()
