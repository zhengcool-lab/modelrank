"""HuggingFace Open LLM Leaderboard fetcher.

open-llm-leaderboard 已于 2025 年归档停更；页面只是 Gradio Space 外壳，表格由
Gradio 内部 API 提供，而 datasets-server 对 open-llm-leaderboard/results 的转换
同样报错（Couldn't cast array）。因此目前拿不到可解析的真实数据：抓不到就返回
空列表，不回填编造的分数（假分会污染 models.json）。
"""
from __future__ import annotations

import logging
from typing import Any

from .common import make_client

log = logging.getLogger("pipeline.hf")

SPACE_URL = "https://huggingface.co/spaces/open-llm-leaderboard/open_llm_leaderboard"


def fetch() -> dict[str, Any]:
    try:
        with make_client() as client:
            resp = client.get(SPACE_URL)
            resp.raise_for_status()
            # The Space page itself is a shell; the actual table is loaded
            # from the Gradio backend. Without a Gradio client we cannot
            # reliably extract rows. Intentionally bail to nothing.
            raise RuntimeError("HF leaderboard is a Gradio Space; needs gradio_client to parse")
    except Exception as e:  # noqa: BLE001
        # open-llm-leaderboard 已归档停更，页面是 Gradio Space 外壳，datasets-server
        # 对 open-llm-leaderboard/results 的转换也报错。抓不到就返回空，不编分数。
        log.warning("HF fetch failed (no rows contributed): %s", e)
        return {
            "source": "huggingface",
            "models": [],
            "is_mock": False,
            "error": f"unavailable: {type(e).__name__}: {e}",
        }
