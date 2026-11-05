"""Artificial Analysis (artificialanalysis.ai) leaderboard fetcher.

真实抓取器（2026-11-01 验证可用）：
- 目标 URL: https://artificialanalysis.ai/leaderboards/models（SSR HTML 表格，国内网络可达）
- 解析表头确定 "Artificial Analysis Intelligence Index" 列，逐行提取
  模型名 / 上下文窗口 / 智能指数 / 每任务成本 / 延迟等真实数值
- 详情页增强（2026-11-04）：榜单行带每模型详情页 slug（/models/<slug>），对
  主流厂商 + 有智能指数的行并发抓详情页，提取真实 token 单价
  （"$X per 1M input tokens" / "$Y per 1M output tokens"）回填
  price_input_per_mtok / price_output_per_mtok，并把 source_url 升级为该模型
  专属详情页 URL（per-model 可溯源链接）。
- 能力五维增强（2026-11-04，真实数据）：AA 详情页 SSR 内嵌加密数据清单
  （manifest，含 AES-GCM 密钥）。抓任意模型详情页提取 manifest → 下载加密
  data/*.txt → AES-GCM(key, IV=SHA-256(key)[0:12]) 解密 → gzip 解压 → JSON，
  内含全部 ~700 模型的能力指数（capabilities 五维：financeAndAccounting /
  strategyAndOps / legal / engineering / economics，0-100 分数）。按 slug
  回填到各行为 dims 字段，实现"能力五维真实数据"（替代原型期的"暂无该项评测"）。
- 成功返回 is_mock=false；仅当网络失败或解析不到任何行时回退 mock 并标记 is_mock=true
  （前端生成器会拒绝覆盖真实数据）

说明：智能指数（Intelligence Index）为 0-100 绝对能力分，天然适配 ModelRank 的
0-100 综合分框架；数据来自 AA 公开榜单，可溯源。能力五维来自 AA Capability
Indexes（Finance & Accounting / Strategy & Ops / Legal / Engineering / Economics），
同为 0-100 指数分。
"""
from __future__ import annotations

import gzip
import hashlib
import json
import logging
import re
from concurrent.futures import ThreadPoolExecutor
from typing import Any

from Crypto.Cipher import AES

from .common import blank_model, now_iso

log = logging.getLogger("pipeline.aa")

URL = "https://artificialanalysis.ai/leaderboards/models"
DETAIL_BASE = "https://artificialanalysis.ai/models/"
DATA_BASE = "https://artificialanalysis.ai/data/"
# 只对主流厂商 + 有智能指数的行抓详情页（避免对 280 行全量抓取）
DETAIL_VENDORS = {
    "OpenAI", "Anthropic", "Google", "DeepSeek", "Alibaba", "Moonshot",
    "xAI", "Zhipu", "StepFun", "MiniMax", "Tencent", "Mistral", "NVIDIA", "Cohere",
}

# AA capability 五维字段（0-100 指数分）。前端展示顺序即此列表。
CAP_DIMS = [
    "financeAndAccounting",
    "strategyAndOps",
    "legal",
    "engineering",
    "economics",
]


