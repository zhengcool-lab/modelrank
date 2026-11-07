#!/usr/bin/env python3
"""把「今日核对通过」的 Agent 产品 priceCheckedAt 刷成今天。

只处理 check-agent-pricing.py 判定为 verified（页面仍列出 ≥50% 已记录价位）的产品。
weak / unverified / unreachable 一律不动 —— 没核对上的保持原核对日，页面上的
「价格核对于 X」才不会变成一句假话。

用法：
    python scripts/refresh-agent-price-date.py [--dry]
"""
from __future__ import annotations

import datetime as dt
import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
AGENT_TS = REPO / "apps/web/src/lib/agent-data.ts"
REPORT = REPO / "data-pipeline/out/agent_pricing_report.json"

BLOCK = re.compile(r'\n\s{2}\{\s*\n\s{4}id:\s*"([a-z0-9-]+)"')
DATE_FIELD = re.compile(r'priceCheckedAt:\s*"\d{4}-\d{2}-\d{2}"')


def main(argv: list[str]) -> int:
    dry = "--dry" in argv
    if not REPORT.exists():
        print(f"⚠️ 没有核对报告 {REPORT}，先跑 check-agent-pricing.py")
        return 0
    report = json.loads(REPORT.read_text(encoding="utf-8"))
    verified = {pid for pid, v in report.get("products", {}).items() if v.get("status") == "verified"}
    if not verified:
        print("没有 verified 产品，跳过日期刷新")
        return 0

    today = dt.date.today().isoformat()
    src = AGENT_TS.read_text(encoding="utf-8")
    starts = [(m.start(), m.group(1)) for m in BLOCK.finditer(src)]
    if not starts:
        print("❌ 未能定位产品块，解析规则可能失效")
        return 1

    parts: list[str] = []
    cursor = 0
    updated: list[str] = []
    for i, (pos, pid) in enumerate(starts):
        end = starts[i + 1][0] if i + 1 < len(starts) else len(src)
        block = src[pos:end]
        if pid in verified:
            new_block, n = DATE_FIELD.subn(f'priceCheckedAt: "{today}"', block)
            if n:
                if new_block != block:
                    updated.append(pid)
                block = new_block
        parts.append(src[cursor:pos])
        parts.append(block)
        cursor = end
    parts.append(src[cursor:])
    out = "".join(parts)

    if not updated:
        print(f"核对日已是 {today}，无需改动")
        return 0

    if dry:
        print(f"[dry] 将刷新 {len(updated)} 个产品：{', '.join(updated)}")
        return 0

    AGENT_TS.write_text(out, encoding="utf-8")
    print(f"✅ 已把 {len(updated)} 个产品的 priceCheckedAt 刷成 {today}：{', '.join(updated)}")
    skipped = sorted(set(p for p in report["products"]) - verified)
    if skipped:
        print(f"   保持原核对日（未核对上）：{', '.join(skipped)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
