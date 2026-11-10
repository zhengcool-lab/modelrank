#!/usr/bin/env python3
"""r4 group B interaction probes: horizontal scroll behavior of mobile compare table,
bottom compare bar presence, cost page preset-first-model behavior."""
import json, sys
from playwright.sync_api import sync_playwright

BASE = "https://modelrank-1br.pages.dev"

def compare_probe(page, w, h, ids, tag):
    page.add_init_script("""() => {
      localStorage.setItem('theme', 'light');
      localStorage.setItem('modelrank:compare', %s);
    }""" % json.dumps(json.dumps(ids)))
    page.goto(f"{BASE}/compare", wait_until="load", timeout=45000)
    try:
        page.wait_for_load_state("networkidle", timeout=12000)
    except Exception:
        pass
    page.wait_for_timeout(1500)
    # find the compare table card: element containing 综合评分
    info = page.evaluate(r"""() => {
      const all = Array.from(document.querySelectorAll('div,section,article'));
      const tbl = all.find(el => el.innerText && el.innerText.includes('综合评分') && el.scrollWidth > el.clientWidth + 4);
      if (!tbl) return {found:false};
      return {found:true, scrollWidth: tbl.scrollWidth, clientWidth: tbl.clientWidth,
              overflowX: getComputedStyle(tbl).overflowX,
              canScroll: tbl.scrollWidth > tbl.clientWidth + 4};
    }""")
    print(tag, "TABLE:", json.dumps(info, ensure_ascii=False))
    if info.get("canScroll"):
        # scroll right and shoot viewport
        page.evaluate(r"""() => {
          const all = Array.from(document.querySelectorAll('div,section,article'));
          const tbl = all.find(el => el.innerText && el.innerText.includes('综合评分') && el.scrollWidth > el.clientWidth + 4);
          if (tbl) tbl.scrollLeft = 600;
        }""")
        page.wait_for_timeout(600)
        page.screenshot(path=f"design-review/r4-assets/compare-2__{w}x{h}__light__hscroll-right.png" if len(ids)==2 else f"design-review/r4-assets/compare-4__{w}x{h}__light__hscroll-right.png",
                        full_page=False)
        print(tag, "hscroll shot saved")
    # bottom compare bar probe: fixed element at viewport bottom containing model chips
    bar = page.evaluate(r"""() => {
      const fixed = Array.from(document.querySelectorAll('div')).filter(el => {
        const s = getComputedStyle(el); const r = el.getBoundingClientRect();
        return (s.position === 'fixed') && r.bottom > innerHeight - 120 && r.height > 20 && r.width > innerWidth*0.6;
      });
      return fixed.slice(0,3).map(el => ({text: (el.innerText||'').slice(0,80), h: Math.round(el.getBoundingClientRect().height)}));
    }""")
    print(tag, "BOTTOMBAR:", json.dumps(bar, ensure_ascii=False))

def cost_preset_probe(page):
    # preset ling FIRST then gemini: does /cost preselect Ling?
    page.add_init_script("""() => {
      localStorage.setItem('theme', 'light');
      localStorage.setItem('modelrank:compare', %s);
    }""" % json.dumps(json.dumps(["ling-3-1-flash-1019", "gemini-4-carbon"])))
    page.goto(f"{BASE}/cost", wait_until="load", timeout=45000)
    try:
        page.wait_for_load_state("networkidle", timeout=12000)
    except Exception:
        pass
    page.wait_for_timeout(1500)
    txt = page.evaluate(r"""() => document.body.innerText.slice(0, 600)""")
    print("COST-PRESET-ORDER head:", txt[:300].replace("\n", " | "))
    page.screenshot(path="design-review/r4-assets/cost-result__1440x900__light__preset-lingfirst.png", full_page=True)

with sync_playwright() as p:
    b = p.webkit.launch()
    pg = b.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
    compare_probe(pg, 390, 844, ["gemini-4-carbon", "ling-3-1-flash-1019"], "cmp2-390")
    pg.close()
    pg2 = b.new_page(viewport={"width": 320, "height": 700}, device_scale_factor=2)
    compare_probe(pg2, 320, 700, ["gemini-4-carbon", "ling-3-1-flash-1019"], "cmp2-320")
    pg2.close()
    pg3 = b.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
    compare_probe(pg3, 390, 844, ["gemini-4-carbon","ling-3-1-flash-1019","inkling-2-small","claude-opus-5-5"], "cmp4-390")
    pg3.close()
    pg4 = b.new_page(viewport={"width": 1440, "height": 900})
    cost_preset_probe(pg4)
    pg4.close()
    b.close()
print("PROBE_DONE")
