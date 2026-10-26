"""News collector for out/news.json.

Tries a handful of vendor / community RSS feeds; on failure falls back to
curated placeholder headlines. Categories are constrained to the enum in
the PRD: 发布 | 评测 | 融资 | 政策 | 价格.
"""
from __future__ import annotations

import logging
import re
from typing import Any
from xml.etree import ElementTree as ET

from .common import make_client, now_iso

log = logging.getLogger("pipeline.news")

FEEDS = [
    ("OpenAI Blog", "https://openai.com/blog/rss.xml"),
    ("Anthropic News", "https://www.anthropic.com/news/rss.xml"),
    ("Google AI Blog", "https://blog.google/technology/ai/rss/"),
]

ALLOWED_CATEGORIES = {"发布", "评测", "融资", "政策", "价格"}


def _mock() -> list[dict[str, Any]]:
    log.warning("news: falling back to mock headlines")
    ts = now_iso()
    return [
        {
            "title": "OpenAI releases GPT-5 with improved reasoning and agentic tool use",
            "category": "发布",
            "source_url": "https://openai.com/blog/",
            "published_at": ts,
            "related_model": "GPT-5",
        },
        {
            "title": "Anthropic ships Claude 3.5 Sonnet update with 200K context",
            "category": "发布",
            "source_url": "https://www.anthropic.com/news",
            "published_at": ts,
            "related_model": "Claude 3.5 Sonnet",
        },
        {
            "title": "DeepSeek cuts V3 API prices by 50% to gain market share",
            "category": "价格",
            "source_url": "https://api-docs.deepseek.com/quick_start/pricing",
            "published_at": ts,
            "related_model": "deepseek-chat (V3)",
        },
        {
            "title": "EU AI Act enforcement phase 2 begins for frontier model providers",
            "category": "政策",
            "source_url": "https://artificialanalysis.ai/",
            "published_at": ts,
            "related_model": None,
        },
    ]


def _parse_feed(xml_text: str, source_label: str) -> list[dict[str, Any]]:
    root = ET.fromstring(xml_text)
    items: list[dict[str, Any]] = []
    # RSS 2.0: rss/channel/item ; Atom: feed/entry
    for item in root.iter() if False else []:  # placeholder, replaced below
        pass
    # RSS
    for item in root.findall("./channel/item"):
        title = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        pub = (item.findtext("pubDate") or "").strip()
        if title:
            items.append(
                {
                    "title": title,
                    "category": "发布",  # TODO: classify with keywords once volume grows
                    "source_url": link or f"feed:{source_label}",
                    "published_at": pub or now_iso(),
                    "related_model": None,
                }
            )
    # Atom
    ns = {"a": "http://www.w3.org/2005/Atom"}
    for entry in root.findall("a:entry", ns):
        title = (entry.findtext("a:title", default="", namespaces=ns) or "").strip()
        link_el = entry.find("a:link", ns)
        link = link_el.get("href", "") if link_el is not None else ""
        pub = (entry.findtext("a:updated", default="", namespaces=ns) or "").strip()
        if title:
            items.append(
                {
                    "title": title,
                    "category": "发布",
                    "source_url": link or f"feed:{source_label}",
                    "published_at": pub or now_iso(),
                    "related_model": None,
                }
            )
    return items


def fetch() -> dict[str, Any]:
    collected: list[dict[str, Any]] = []
    errors: list[str] = []
    with make_client() as client:
        for label, url in FEEDS:
            try:
                resp = client.get(url)
                resp.raise_for_status()
                items = _parse_feed(resp.text, label)
                if not items:
                    raise RuntimeError("feed parsed but 0 items")
                collected.extend(items[:10])
            except Exception as e:  # noqa: BLE001
                errors.append(f"{label}: {type(e).__name__}: {e}")
                log.warning("feed %s failed: %s", label, e)
    if not collected:
        return {
            "source": "news",
            "news": _mock(),
            "is_mock": True,
            "error": "; ".join(errors) or "no feeds returned items",
        }
    # Dedupe by title
    seen: set[str] = set()
    deduped = []
    for n in collected:
        key = re.sub(r"\s+", " ", n["title"]).lower()
        if key in seen:
            continue
        seen.add(key)
        # Normalize category to allowed enum; unknown -> 发布
        if n.get("category") not in ALLOWED_CATEGORIES:
            n["category"] = "发布"
        deduped.append(n)
    return {"source": "news", "news": deduped[:30], "is_mock": False, "error": None}
