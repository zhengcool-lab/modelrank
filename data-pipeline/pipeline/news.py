"""News collector for out/news.json.

Tries vendor official RSS feeds plus Chinese AI media RSS (stable from CN
network); falls back to curated placeholder headlines only when ALL feeds
fail. Categories constrained to the PRD enum: 发布 | 评测 | 融资 | 政策 | 价格.

Output item schema (frontend UINewsItem-compatible):
    {
        "id": "n<seq>",
        "category": "发布|评测|融资|政策|价格",
        "title": str,
        "summary": str,            # derived from feed description, truncated
        "source": str,             # human-readable source label
        "time": ISO-8601 +08:00,   # derived from pubDate/updated
        "related_model": str | None,
        "url": str,
    }
"""
from __future__ import annotations

import logging
import re
from datetime import datetime, timezone, timedelta
from email.utils import parsedate_to_datetime
from typing import Any
from xml.etree import ElementTree as ET

from bs4 import BeautifulSoup

from .common import make_client, now_iso

log = logging.getLogger("pipeline.news")

# 中文媒体优先（国内网络稳定），官方 RSS 尽量补
FEEDS = [
    ("机器之心", "https://www.jiqizhixin.com/rss"),
    ("36氪", "https://36kr.com/feed"),
    ("OpenAI", "https://openai.com/news/rss.xml"),
    ("Anthropic", "https://www.anthropic.com/feed.xml"),
    ("Google AI Blog", "https://blog.google/technology/ai/rss/"),
]

ALLOWED_CATEGORIES = {"发布", "评测", "融资", "政策", "价格"}

# 标题关键词 -> 分类（命中优先，按顺序判断）
CATEGORY_KEYWORDS: list[tuple[str, tuple[str, ...]]] = [
    ("价格", ("price", "pricing", "cost", "cut", "reduce", "discount", "rate", "降价", "涨价", "下调", "价格", "收费", "成本", "定价")),
    ("评测", ("benchmark", "eval", "arena", "ranking", "score", "blind", "胜率", "评测", "榜单", "跑分", "排行")),
    ("融资", ("funding", "raise", "series", "valuation", "invest", "融资", "估值", "投资", "轮")),
    ("政策", ("policy", "regulation", "act", "compliance", "oversight", "政策", "监管", "合规", "备案", "法案", "治理")),
]

# 模型名关键词 -> relatedModel（标题命中即关联）
MODEL_KEYWORDS: list[tuple[str, str]] = [
    ("GPT-6", "gpt-6"), ("GPT-5", "gpt-5"), ("GPT-4", "gpt-4"),
    ("Claude Opus 4.5", "claude opus 4.5"), ("Claude Sonnet 4.5", "claude sonnet 4.5"),
    ("Claude", "claude"),
    ("Gemini 3 Pro", "gemini 3 pro"), ("Gemini", "gemini"),
    ("DeepSeek", "deepseek"),
    ("Qwen3-Max", "qwen3-max"), ("Qwen", "qwen"), ("通义", "通义"), ("千问", "千问"),
    ("Llama", "llama"),
    ("Mistral", "mistral"),
    ("Kimi", "kimi"), ("Moonshot", "moonshot"), ("月之暗面", "月之暗面"),
    ("豆包", "豆包"), ("Doubao", "doubao"),
    ("文心", "文心"), ("ERNIE", "ernie"),
    ("GLM", "glm"), ("智谱", "智谱"),
    ("Phi", "phi"), ("Microsoft", "microsoft"),
    ("MiniMax", "minimax"),
    ("LongCat", "longcat"), ("美团", "美团"),
    ("百川", "百川"), ("Baichuan", "baichuan"),
    ("混元", "混元"), ("Hunyuan", "hunyuan"),
    ("Step", "step"), ("阶跃", "阶跃"),
    ("Grok", "grok"),
]


def _mock() -> list[dict[str, Any]]:
    log.warning("news: all feeds failed, falling back to mock headlines")
    ts = now_iso()
    return [
        {
            "id": "n-mock-1",
            "category": "发布",
            "title": "OpenAI releases GPT-5 with improved reasoning and agentic tool use",
            "summary": "Official blog update, API grayscale rollout.",
            "source": "OpenAI",
            "time": ts,
            "related_model": "GPT-5",
            "url": "https://openai.com/news/",
        },
        {
            "id": "n-mock-2",
            "category": "发布",
            "title": "Anthropic ships Claude update with 200K context",
            "summary": "Official news update.",
            "source": "Anthropic",
            "time": ts,
            "related_model": "Claude",
            "url": "https://www.anthropic.com/news",
        },
    ]


def _clean(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "")).strip()


def _summary_from_description(desc: str | None, max_len: int = 110) -> str:
    if not desc:
        return ""
    text = BeautifulSoup(desc, "html.parser").get_text(" ", strip=True)
    text = _clean(text)
    if len(text) > max_len:
        return text[: max_len - 1].rstrip() + "…"
    return text


