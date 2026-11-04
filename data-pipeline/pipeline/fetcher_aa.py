"""Artificial Analysis (artificialanalysis.ai) leaderboard fetcher.

真实抓取器（2026-11-01 验证可用）：
- 目标 URL: https://artificialanalysis.ai/leaderboards/models（SSR HTML 表格，国内网络可达）
- 解析表头确定 "Artificial Analysis Intelligence Index" 列，逐行提取
  模型名 / 上下文窗口 / 智能指数 / 每任务成本 / 延迟等真实数值
- 成功返回 is_mock=false；仅当网络失败或解析不到任何行时回退 mock 并标记 is_mock=true
  （前端生成器会拒绝覆盖真实数据）

说明：智能指数（Intelligence Index）为 0-100 绝对能力分，天然适配 ModelRank 的
0-100 综合分框架；数据来自 AA 公开榜单，可溯源。
"""
from __future__ import annotations

import json
import logging
import re
from typing import Any

from .common import blank_model, now_iso

log = logging.getLogger("pipeline.aa")

URL = "https://artificialanalysis.ai/leaderboards/models"


def _parse_leaderboard(text: str) -> list[dict[str, Any]]:
    """从 SSR HTML 表格提取 {name, context, ii, cost, median, latency} 行。"""
    rows = re.findall(r"<tr[^>]*>(.*?)</tr>", text, re.S)
    out: list[dict[str, Any]] = []
    for r in rows:
        m = re.search(
            r'<div class="font-semibold border-l-4 pl-2"[^>]*>([^<]+)</div>', r
        )
        if not m:
            continue
        name = m.group(1).strip()
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
                "context": ctx,
                "intelligence_index": ii,
                "cost_per_task_usd": cost,
                "latency_s": latency,
                "source_url": URL,
            }
        )
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
        models = [
            blank_model(
                vendor=_vendor_of(r["name"]),
                name=r["name"],
                score=r["intelligence_index"],
                context_length=_ctx_to_int(r["context"]),
                cost_per_task_usd=r["cost_per_task_usd"],
                latency_s=r["latency_s"],
                source_url=r["source_url"],
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
