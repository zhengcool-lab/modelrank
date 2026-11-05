#!/usr/bin/env python3
"""从 data-pipeline out/models.json 的 Artificial Analysis 真实数据生成 UI_MODELS TS 段。

规则：
- 只取 source_url 以 artificialanalysis.ai 开头的 AA 真实行（排除 Elo/HF mock 混入）
- 只收主流厂商（排除 Other）
- 按基座去重：模型名去掉 "(变体)" 后同基座只保留智能指数最高的一个
- score = 智能指数原值；delta=null；trend=flat；ci=0
- dims 五维（AA Capability Indexes 真实数据）：fetcher_aa 已解密 AA 全量数据文件，
  按 slug 回填 dims（financeAndAccounting/strategyAndOps/legal/engineering/economics，
  0-100 指数分）；无数据的模型不输出 dims 字段，前端诚实显示"暂无该项评测"。
  价格优先取管道合并后的真实 token 价
  （price_input/output_per_mtok），无真实价时 0 + priceEstimated=true
- 输出无图标模型清单（新增 id 未覆盖 MODEL_LOGO 时打印，供巡检任务补映射）
- tier 按指数分级；priceLevel 按每任务成本分级
- 运行：.venv/bin/python scripts/gen-ui-models.py > /tmp/ui_models_new.txt
"""
from __future__ import annotations

import json
import re
import sys

MODELS_JSON = "out/models.json"
ENRICH_JSON = "out/aa_models_full.json"
AA_PREFIX = "https://artificialanalysis"
# vendor（UI 展示名）→ AA creator.slug（用于统计厂商构成 + 同厂商其他模型）
VENDOR_CREATOR = {
    "OpenAI": "openai", "Anthropic": "anthropic", "Google": "google", "DeepSeek": "deepseek",
    "Alibaba": "alibaba", "Moonshot": "kimi", "xAI": "xai", "Zhipu": "zai",
    "StepFun": "stepfun", "MiniMax": "minimax", "Tencent": "tencent",
    "Mistral": "mistral", "NVIDIA": "nvidia", "Cohere": "cohere",
}
# AA 评测子项（真实数据）：pct = 0-1 概率转百分比，pts = 原始分
BENCH_SPECS = [
    ("hle", "HLE 极限推理", "pct"),
    ("scicode", "SciCode 科研编程", "pct"),
    ("mmmuPro", "MMMU-Pro 多模态", "pct"),
    ("lcr", "LCR 长上下文检索", "pct"),
    ("mlcrOverall", "MLCR 多轮长上下文", "pct"),
    ("gpqa", "GPQA 研究生问答", "pct"),
    ("terminalbenchHard", "Terminal-Bench 终端", "pct"),
    ("omniscience", "Omniscience 知识", "pts"),
    ("critpt", "CritPt 物理推理", "pct"),
]
# 前端 MODEL_LOGO 映射文件（用于检测新增模型是否缺图标）
MODEL_LOGO_TS = "apps/web/src/components/model-logo.tsx"
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


def mapped_logo_ids() -> set[str]:
    """读取 model-logo.tsx 中 MODEL_LOGO 已覆盖的模型 id 集合。"""
    import os
    for root in ("..", ".", os.path.dirname(__file__) + "/../.."):
        p = os.path.join(root, MODEL_LOGO_TS)
        if os.path.exists(p):
            try:
                text = open(p, encoding="utf-8").read()
                m = re.search(r"const MODEL_LOGO[^=]*=\s*\{([^}]*)\}", text, re.S)
                if not m:
                    return set()
                keys = re.findall(r'^\s*(?:"([^"]+)"|\'([^\']+)\'|([A-Za-z0-9_-]+))\s*:', m.group(1), re.M)
                return set(a or b or c for a, b, c in keys)
            except Exception:
                return set()
    return set()


def load_enrich() -> list[dict]:
    """读取 AA 全量 enrich（fetcher 解密落盘）：发布日/参数量/许可证/模态/评测子项/厂商。"""
    try:
        data = json.load(open(ENRICH_JSON, encoding="utf-8"))
        return [m for m in data.get("models", []) if m.get("slug")]
    except Exception as e:  # noqa: BLE001
        print(f"// enrich 读取失败: {e}", file=sys.stderr)
        return []


