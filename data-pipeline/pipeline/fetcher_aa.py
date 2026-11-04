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
- 成功返回 is_mock=false；仅当网络失败或解析不到任何行时回退 mock 并标记 is_mock=true
  （前端生成器会拒绝覆盖真实数据）

说明：智能指数（Intelligence Index）为 0-100 绝对能力分，天然适配 ModelRank 的
0-100 综合分框架；数据来自 AA 公开榜单，可溯源。
"""
from __future__ import annotations

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
                    # per-model 源链接升级（详情页专属 URL）
                    if d.get("source_url"):
                        r["source_url"] = d["source_url"]
            log.info("AA detail fill: %d rows with real token prices", filled)

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
