"""Shared helpers for the data-pipeline dry-run.

Every fetcher returns a dict of shape:
    {
        "source": "lmarena",
        "models": [ { ...ModelRank model dict... }, ... ],
        "news":   [ { ...news dict... }, ... ],   # optional
        "is_mock": bool,           # True if we fell back to placeholder data
        "error":   str | None,     # set when a real fetch failed and we used mock
    }

Model dict schema (out/models.json contract, see README):
    {
        "vendor": str,
        "name": str,
        "score": float | None,
        "price_input_per_mtok": float | None,   # USD per 1M input tokens
        "price_output_per_mtok": float | None,
        "throughput_tps": float | None,         # tokens/sec
        "context_length": int | None,
        "source_url": str,
        "captured_at": ISO-8601 UTC str,
    }
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

import httpx

UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0 Safari/537.36 ModelRankBot/0.1 (+dry-run)"
)

log = logging.getLogger("pipeline")


def now_iso() -> str:
    """UTC timestamp in the format expected by out/models.json."""
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def make_client(timeout: float = 8.0) -> httpx.Client:
    """A tolerant HTTP client. Every fetcher shares this so we don't have to
    re-tune headers/timeouts per site. We deliberately do NOT mimic a full
    browser (no JS, no cookies, no TLS fingerprint) — when a site requires
    that, the fetcher falls back to mock data instead of fighting Cloudflare.
    """
    return httpx.Client(
        timeout=httpx.Timeout(timeout, connect=3.0),
        follow_redirects=True,
        headers={
            "User-Agent": UA,
            "Accept": "text/html,application/json;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.8",
        },
    )


def blank_model(**overrides: Any) -> dict[str, Any]:
    """Return a model dict with every contract field present (None if unknown)."""
    base: dict[str, Any] = {
        "vendor": None,
        "name": None,
        "score": None,
        "price_input_per_mtok": None,
        "price_output_per_mtok": None,
        "throughput_tps": None,
        "context_length": None,
        "source_url": None,
        "captured_at": now_iso(),
    }
    base.update(overrides)
    return base