def fmt_params(m: dict) -> str | None:
    """参数量：parameters 单位为 B（十亿），格式 '1.0T（激活 32B）'。"""
    total = m.get("parameters")
    active = m.get("inferenceParametersActiveBillions")
    if not isinstance(total, (int, float)) or total <= 0:
        return None
    t = f"{total / 1000:.1f}T" if total >= 1000 else f"{total:.0f}B"
    if isinstance(active, (int, float)) and active > 0:
        return f"{t}（激活 {active:.0f}B）"
    return t


def fmt_modalities(m: dict) -> dict[str, list[str]] | None:
    """输入/输出模态（AA 布尔字段 → 中文标签）。"""
    labels = [("Text", "文本"), ("Image", "图像"), ("Speech", "语音"), ("Video", "视频")]
    ins = [zh for key, zh in labels if m.get(f"inputModality{key}")]
    outs = [zh for key, zh in labels if m.get(f"outputModality{key}")]
    if not ins and not outs:
        return None
    return {"in": ins, "out": outs}


def extract_benchmarks(m: dict) -> list[dict]:
    """AA 真实子项分数（只输出有值的项）。"""
    out = []
    for key, label, unit in BENCH_SPECS:
        v = m.get(key)
        if not isinstance(v, (int, float)) or v <= 0:
            continue
        if unit == "pct":
            if v > 1.5:  # 已是百分制，无需换算
                val, unit_out = round(v, 1), "pts"
            else:
                val, unit_out = round(v * 100, 1), "pct"
        else:
            val, unit_out = round(v, 1), "pts"
        out.append({"label": label, "value": val, "unit": unit_out})
    return out


def fetch_date() -> str:
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


def fmt_ctx(ctx_raw) -> str:
    """把 context_length（int tokens）格式化为 '262K' / '1M'；无数据返回 '--'。"""
    try:
        n = int(ctx_raw)
    except (TypeError, ValueError):
        return "--"
    if n >= 1_000_000:
        m = n / 1_000_000
        return f"{m:.0f}M" if m % 1 == 0 else f"{m:.1f}M"
    if n >= 1000:
        return f"{n // 1000}K"
    return str(n)


