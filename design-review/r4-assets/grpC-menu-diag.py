#!/usr/bin/env python3
"""Diagnose mobile menu open state theme + overlay behavior."""
from playwright.sync_api import sync_playwright

BASE = "https://modelrank-1br.pages.dev"

with sync_playwright() as p:
    b = p.webkit.launch()
    pg = b.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
    pg.add_init_script("() => { localStorage.setItem('theme', 'dark'); }")
    pg.goto(f"{BASE}/news", wait_until="load", timeout=45000)
    pg.wait_for_timeout(2000)

    def probe(label):
        res = pg.evaluate("""() => {
            const cs = e => e ? getComputedStyle(e) : null;
            const body = getComputedStyle(document.body);
            const main = document.querySelector('main') || document.body;
            const card = document.querySelector('main div[class]');
            const drawerSel = [...document.querySelectorAll('div,nav,aside')].find(e => {
                const t = (e.innerText||'');
                return t.includes('榜单') && t.includes('Agent 榜') && t.includes('成本计算器') && e.getBoundingClientRect().top < 300;
            });
            const overlay = [...document.querySelectorAll('div')].find(e => {
                const s = getComputedStyle(e); const r = e.getBoundingClientRect();
                return s.position==='fixed' && r.width>=390 && r.height>=844 && parseFloat(s.opacity)>0;
            });
            return {
                bodyBg: body.backgroundColor, bodyColor: body.color,
                mainBg: cs(main).backgroundColor,
                cardBg: card ? cs(card).backgroundColor : null,
                drawerBg: drawerSel ? cs(drawerSel).backgroundColor : null,
                drawerCls: drawerSel ? (drawerSel.className||'').toString().slice(0,120) : null,
                drawerPos: drawerSel ? cs(drawerSel).position : null,
                overlay: overlay ? {bg: getComputedStyle(overlay).backgroundColor, opacity: getComputedStyle(overlay).opacity, cls: (overlay.className||'').toString().slice(0,80)} : null,
                scrollY: window.scrollY,
            };
        }""")
        print("PROBE", label, res)

    probe("closed")
    pg.get_by_role("button", name="打开菜单").click()
    pg.wait_for_timeout(900)
    probe("open")
    b.close()
