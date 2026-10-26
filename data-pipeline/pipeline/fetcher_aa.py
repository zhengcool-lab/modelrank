"""Artificial Analysis (artificialanalysis.ai) fetcher.

AA is known to sit behind Cloudflare and serve a JS-rendered dashboard.
We attempt a plain GET; on any non-200, Cloudflare challenge, or
unparseable body, we immediately fall back to mock rows with a TODO.
Do NOT try to "beat" Cloudflare here — that is a separate engineering
track (headless browser / paid API) and out of scope for dry-run.
"""
from __future__ import annotations

import logging
from typing import Any

from .common import blank_model, make_client, now_iso

log = logging.getLogger("pipeline.aa")

URL = "https://artificialanalysis.ai/models"


def _mock() -> list[dict[str, Any]]:
    # TODO(pipeline): AA has a paid API — wire that in once budget approved.
    # These numbers are rough placeholders for contract testing only.
    log.warning("artificialanalysis: falling back to mock throughput/price rows")
    return [
        blank_model(
            vendor="OpenAI", name="GPT-5",
            price_input_per_mtok=12.0, price_output_per_mtok=60.0,
            throughput_tps=120.0, context_length=128_000,
            source_url=URL,
        ),
        blank_model(
            vendor="Anthropic", name="Claude Opus 4.1",
            price_input_per_mtok=15.0, price_output_per_mtok=75.0,
            throughput_tps=90.0, context_length=200_000,
            source_url=URL,
        ),
        blank_model(
            vendor="Google", name="Gemini 2.5 Pro",
            price_input_per_mtok=1.25, price_output_per_mtok=10.0,
            throughput_tps=140.0, context_length=1_000_000,
            source_url=URL,
        ),
        blank_model(
            vendor="DeepSeek", name="DeepSeek-V3.1",
            price_input_per_mtok=0.28, price_output_per_mtok=0.42,
            throughput_tps=80.0, context_length=128_000,
            source_url=URL,
        ),
    ]


def fetch() -> dict[str, Any]:
    try:
        with make_client() as client:
            resp = client.get(URL)
            # Cloudflare typically returns 403 with a challenge page.
            if resp.status_code != 200:
                raise RuntimeError(f"HTTP {resp.status_code}")
            text = resp.text
            low = text.lower()
            if "cloudflare" in low and ("challenge" in low or "just a moment" in low):
                raise RuntimeError("Cloudflare challenge detected")
            # AA's real model table is rendered client-side out of
            # bundled JSON; without a headless browser we cannot parse it
            # reliably. Intentionally bail to mock rather than ship
            # fabricated numbers.
            raise RuntimeError("AA dashboard is JS-rendered; no parseable table in HTML")
    except Exception as e:  # noqa: BLE001
        log.warning("AA fetch failed: %s", e)
        return {
            "source": "artificialanalysis",
            "models": _mock(),
            "is_mock": True,
            "error": f"{type(e).__name__}: {e}",
        }