def parse_num(raw) -> float | None:
    """解析 AA 数值（可能是 '$7.76'、'6.99'、'--'），失败返回 None。"""
    if raw is None:
        return None
    try:
        v = float(str(raw).replace("$", "").replace(",", "").strip())
        return v
    except ValueError:
        return None


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

    # 无图标检测：新增模型 id 若未覆盖 MODEL_LOGO，输出清单供巡检任务补映射
    mapped = mapped_logo_ids()
    missing = []
    for m in picked:
        mid = slugify(base_of(m["name"]))
        if mid not in mapped:
            missing.append(mid)
    if missing:
        print(f"// ⚠️ {len(missing)} 个模型缺 MODEL_LOGO 图标映射: {', '.join(missing)}", file=sys.stderr)
        print("// 巡检任务需为这些 id 补充 model-logo.tsx 映射（或家族图标）", file=sys.stderr)

    fd = fetch_date()
    md = fd[5:]  # MM-DD

    # AA enrich（按 slug 精确匹配，失败回退名字匹配）
    enrich_all = load_enrich()
    en_by_slug = {m["slug"]: m for m in enrich_all}
    en_by_name: dict[str, dict] = {}
    for m in enrich_all:
        for k in (m.get("name"), m.get("shortName")):
            if k:
                en_by_name.setdefault(k.strip().lower(), m)

    # 按 creator 分组的全量库（厂商构成 / 同厂商模型）
    by_creator: dict[str, list[dict]] = {}
    for m in enrich_all:
        c = m.get("creator") or {}
        if isinstance(c, dict) and c.get("slug"):
            by_creator.setdefault(c["slug"], []).append(m)

    # 本期榜单内的 id 集合（siblings 里判断能否跳转详情页）
    board_ids = {slugify(base_of(m["name"])) for m in picked}

    lines = ["export const UI_MODELS: UIModelRecord[] = ["]
    for m in picked:
        ii = m["score"]
        vendor = m["vendor"]
        name = m["name"]
        base = base_of(name)
        # AA enrich 记录（后续字段与价格都以它为准）
        slug = (m.get("source_url") or "").rstrip("/").split("/")[-1]
        aa = en_by_slug.get(slug) or en_by_name.get(base.lower()) or en_by_name.get(name.lower())
        # 开源标记：优先用 AA 详情页真实数据（open_source），缺失时用名字匹配兜底
        real_open = m.get("open_source")
        open_source = real_open if isinstance(real_open, bool) else is_open(name)
        cost_raw = m.get("cost_per_task_usd") or "--"
        try:
            cost = float(str(cost_raw).replace("$", ""))
        except ValueError:
            cost = None
        price_level = "high" if cost is not None and cost >= 5 else ("mid" if cost is not None and cost >= 1 else "low")
        tier = "S" if ii >= 50 else ("A" if ii >= 40 else ("B" if ii >= 25 else "C"))
        ctx = fmt_ctx(m.get("context_length"))
        # 真实数值字段（AA 每任务成本 / 中位延迟）；null 表示无数据，前端诚实显示"暂无"
        cost_task = parse_num(m.get("cost_per_task_usd"))
        latency = parse_num(m.get("latency_s"))
        # 真实 token 价格：优先 AA enrich（权威 price1m），回退管道合并价
        p_in = m.get("price_input_per_mtok")
        p_out = m.get("price_output_per_mtok")
        aa_in = (aa or {}).get("price1mInputTokens")
        aa_out = (aa or {}).get("price1mOutputTokens")
        if isinstance(aa_in, (int, float)) and aa_in > 0:
            p_in = aa_in
        if isinstance(aa_out, (int, float)) and aa_out > 0:
            p_out = aa_out
        has_price = isinstance(p_in, (int, float)) and p_in > 0
        lines.append("  {")
        lines.append(f'    id: "{slugify(base)}",')
        lines.append(f'    name: "{base}",')
        lines.append(f'    vendor: "{vendor}",')
        lines.append(f"    openSource: {str(open_source).lower()},")
        lines.append(f"    score: {ii:.0f},")
        lines.append("    delta: null,")
        lines.append('    trend: "flat",')
        lines.append("    ci: 0,")
        # 能力五维真实数据（AA Capability Indexes，0-100 指数分）
        dims = m.get("dims") or {}
        dim_fields = ["financeAndAccounting", "strategyAndOps", "legal", "engineering", "economics"]
        dim_vals = {k: dims[k] for k in dim_fields if isinstance(dims.get(k), (int, float))}
        if dim_vals:
            lines.append("    dims: {")
            for k, v in dim_vals.items():
                lines.append(f"      {k}: {round(v, 1)},")
            lines.append("    },")
        if has_price:
            p_out_v = p_out if isinstance(p_out, (int, float)) and p_out > 0 else p_in
            lines.append(f"    priceInput: {p_in:.2f},")
            lines.append(f"    priceOutput: {p_out_v:.2f},")
            lines.append("    priceEstimated: false,")
        else:
            lines.append("    priceInput: 0,")
            lines.append("    priceOutput: 0,")
            lines.append("    priceEstimated: true,")
        lines.append(f'    priceLevel: "{price_level}",')
        lines.append(f'    tier: "{tier}",')
        lines.append('    source: "thirdparty",')
        # per-model 数据源链接：优先 AA 模型专属详情页（source_url 可能是榜单页，用 enrich slug 修正）
        src_url = m.get("source_url") or ""
        if "/models/" not in src_url and aa and aa.get("slug"):
            src_url = f"https://artificialanalysis.ai/models/{aa['slug']}"
        lines.append(f'    website: "{src_url}",' if src_url.startswith("https://") else "    website: undefined,")
        lines.append(f'    context: "{ctx}",')
        lines.append("    speedTokPerS: 0,")
        cost_str = "null" if cost_task is None else f"{cost_task:.2f}"
        lat_str = "null" if latency is None else f"{latency:.2f}"
        lines.append(f"    costPerTask: {cost_str},")
        lines.append(f"    latencyS: {lat_str},")
        lines.append(f'    updatedAt: "{md}",')
        lines.append(f'    priceUpdatedAt: "{fd}",')
        lines.append("    trendHistory: [],")

        # ---- AA enrich：真实补充字段（发布日/参数量/推理/许可证/模态/评测子项/厂商构成/同厂商模型）
        if aa:
            if aa.get("releaseDate"):
                lines.append(f'    releaseDate: "{aa["releaseDate"]}",')
            p = fmt_params(aa)
            if p:
                lines.append(f'    params: "{p}",')
            if isinstance(aa.get("isReasoning"), bool):
                lines.append(f"    isReasoning: {str(aa['isReasoning']).lower()},")
            if aa.get("licenseName"):
                lines.append(f'    license: "{aa["licenseName"]}",')
            if aa.get("modelWeightsSourceUrl") and aa.get("isOpenWeights"):
                lines.append(f'    weightsUrl: "{aa["modelWeightsSourceUrl"]}",')
            if aa.get("knowledgeCutoffDate"):
                lines.append(f'    knowledgeCutoff: "{aa["knowledgeCutoffDate"]}",')
            mods = fmt_modalities(aa)
            if mods:
                ins_s = ", ".join('"%s"' % x for x in mods["in"])
                outs_s = ", ".join('"%s"' % x for x in mods["out"])
                lines.append("    modalities: {")
                lines.append(f"      in: [{ins_s}],")
                lines.append(f"      out: [{outs_s}],")
                lines.append("    },")
            bms = extract_benchmarks(aa)
            if len(bms) >= 2:
                lines.append("    benchmarks: [")
                for b in bms:
                    lines.append(f'      {{ label: "{b["label"]}", value: {b["value"]}, unit: "{b["unit"]}" }},')
                lines.append("    ],")

        # 厂商构成（同 creator 全量库）：修正"单模型开闭源 → 整个厂商定性"的错误
        creator_slug = VENDOR_CREATOR.get(vendor)
        pool = by_creator.get(creator_slug, []) if creator_slug else []
        pool_rated = [x for x in pool if isinstance(x.get("intelligenceIndex"), (int, float))]
        if len(pool) >= 2:
            n_open = sum(1 for x in pool if x.get("isOpenWeights") is True)
            n_closed = sum(1 for x in pool if x.get("isOpenWeights") is False)
            lines.append("    vendorStats: {")
            lines.append(f"      total: {len(pool)},")
            lines.append(f"      open: {n_open},")
            lines.append(f"      closed: {n_closed},")
            lines.append(f"      rated: {len(pool_rated)},")
            lines.append("    },")

        # 同厂商其他模型（排除自身；有分数优先，按指数/发布日期排序，取 8 个）
        if len(pool) >= 2:
            self_slug = (aa or {}).get("slug") or slug
            self_id = slugify(base)
            sibs = [
                x for x in pool
                if x.get("slug") != self_slug
                and slugify(base_of(x.get("name") or "")) != self_id
            ]
            sibs.sort(
                key=lambda x: (
                    0 if isinstance(x.get("intelligenceIndex"), (int, float)) else 1,
                    -(x.get("intelligenceIndex") or 0),
                    -(int(str(x.get("releaseDate") or "0").replace("-", "") or 0)),
                )
            )
            sibs = sibs[:8]
            # 按展示 id 去重（Kimi K3 Low / K3 Max 等同基座不同变体只留最高分一条）
            seen_ids: set[str] = set()
            uniq_sibs = []
            for x in sibs:
                sid = slugify(base_of(x.get("name") or ""))
                if sid in seen_ids:
                    continue
                seen_ids.add(sid)
                uniq_sibs.append(x)
            sibs = uniq_sibs
            if sibs:
                lines.append("    siblings: [")
                for x in sibs:
                    nm = base_of(x.get("name") or "")
                    sid = slugify(nm)
                    sc = x.get("intelligenceIndex")
                    sc_s = f"{sc:.0f}" if isinstance(sc, (int, float)) else "null"
                    op = x.get("isOpenWeights")
                    op_s = "true" if op is True else ("false" if op is False else "null")
                    rd = x.get("releaseDate")
                    rd_s = f'"{rd}"' if rd else "null"
                    inb = "true" if sid in board_ids else "false"
                    lines.append(
                        f'      {{ name: "{nm}", id: "{sid}", score: {sc_s}, open: {op_s}, '
                        f'releaseDate: {rd_s}, inBoard: {inb} }},'
                    )
                lines.append("    ],")

        lines.append(
            f'    blurb: "来自 Artificial Analysis 智能指数评测，指数 {ii:.0f}（{fd} 抓取）",'
        )
        lines.append("  },")
    lines.append("];")
    print("\n".join(lines))


if __name__ == "__main__":
    main()
