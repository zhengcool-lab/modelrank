"""LMArena (lmarena.ai) leaderboard fetcher.

LMArena's leaderboard is a Next.js app; the server-rendered HTML usually
embeds a `__NEXT_DATA__` JSON blob with the current ranking. We try to
extract that. If the HTML does not contain it (JS-only render, Cloudflare
challenge, network error), we fall back to curated mock rows and flag the
result with `is_mock=True` so the reviewer knows not to trust the numbers
until a real scraper is wired in.
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


def _mock() -> list[dict[str, Any]]:
    # TODO(pipeline): replace with real extraction once LMArena's SSR
    # payload shape is locked in. These are approximate ELO placeholders
    # for shape-testing the JSON contract only — DO NOT publish.
    log.warning("arena: falling back to mock leaderboard rows")
    return [
        blank_model(vendor="OpenAI", name="GPT-5", score=1360.0, source_url=URL),
        blank_model(vendor="Anthropic", name="Claude Opus 4.1", score=1345.0, source_url=URL),
        blank_model(vendor="Google", name="Gemini 2.5 Pro", score=1328.0, source_url=URL),
        blank_model(vendor="DeepSeek", name="DeepSeek-V3.1", score=1305.0, source_url=URL),
        blank_model(vendor="Alibaba", name="Qwen3-Max", score=1290.0, source_url=URL),
    ]


def fetch() -> dict[str, Any]:
    try:
        with make_client() as client:
            resp = client.get(URL)
            resp.raise_for_status()
            data = _extract_next_data(resp.text)
            if not data:
                raise RuntimeError("no __NEXT_DATA__ blob found in HTML")
            rows = _walk_for_leaderboard(data)
            if not rows:
                raise RuntimeError("could not locate leaderboard rows in __NEXT_DATA__")
            models = [_row_to_model(r) for r in rows[:20]]
            if not any(m["score"] is not None for m in models):
                raise RuntimeError("rows parsed but no numeric scores extracted")
            return {"source": "lmarena", "models": models, "is_mock": False, "error": None}
    except Exception as e:  # noqa: BLE001 — we deliberately never crash the pipeline
        log.warning("arena fetch failed: %s", e)
        return {
            "source": "lmarena",
            "models": _mock(),
            "is_mock": True,
            "error": f"{type(e).__name__}: {e}",
        }
