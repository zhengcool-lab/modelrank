#!/usr/bin/env python3
"""从 data-pipeline out/models.json 的 Artificial Analysis 真实数据生成 UI_MODELS TS 段。

规则：
- 只取 source_url 以 artificialanalysis.ai 开头的 AA 真实行（排除 Elo/HF mock 混入）
- 只收主流厂商（排除 Other）
- 按基座去重：模型名去掉 "(变体)" 后同基座只保留智能指数最高的一个
- score = 智能指数原值；delta=null；trend=flat；ci=0
- dims 省略（AA 无五维，前端已降级）；价格 0 + priceEstimated=true（token 价待官方核对）
- tier 按指数分级；priceLevel 按每任务成本分级
- 运行：.venv/bin/python scripts/gen-ui-models.py > /tmp/ui_models_new.txt
"""
from __future__ import annotations

import json
import re
import sys

MODELS_JSON = "out/models.json"
AA_PREFIX = "https://artificialanalysis"
MAJOR_VENDORS = {
    "OpenAI", "Anthropic", "Google", "DeepSeek", "Alibaba", "Moonshot",
    "xAI", "Zhipu", "StepFun", "MiniMax", "Tencent", "Mistral", "NVIDIA", "Cohere",
}
# 开源权重模型（名字规则判断）
OPEN_PATTERNS = ["gpt-oss", "Qwen3.8 27B", "Qwen3.5 Omni Plus", "Llama", "Phi",
                 "Nemotron", "DeepHermes", "Command A"]


def base_of(name: str) -> str:
    """去变体后缀：'GPT-6 Astra (max)' -> 'GPT-6 Astra'"""
    return re.sub(r"\s*\([^)]*\)", "", name).strip()


def slugify(name: str) -> str:
    s = base_of(name)
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s.lower()).strip("-")
    return s


def is_open(name: str) -> bool:
    return any(p.lower() in name.lower() for p in OPEN_PATTERNS)


def fetch_date() -> str:
    """从抓取数据里的 captured_at 推导抓取日期（按北京时间 UTC+8，YYYY-MM-DD）。"""
    from datetime import datetime, timedelta, timezone
    try:
        data = json.load(open(MODELS_JSON, encoding="utf-8"))
        models = data if isinstance(data, list) else data.get("models", [])
        caps = [m.get("captured_at", "") for m in models if m.get("captured_at")]
        if caps:
            d = sorted(caps)[-1]
            dt = datetime.fromisoformat(d.replace("Z", "+00:00"))
            return (dt + timedelta(hours=8)).strftime("%Y-%m-%d")  # 北京 UTC+8
    except Exception:
        pass
    return "2026-11-01"


def main() -> None:
    data = json.load(open(MODELS_JSON, encoding="utf-8"))
    models = data if isinstance(data, list) else data.get("models", [])
    rows = [
        m for m in models
        if str(m.get("source_url", "")).startswith(AA_PREFIX)
        and m.get("vendor") in MAJOR_VENDORS
        and m.get("score") is not None
    ]
    # 基座去重：保留每基座 II 最高
    best: dict[str, dict] = {}
    for m in rows:
        key = (m["vendor"], base_of(m["name"]))
        if key not in best or m["score"] > best[key]["score"]:
            best[key] = m
    picked = sorted(best.values(), key=lambda m: -m["score"])
    print(f"// picked {len(picked)} models from AA real rows", file=sys.stderr)

    fd = fetch_date()
    md = fd[5:]  # MM-DD
    lines = ["export const UI_MODELS: UIModelRecord[] = ["]
    for m in picked:
        ii = m["score"]
        vendor = m["vendor"]
        name = m["name"]
        base = base_of(name)
        open_source = is_open(name)
        cost_raw = m.get("cost_per_task_usd") or "--"
        try:
            cost = float(str(cost_raw).replace("$", ""))
        except ValueError:
            cost = None
        price_level = "high" if cost is not None and cost >= 5 else ("mid" if cost is not None and cost >= 1 else "low")
        tier = "S" if ii >= 50 else ("A" if ii >= 40 else ("B" if ii >= 25 else "C"))
        ctx = m.get("context") or "--"
        lines.append("  {")
        lines.append(f'    id: "{slugify(base)}",')
        lines.append(f'    name: "{base}",')
        lines.append(f'    vendor: "{vendor}",')
        lines.append(f"    openSource: {str(open_source).lower()},")
        lines.append(f"    score: {ii:.0f},")
        lines.append("    delta: null,")
        lines.append('    trend: "flat",')
        lines.append("    ci: 0,")
        lines.append("    priceInput: 0,")
        lines.append("    priceOutput: 0,")
        lines.append("    priceEstimated: true,")
        lines.append(f'    priceLevel: "{price_level}",')
        lines.append(f'    tier: "{tier}",')
        lines.append('    source: "thirdparty",')
        lines.append(f'    context: "{ctx}",')
        lines.append("    speedTokPerS: 0,")
        lines.append(f'    updatedAt: "{md}",')
        lines.append(f'    priceUpdatedAt: "{fd}",')
        lines.append("    trendHistory: [],")
        lines.append(
            f'    blurb: "来自 Artificial Analysis 智能指数评测的{vendor}当前代模型，指数 {ii:.0f}（{fd} 抓取）。",'
        )
        lines.append("  },")
    lines.append("];")
    print("\n".join(lines))


if __name__ == "__main__":
    main()
