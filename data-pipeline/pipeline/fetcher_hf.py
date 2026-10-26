"""HuggingFace Open LLM Leaderboard fetcher.

The leaderboard is a Gradio Space; data is served via Gradio's internal
API which is versioned and brittle. We try a couple of public endpoints
and fall back to mock rows if they move. This fetcher is only expected
to contribute *open-weight* models — not API-hosted ones.
"""
from __future__ import annotations

import logging
from typing import Any

from .common import blank_model, make_client, now_iso

log = logging.getLogger("pipeline.hf")

SPACE_URL = "https://huggingface.co/spaces/open-llm-leaderboard/open_llm_leaderboard"


def _mock() -> list[dict[str, Any]]:
    # TODO(pipeline): pin the Gradio API version and re-enable real scraping.
    log.warning("huggingface: falling back to mock open-llm rows")
    return [
        blank_model(
            vendor="Meta", name="Llama-3.3-70B-Instruct",
            score=72.5, context_length=128_000, source_url=SPACE_URL,
        ),
        blank_model(
            vendor="Mistral", name="Mistral-Large-3",
            score=73.1, context_length=128_000, source_url=SPACE_URL,
        ),
        blank_model(
            vendor="Alibaba", name="Qwen3-235B-A22B",
            score=74.0, context_length=128_000, source_url=SPACE_URL,
        ),
    ]


def fetch() -> dict[str, Any]:
    try:
        with make_client() as client:
            resp = client.get(SPACE_URL)
            resp.raise_for_status()
            # The Space page itself is a shell; the actual table is loaded
            # from the Gradio backend. Without a Gradio client we cannot
            # reliably extract rows. Intentionally bail to mock.
            raise RuntimeError("HF leaderboard is a Gradio Space; needs gradio_client to parse")
    except Exception as e:  # noqa: BLE001
        log.warning("HF fetch failed: %s", e)
        return {
            "source": "huggingface",
            "models": _mock(),
            "is_mock": True,
            "error": f"{type(e).__name__}: {e}",
        }
