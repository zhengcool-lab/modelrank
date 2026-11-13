#!/usr/bin/env python3
"""复现 390 视口对比器第二列缺失：检查列数、容器宽度、可滚动性、列是否在视口外。"""
import json
from playwright.sync_api import sync_playwright

BASE = "https://modelrank-1br.pages.dev/compare"
IDS = ["gemini-4-carbon", "ling-3-1-flash-1019"]

PROBE = r"""
() => {
  const out = {};
  const docEl = document.documentElement;
  out.docScrollWidth = docEl.scrollWidth;
  out.innerWidth = window.innerWidth;
  // 找对比表容器（含“指标”表头的 table 或 grid）
  const tables = [...document.querySelectorAll('table')].map(t => ({
    tag: 'table', rows: t.rows.length, cols: t.rows[0] ? t.rows[0].cells.length : 0,
    w: Math.round(t.getBoundingClientRect().width),
    scrollW: t.scrollWidth, overflowX: getComputedStyle(t).overflowX,
    parentCls: (t.parentElement.className||'').toString().slice(0,80),
    parentW: Math.round(t.parentElement.getBoundingClientRect().width),
    parentScrollW: t.parentElement.scrollWidth,
    parentOverflow: getComputedStyle(t.parentElement).overflowX,
  }));
  out.tables = tables;
  // 所有含“Ling”的节点及其位置（判断第二列是否被渲染但移出视口）
  out.lingNodes = [];
  document.querySelectorAll('*').forEach(el => {
    const txt = (el.textContent||'').trim();
    if (txt.includes('Ling 3.1') && el.children.length === 0) {
      const r = el.getBoundingClientRect();
      out.lingNodes.push({tag: el.tagName.toLowerCase(), x: Math.round(r.x), w: Math.round(r.width), y: Math.round(r.y), text: txt.slice(0,30)});
    }
  });
  // 能力条数值节点
  out.scores = [];
  document.querySelectorAll('*').forEach(el => {
    if (el.children.length === 0 && /^\d{2}$/.test((el.textContent||'').trim())) {
      const r = el.getBoundingClientRect();
      if (r.y > 0 && r.width > 0) out.scores.push({x: Math.round(r.x), right: Math.round(r.right), w: Math.round(r.width), text: el.textContent.trim()});
    }
  });
  out.scores = out.scores.slice(0, 24);
  // 是否存在横向可滚动容器
  out.scrollables = [];
  document.querySelectorAll('*').forEach(el => {
    if (el.scrollWidth > el.clientWidth + 2) {
      const s = getComputedStyle(el);
      out.scrollables.push({tag: el.tagName.toLowerCase(), cls: (el.className||'').toString().slice(0,60),
        clientW: el.clientWidth, scrollW: el.scrollWidth, overflowX: s.overflowX});
    }
  });
  out.scrollables = out.scrollables.slice(0, 10);
  return out;
}
"""

with sync_playwright() as p:
    b = p.webkit.launch()
    page = b.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
    page.add_init_script(
        "(() => { localStorage.setItem('theme','light'); "
        "localStorage.setItem('modelrank:compare', %s); })()" % json.dumps(json.dumps(IDS))
    )
    page.goto(BASE, wait_until="load", timeout=45000)
    page.wait_for_timeout(1500)
    for w in (390, 320):
        page.set_viewport_size({"width": w, "height": 844})
        page.wait_for_timeout(500)
        data = page.evaluate(PROBE)
        print("===== viewport %d =====" % w)
        print(json.dumps(data, ensure_ascii=False, indent=1))
    b.close()
