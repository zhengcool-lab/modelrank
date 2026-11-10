#!/usr/bin/env python3
"""r4 设计评审统一取证脚本（Playwright webkit，同步 API）。

用法：
  python shot.py --url https://modelrank-1br.pages.dev/ --name home --vp 390x844 --theme dark
  python shot.py --url .../compare --name compare --vp 1440x900 --theme light \
      --compare gemini-4-carbon,ling-3-1-flash-1019 --fullpage
可选：
  --no-fullpage   只截视口内（默认整页）
  --wait MS       额外等待毫秒（默认 1200，给字体/图片渲染留时间）
诊断 JSON 与截图同目录同名 .json：失败请求、console 错误、横向溢出、
移动端过小触控目标、损坏图片。
"""
import argparse
import json
import os
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

BASE = "https://modelrank-1br.pages.dev"
OUT_DIR = Path(__file__).resolve().parent

DIAG_JS = r"""
([viewportWidth, isMobile]) => {
  const out = {overflow: [], smallTargets: [], brokenImages: []};
  const vis = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden' && s.opacity !== '0';
  };
  const docW = document.documentElement.scrollWidth;
  if (docW > viewportWidth + 1) {
    const offenders = [];
    document.querySelectorAll('*').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width > viewportWidth + 1 && vis(el)) {
        offenders.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className || '').toString().slice(0, 120),
          w: Math.round(r.width),
          text: (el.innerText || '').slice(0, 60).replace(/\n/g, ' ')
        });
      }
    });
    out.overflow = {docScrollWidth: docW, viewportWidth, offenders: offenders.slice(0, 15)};
  }
  if (isMobile) {
    document.querySelectorAll('a,button,[role="button"],input,select,textarea').forEach((el) => {
      if (!vis(el)) return;
      const r = el.getBoundingClientRect();
      if ((r.width > 0 && r.width < 34) || (r.height > 0 && r.height < 34)) {
        out.smallTargets.push({
          tag: el.tagName.toLowerCase(),
          w: Math.round(r.width), h: Math.round(r.height),
          text: (el.innerText || el.getAttribute('aria-label') || el.getAttribute('placeholder') || '').slice(0, 40),
          cls: (el.className || '').toString().slice(0, 80)
        });
      }
    });
  }
  document.querySelectorAll('img').forEach((img) => {
    if (vis(img) && img.naturalWidth > 0 && img.naturalWidth < 8) {
      out.brokenImages.push({src: img.currentSrc || img.src, w: img.naturalWidth});
    }
  });
  return out;
}
"""


def parse_vp(s):
    w, h = s.lower().split("x")
    return int(w), int(h)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", required=True)
    ap.add_argument("--name", required=True, help="文件名前缀，如 home / cost-result")
    ap.add_argument("--vp", required=True, help="如 1440x900 / 390x844")
    ap.add_argument("--theme", choices=["light", "dark"], default="light")
    ap.add_argument("--compare", default="", help="逗号分隔模型 id，预置 modelrank:compare")
    ap.add_argument("--fullpage", dest="fullpage", action="store_true", default=True)
    ap.add_argument("--no-fullpage", dest="fullpage", action="store_false")
    ap.add_argument("--wait", type=int, default=1200)
    args = ap.parse_args()

    w, h = parse_vp(args.vp)
    is_mobile = w < 768
    stem = f"{args.name}__{w}x{h}__{args.theme}.png"
    shot_path = OUT_DIR / stem
    json_path = OUT_DIR / (stem[:-4] + ".json")

    init = "() => {"
    init += "localStorage.setItem('theme', '%s');" % args.theme
    if args.compare:
        ids = [x.strip() for x in args.compare.split(",") if x.strip()]
        init += "localStorage.setItem('modelrank:compare', %s);" % json.dumps(json.dumps(ids))
    init += "}"

    failed, console_errors = [], []
    with sync_playwright() as p:
        browser = p.webkit.launch()
        page = browser.new_page(viewport={"width": w, "height": h},
                                device_scale_factor=2 if is_mobile else 1)
        page.add_init_script("(" + init + ")()")
        page.on("console", lambda m: console_errors.append(m.text) if m.type == "error" else None)
        page.on("response", lambda r: failed.append({"status": r.status, "url": r.url})
                 if r.status >= 400 else None)
        page.goto(args.url, wait_until="load", timeout=45000)
        try:
            page.wait_for_load_state("networkidle", timeout=15000)
        except Exception:
            pass
        page.wait_for_timeout(args.wait)
        # 触发懒加载图片：滚到底再回顶
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(600)
        page.evaluate("window.scrollTo(0, 0)")
        page.wait_for_timeout(400)
        diag = page.evaluate(DIAG_JS, [w, is_mobile])
        page.screenshot(path=str(shot_path), full_page=args.fullpage)
        title = page.title()
        browser.close()

    report = {"url": args.url, "viewport": args.vp, "theme": args.theme,
              "title": title, "screenshot": stem,
              "failedRequests": failed, "consoleErrors": console_errors, **diag}
    json_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"ok": True, "shot": str(shot_path),
                      "failed": len(failed), "consoleErr": len(console_errors),
                      "overflow": bool(diag.get("overflow")),
                      "smallTargets": len(diag.get("smallTargets", []))},
                     ensure_ascii=False))


if __name__ == "__main__":
    sys.exit(main())
