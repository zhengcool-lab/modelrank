"""Vendor official pricing page fetchers.

We attempt a plain GET against each vendor's public pricing page and try
to pull numbers out of the HTML with BeautifulSoup. In practice most of
these pages are React/Next shells with the table loaded client-side, so
we expect most sites to fall through to the per-vendor mock dict. The
important property is: (a) one site failing never takes the others down,
(b) mock rows are clearly tagged so the reviewer can see what is real.
"""
from __future__ import annotations

import logging
from typing import Any, Callable

from .common import blank_model, make_client, now_iso

log = logging.getLogger("pipeline.vendors")


# ---- per-vendor config -----------------------------------------------------

# Each entry: vendor name, pricing URL, and a curated MOCK list used when
# the live page cannot be parsed. Prices are USD per 1M tokens; these are
# approximate placeholders for contract testing only.
VENDORS: list[dict[str, Any]] = [
    {
        "vendor": "OpenAI",
        "url": "https://openai.com/api/pricing/",
        "mock": [
            ("GPT-4o", 2.50, 10.00, 128_000),
            ("GPT-4o mini", 0.15, 0.60, 128_000),
            ("o1", 15.00, 60.00, 200_000),
            ("o3-mini", 1.10, 4.40, 128_000),
        ],
    },
    {
        "vendor": "Anthropic",
        "url": "https://www.anthropic.com/pricing",
        "mock": [
            ("Claude 3.5 Sonnet", 3.00, 15.00, 200_000),
            ("Claude 3.5 Haiku", 0.80, 4.00, 200_000),
            ("Claude 3 Opus", 15.00, 75.00, 200_000),
        ],
    },
    {
        "vendor": "Google",
        "url": "https://ai.google.dev/pricing",
        "mock": [
            ("Gemini 1.5 Pro", 1.25, 5.00, 2_000_000),
            ("Gemini 1.5 Flash", 0.075, 0.30, 1_000_000),
            ("Gemini 2.0 Flash", 0.10, 0.40, 1_000_000),
        ],
    },
    {
        "vendor": "DeepSeek",
        "url": "https://api-docs.deepseek.com/quick_start/pricing",
        "mock": [
            ("deepseek-chat (V3)", 0.27, 1.10, 128_000),
            ("deepseek-reasoner (R1)", 0.55, 2.19, 128_000),
        ],
    },
    {
        "vendor": "Alibaba",
        "url": "https://help.aliyun.com/zh/model-studio/getting-started/models",
        "mock": [
            ("qwen-max", 0.40, 1.20, 131_072),
            ("qwen-plus", 0.08, 0.20, 131_072),
            ("qwen-turbo", 0.05, 0.20, 1_000_000),
        ],
    },
]


def _to_rows(vendor: str, url: str, rows: list[tuple[str, float, float, int]]) -> list[dict[str, Any]]:
    out = []
    for name, pin, pout, ctx in rows:
        out.append(
            blank_model(
                vendor=vendor,
                name=name,
                price_input_per_mtok=pin,
                price_output_per_mtok=pout,
                context_length=ctx,
                source_url=url,
                captured_at=now_iso(),
            )
        )
    return out


def _try_live(vendor: str, url: str) -> list[dict[str, Any]] | None:
    """Best-effort live scrape. Returns None if we could not extract rows
    (caller then uses mock). We intentionally do NOT ship half-parsed HTML
    into the JSON.
    """
    try:
        with make_client() as client:
            resp = client.get(url)
            resp.raise_for_status()
            # No reliable DOM contract yet; TODO(pipeline): inspect each
            # vendor's rendered table (or OpenAPI spec) and write a parser
            # per vendor. For now, return None to signal "no live data".
            return None
    except Exception as e:  # noqa: BLE001
        log.warning("vendor %s live fetch failed: %s", vendor, e)
        return None


def fetch_one(cfg: dict[str, Any]) -> dict[str, Any]:
    vendor = cfg["vendor"]
    url = cfg["url"]
    live = _try_live(vendor, url)
    if live:
        return {"source": f"vendor:{vendor}", "models": live, "is_mock": False, "error": None}
    # Fall back to curated mock.
    log.warning("vendor %s: no live rows extracted, using mock pricing", vendor)
    return {
        "source": f"vendor:{vendor}",
        "models": _to_rows(vendor, url, cfg["mock"]),
        "is_mock": True,
        "error": "live parser not implemented; using curated mock",
    }


def fetch_all() -> list[dict[str, Any]]:
    return [fetch_one(cfg) for cfg in VENDORS]