def _fetch_capability_index() -> dict[str, dict[str, Any]]:
    """抓 AA 详情页 SSR 中的 manifest → 下载加密数据 → 解密 → 按 slug 返回能力五维。

    解密算法（从站点 JS 逆向确认，2026-11-04 验证）：
      1. manifest = {"path": "/data/<hash>.txt", "key": "<64-hex>"}
      2. data 文件 = AES-GCM 密文（tag 在末尾 16 字节）
         - key   = hex 解码的 32 字节
         - IV    = SHA-256(key)[0:12]
      3. 解密后为 gzip 压缩的 JSON：{"models": [ {slug, capabilities, ...}, ... ]}

    返回 { slug: {"dims": {...五维...}} }；任何环节失败返回 {}（不致命，不影响主流程）。
    """
    try:
        import urllib.request

        # 1) 抓任意模型详情页（页面级 manifest 全局存在；用 gemini-4-carbon 兜底）
        probe_slug = "gemini-4-carbon"
        req = urllib.request.Request(
            DETAIL_BASE + probe_slug, headers={"User-Agent": "Mozilla/5.0"}
        )
        with urllib.request.urlopen(req, timeout=40) as resp:
            html = resp.read().decode("utf-8", errors="ignore")

        # 2) 提取 initialModels 的 manifest（SSR RSC payload 内为转义 JSON）。
        #    详情页有两个 manifest：initialModels（全量 ~700 模型，含 capabilities）
        #    与页面级视图 manifest（单个模型面板数据，解密后是 list 不可用）。
        #    manifest key 会轮换，必须与同一请求中的 path 配对使用。
        m = re.search(
            r'initialModels\\",\\"manifest\\":\{\\"path\\":\\"/data/([a-f0-9]+\.txt)\\",\\"key\\":\\"([a-f0-9]+)\\"\}',
            html,
        )
        if not m:
            log.warning("AA capability: manifest not found in detail HTML")
            return {}
        data_path, key_hex = m.group(1), m.group(2)

        # 3) 下载加密数据
        req = urllib.request.Request(
            DATA_BASE + data_path, headers={"User-Agent": "Mozilla/5.0"}
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            blob = resp.read()

        # 4) AES-GCM 解密 + gzip 解压
        key = bytes.fromhex(key_hex)
        iv = hashlib.sha256(key).digest()[:12]
        cipher = AES.new(key, AES.MODE_GCM, nonce=iv)
        plain = gzip.decompress(cipher.decrypt_and_verify(blob[:-16], blob[-16:]))
        obj = json.loads(plain.decode("utf-8"))

        # 4.5) 落盘 enrich（详情页要用的真实字段：发布日/参数量/许可证/模态/评测子项/厂商构成）
        try:
            import os
            keep = [
                "slug", "name", "shortName", "creator", "releaseDate", "knowledgeCutoffDate",
                "parameters", "inferenceParametersActiveBillions", "isReasoning", "isOpenWeights",
                "openSourceCategorization", "licenseName", "licenseUrl", "modelWeightsSourceUrl",
                "contextWindowTokens", "intelligenceIndex", "intelligenceIndexEvaluations", "sizeClass",
                "price1mInputTokens", "price1mOutputTokens",
                "inputModalityText", "inputModalityImage", "inputModalitySpeech", "inputModalityVideo",
                "outputModalityText", "outputModalityImage", "outputModalitySpeech", "outputModalityVideo",
                "hle", "gpqa", "aime25", "terminalbenchHard", "scicode", "mmmuPro", "lcr", "mlcrOverall",
                "omniscience", "gdpval", "critpt", "tau2", "ifbench", "livecodebench", "healthbench",
                "deprecated",
            ]
            slim = []
            for model in obj.get("models", []):
                d = {k: model.get(k) for k in keep}
                c = model.get("creator") or {}
                d["creator"] = (
                    {"slug": c.get("slug"), "name": c.get("name"), "country": c.get("country")}
                    if isinstance(c, dict) else None
                )
                slim.append(d)
            path_out = os.path.join("out", "aa_models_full.json")
            os.makedirs("out", exist_ok=True)
            with open(path_out, "w", encoding="utf-8") as f:
                json.dump({"source": "artificialanalysis", "models": slim}, f, ensure_ascii=False)
            log.info("AA enrich: wrote %s (%d models)", path_out, len(slim))
        except Exception as e:  # noqa: BLE001
            log.warning("AA enrich dump failed: %s", e)

        # 5) 按 slug 提取能力五维
        out: dict[str, dict[str, Any]] = {}
        n_cap = 0
        for model in obj.get("models", []):
            slug = model.get("slug")
            caps = model.get("capabilities") or {}
            dims = {k: caps[k] for k in CAP_DIMS if isinstance(caps.get(k), (int, float))}
            if slug and dims:
                out[slug] = {"dims": dims}
                n_cap += 1
        log.info("AA capability: decrypted %s models, %s with dims (manifest %s)",
                 len(obj.get("models", [])), n_cap, data_path)
        return out
    except Exception as e:  # noqa: BLE001
        log.warning("AA capability fetch failed: %s", e)
        return {}


import json
import logging
import re
from concurrent.futures import ThreadPoolExecutor
from typing import Any

from .common import blank_model, now_iso

log = logging.getLogger("pipeline.aa")

URL = "https://artificialanalysis.ai/leaderboards/models"
DETAIL_BASE = "https://artificialanalysis.ai/models/"
# 只对主流厂商 + 有智能指数的行抓详情页（避免对 280 行全量抓取）
DETAIL_VENDORS = {
    "OpenAI", "Anthropic", "Google", "DeepSeek", "Alibaba", "Moonshot",
    "xAI", "Zhipu", "StepFun", "MiniMax", "Tencent", "Mistral", "NVIDIA", "Cohere",
}


def _parse_leaderboard(text: str) -> list[dict[str, Any]]:
    """从 SSR HTML 表格提取 {name, slug, context, ii, cost, median, latency} 行。"""
    rows = re.findall(r"<tr[^>]*>(.*?)</tr>", text, re.S)
    out: list[dict[str, Any]] = []
    for r in rows:
        m = re.search(
            r'<div class="font-semibold border-l-4 pl-2"[^>]*>([^<]+)</div>', r
        )
        if not m:
            continue
        name = m.group(1).strip()
        slug_m = re.search(r'href="/models/([a-z0-9-]+)"', r)
        vals = re.findall(r'<div class="text-center">([^<]*)</div>', r)
        # 列序（由表头确定）：Model | Context | Creator | II | Cost/Task | Median | Latency | Total
        if len(vals) < 4:
            continue
        ctx = vals[0]
        ii_raw = vals[1]
        cost = vals[2]
        latency = vals[5] if len(vals) > 5 else "--"
        try:
            ii = float(ii_raw) if ii_raw != "--" else None
        except ValueError:
            ii = None
        out.append(
            {
                "name": name,
                "slug": slug_m.group(1) if slug_m else None,
                "context": ctx,
                "intelligence_index": ii,
                "cost_per_task_usd": cost,
                "latency_s": latency,
                "source_url": URL,
            }
        )
    return out


def _fetch_detail(slug: str) -> dict[str, Any]:
    """抓单个模型详情页，提取真实 token 单价。失败返回空 dict（不致命）。"""
    import urllib.request

    try:
        req = urllib.request.Request(
            DETAIL_BASE + slug, headers={"User-Agent": "Mozilla/5.0"}
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            text = resp.read().decode("utf-8", errors="ignore")
    except Exception as e:  # noqa: BLE001
        log.debug("AA detail fetch failed for %s: %s", slug, e)
        return {}
    inp = re.search(r"\$([\d.]+) per 1M input tokens", text)
    outp = re.search(r"\$([\d.]+) per 1M output tokens", text)
    out: dict[str, Any] = {
        "source_url": DETAIL_BASE + slug,  # per-model 专属源链接
    }
    if inp:
        out["price_input_per_mtok"] = float(inp.group(1))
    if outp:
        out["price_output_per_mtok"] = float(outp.group(1))
    # 开源标记：AA 详情页结构化 FAQ "Is <model> open source?" → Yes/No
    # （真实数据源，替代前端按模型名猜测）
    os_m = re.search(
        r'"name":"Is [^"]*open source\?","acceptedAnswer":\{"@type":"Answer","text":"([^"]+)"',
        text,
    )
    if os_m:
        out["open_source"] = os_m.group(1).startswith("Yes")
    return out


def _vendor_of(name: str) -> str:
    n = name.lower()
    for v, keys in [
        ("OpenAI", ["gpt", "openai", "o1", "o3", "o4", "codex", "chatgpt"]),
        ("Anthropic", ["claude"]),
        ("Google", ["gemini"]),
        ("DeepSeek", ["deepseek"]),
        ("Alibaba", ["qwen", "tongyi"]),
        ("Meta", ["llama"]),
        ("Mistral", ["mistral"]),
        ("Moonshot", ["kimi"]),
        ("ByteDance", ["doubao", "seed"]),
        ("Tencent", ["hunyuan", "ling", "inkling"]),
        ("Baidu", ["ernie"]),
        ("Zhipu", ["glm"]),
        ("StepFun", ["step"]),
        ("MiniMax", ["minimax"]),
        ("Meituan", ["longcat"]),
        ("xAI", ["grok"]),
        ("Microsoft", ["phi", "microsoft"]),
        ("NVIDIA", ["nemotron"]),
        ("Cohere", ["command"]),
        ("Reka", ["reka"]),
    ]:
        if any(k in n for k in keys):
            return v
    return "Other"


def _ctx_to_int(ctx: str) -> int | None:
    m = re.search(r"([\d.]+)\s*([kKmM]?)", ctx)
    if not m:
        return None
    v = float(m.group(1))
    unit = m.group(2).lower()
    if unit == "m":
        return int(v * 1_000_000)
    if unit == "k":
        return int(v * 1_000)
    return int(v)


def fetch() -> dict[str, Any]:
    try:
        import urllib.request

        req = urllib.request.Request(URL, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=40) as resp:
            text = resp.read().decode("utf-8", errors="ignore")
        rows = _parse_leaderboard(text)
        if not rows:
            raise RuntimeError("no parseable model rows in leaderboard HTML")

        # 详情页增强：对主流厂商 + 有智能指数的行并发抓 token 单价（失败不致命）
        detail_targets = [
            r for r in rows
            if r.get("slug")
            and r.get("intelligence_index") is not None
            and _vendor_of(r["name"]) in DETAIL_VENDORS
        ]
        if detail_targets:
            with ThreadPoolExecutor(max_workers=8) as ex:
                details = list(ex.map(lambda r: _fetch_detail(r["slug"]), detail_targets))
            detail_map: dict[str, dict[str, Any]] = {}
            for r, d in zip(detail_targets, details):
                if d:
                    detail_map[r["slug"]] = d
            filled = 0
            for r in rows:
                slug = r.get("slug")
                if slug and slug in detail_map:
                    d = detail_map[slug]
                    if d.get("price_input_per_mtok") is not None:
                        r["price_input_per_mtok"] = d["price_input_per_mtok"]
                        filled += 1
                    if d.get("price_output_per_mtok") is not None:
                        r["price_output_per_mtok"] = d["price_output_per_mtok"]
                    # 开源标记（真实数据，AA 详情页 FAQ）
                    if d.get("open_source") is not None:
                        r["open_source"] = d["open_source"]
                    # per-model 源链接升级（详情页专属 URL）
                    if d.get("source_url"):
                        r["source_url"] = d["source_url"]
            log.info("AA detail fill: %d rows with real token prices", filled)

        # 能力五维增强：解密 AA 全量数据文件，按 slug 回填 dims（失败不致命）
        cap_map = _fetch_capability_index()
        dims_filled = 0
        for r in rows:
            slug = r.get("slug")
            if slug and slug in cap_map:
                r["dims"] = cap_map[slug]["dims"]
                dims_filled += 1
        log.info("AA capability fill: %d rows with real 5-dim scores", dims_filled)

        models = [
            blank_model(
                vendor=_vendor_of(r["name"]),
                name=r["name"],
                score=r["intelligence_index"],
                context_length=_ctx_to_int(r["context"]),
                cost_per_task_usd=r["cost_per_task_usd"],
                latency_s=r["latency_s"],
                source_url=r["source_url"],
                price_input_per_mtok=r.get("price_input_per_mtok"),
                price_output_per_mtok=r.get("price_output_per_mtok"),
                open_source=r.get("open_source"),
                dims=r.get("dims"),
            )
            for r in rows
        ]
        return {
            "source": "artificialanalysis",
            "url": URL,
            "fetched_at": now_iso(),
            "models": models,
            "is_mock": False,
            "error": "",
        }
    except Exception as e:  # noqa: BLE001
        log.warning("AA fetch failed: %s", e)
        return {
            "source": "artificialanalysis",
            "url": URL,
            "fetched_at": now_iso(),
            "models": [],
            "is_mock": True,
            "error": f"{type(e).__name__}: {e}",
        }
