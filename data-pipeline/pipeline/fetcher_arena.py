"""LMArena (lmarena.ai → arena.ai) leaderboard fetcher.

榜单页是 Next.js 应用，正常情况下服务端渲染的 HTML 里带 `__NEXT_DATA__`
JSON。但 arena.ai 目前由 Cloudflare Turnstile 保护：普通请求、headless Chrome、
有窗口 Chrome 都只拿到 403 的 "Just a moment" 挑战页。下面的解析逻辑保留（等
挑战解除或换到可用出口即可复用），抓不到时返回空列表且 is_mock=False ——
宁可少一个数据源，也不要让编造的 ELO 混进 models.json 被当成真实评分。
"""
from __future__ import annotations

import json
import logging
from typing import Any

from bs4 import BeautifulSoup

from .common import blank_model, make_client, now_iso

log = logging.getLogger("pipeline.arena")

URL = "https://lmarena.ai/leaderboard"


def _extract_next_data(html: str) -> dict[str, Any] | None:
    soup = BeautifulSoup(html, "html.parser")
    tag = soup.find("script", id="__NEXT_DATA__")
    if not tag or not tag.string:
        return None
    try:
        return json.loads(tag.string)
    except json.JSONDecodeError:
        return None


def _walk_for_leaderboard(obj: Any, depth: int = 0) -> list[dict[str, Any]]:
    """Recursively look for a list that looks like a leaderboard:
    dicts with a model name + score / arena score field.
    """
    if depth > 8:
        return []
    if isinstance(obj, list):
        # Heuristic: >=3 items, each a dict, each has a name-ish field.
        if (
            len(obj) >= 3
            and all(isinstance(x, dict) for x in obj)
            and any(
                any(k in x for k in ("model", "name", "rank", "arena_score"))
                for x in obj[:3]
            )
        ):
            return obj  # type: ignore[return-value]
        for item in obj:
            found = _walk_for_leaderboard(item, depth + 1)
            if found:
                return found
    elif isinstance(obj, dict):
        for v in obj.values():
            found = _walk_for_leaderboard(v, depth + 1)
            if found:
                return found
    return []


def _row_to_model(row: dict[str, Any]) -> dict[str, Any]:
    name = (
        row.get("name")
        or row.get("model")
        or row.get("fullname")
        or row.get("rank", {}).get("model")
        or "unknown"
    )
    if isinstance(name, dict):
        name = name.get("name") or name.get("fullname") or "unknown"
    score = (
        row.get("arena_score")
        or row.get("score")
        or row.get("elo")
        or row.get("rating")
        or row.get("rank", {}).get("arena_score")
    )
    return blank_model(
        vendor=None,  # LMArena doesn't always tag vendor cleanly; pipeline merges
        name=str(name),
        score=float(score) if isinstance(score, (int, float)) else None,
        source_url=URL,
        captured_at=now_iso(),
    )


def fetch() -> dict[str, Any]:
    try:
        with make_client() as client:
            resp = client.get(URL)
            resp.raise_for_status()
            data = _extract_next_data(resp.text)
            if not data:
                raise RuntimeError("no __NEXT_DATA__ blob found in HTML (Cloudflare challenge?)")
            rows = _walk_for_leaderboard(data)
            if not rows:
                raise RuntimeError("could not locate leaderboard rows in __NEXT_DATA__")
            models = [_row_to_model(r) for r in rows[:20]]
            if not any(m["score"] is not None for m in models):
                raise RuntimeError("rows parsed but no numeric scores extracted")
            return {"source": "lmarena", "models": models, "is_mock": False, "error": None}
    except Exception as e:  # noqa: BLE001 — we deliberately never crash the pipeline
        # 抓不到就返回空：arena.ai 由 Cloudflare Turnstile 保护，脚本请求（含
        # headless / 有窗口 Chrome）只会拿到 403 挑战页。假 ELO 一旦进入
        # models.json 会被下游当真实评分，宁可为空也不要造假。
        log.warning("arena fetch failed (no rows contributed): %s", e)
        return {
            "source": "lmarena",
            "models": [],
            "is_mock": False,
            "error": f"unavailable: {type(e).__name__}: {e}",
        }