def _classify(title: str) -> str:
    low = title.lower()
    for cat, kws in CATEGORY_KEYWORDS:
        for kw in kws:
            if kw in low:
                return cat
    return "发布"


def _related_model(title: str) -> str | None:
    low = title.lower()
    for name, kw in MODEL_KEYWORDS:
        if kw in low:
            return name
    return None


def _parse_rss2(item) -> dict[str, Any] | None:
    title = _clean(item.findtext("title"))
    if not title:
        return None
    link = _clean(item.findtext("link"))
    desc = item.findtext("description") or item.findtext("encoded") or ""
    pub = _clean(item.findtext("pubDate"))
    return {
        "title": title,
        "url": link or "",
        "summary_raw": desc,
        "pub_raw": pub,
    }


def _parse_atom(entry, ns: dict[str, str]) -> dict[str, Any] | None:
    title = _clean(entry.findtext("a:title", default="", namespaces=ns))
    if not title:
        return None
    link_el = entry.find("a:link", ns)
    link = link_el.get("href", "") if link_el is not None else ""
    desc = entry.findtext("a:summary", default="", namespaces=ns) or entry.findtext("a:content", default="", namespaces=ns) or ""
    pub = _clean(entry.findtext("a:updated", default="", namespaces=ns))
    return {
        "title": title,
        "url": link or "",
        "summary_raw": desc,
        "pub_raw": pub,
    }


def _to_iso(pub_raw: str) -> str:
    """RSS pubDate / Atom updated -> ISO-8601 with +08:00 offset."""
    try:
        dt = parsedate_to_datetime(pub_raw)
        if dt is None:
            raise ValueError("unparseable")
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone(timedelta(hours=8))).strftime("%Y-%m-%dT%H:%M:%S+08:00")
    except Exception:
        return now_iso()


def _parse_feed(xml_text: str, source_label: str) -> list[dict[str, Any]]:
    root = ET.fromstring(xml_text)
    items: list[dict[str, Any]] = []
    for item in root.findall("./channel/item"):
        parsed = _parse_rss2(item)
        if parsed:
            items.append(parsed)
    ns = {"a": "http://www.w3.org/2005/Atom"}
    for entry in root.findall("a:entry", ns):
        parsed = _parse_atom(entry, ns)
        if parsed:
            items.append(parsed)
    out: list[dict[str, Any]] = []
    for i, it in enumerate(items[:12], start=1):
        out.append(
            {
                "id": f"n-{source_label}-{i}",
                "category": _classify(it["title"]),
                "title": it["title"],
                "summary": _summary_from_description(it["summary_raw"]),
                "source": source_label,
                "time": _to_iso(it["pub_raw"]),
                "related_model": _related_model(it["title"]),
                "url": it["url"],
            }
        )
    return out


def _load_history() -> list[dict[str, Any]]:
    """读取上次落盘的 out/news.json（兼容数组/对象结构），返回历史新闻。"""
    try:
        import json
        from pathlib import Path
        p = Path(__file__).resolve().parent.parent / "out" / "news.json"
        if not p.exists():
            return []
        data = json.loads(p.read_text(encoding="utf-8"))
        if isinstance(data, list):
            return data
        return data.get("news", [])
    except Exception:
        return []


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
                log.info("news: %s -> %d items (real)", label, len(items))
                collected.extend(items)
            except Exception as e:  # noqa: BLE001
                errors.append(f"{label}: {type(e).__name__}: {str(e)[:80]}")
                log.warning("feed %s failed: %s", label, e)
    if not collected:
        return {
            "source": "news",
            "news": _mock(),
            "is_mock": True,
            "error": "; ".join(errors) or "no feeds returned items",
        }
    # Dedupe by normalized title
    seen: set[str] = set()
    deduped: list[dict[str, Any]] = []
    for n in collected:
        key = re.sub(r"[^a-z0-9\u4e00-\u9fff]", "", n["title"].lower())
        if not key or key in seen:
            continue
        seen.add(key)
        if n.get("category") not in ALLOWED_CATEGORIES:
            n["category"] = "发布"
        deduped.append(n)
    # 历史合并：把上次落盘的历史新闻追加回来（防止单源覆盖丢失），
    # 按时间降序、按标题去重，保留上限 60 条。
    history = _load_history()
    merged = deduped + [h for h in history if h.get("title")]
    merged.sort(key=lambda n: n.get("time", ""), reverse=True)
    final: list[dict[str, Any]] = []
    seen_titles: set[str] = set()
    seen_ids: set[str] = set()
    for n in merged:
        key = re.sub(r"[^a-z0-9\u4e00-\u9fff]", "", n["title"].lower())
        if not key or key in seen_titles:
            continue
        seen_titles.add(key)
        nid = n.get("id") or ""
        if nid in seen_ids or not str(nid).startswith("n-"):
            nid = f"n-{n.get('source') or 'news'}-dup-{len(final) + 1}"
        seen_ids.add(nid)
        n["id"] = nid
        final.append(n)
    return {"source": "news", "news": final[:60], "is_mock": False, "error": None}
