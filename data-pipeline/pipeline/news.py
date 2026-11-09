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
# 单一信源会让"新闻"变成某家公司的通稿列表，因此显式保留中文 + 英文多源。
# 2026-11-09 实测（逐个抓正文首字节确认是真 RSS）：
#   机器之心 /rss 302 到 data-service、36氪 /feed 返回非良构 XML → 不是真 feed，已移除；
#   Anthropic 官方 feed 404、HuggingFace / Meta / NVIDIA feed 不可达 → 未收录。
#   雷峰网、极客公园、OpenAI、Google、TechCrunch、The Verge 可用。
FEEDS = [
    ("雷峰网", "https://www.leiphone.com/feed"),
    ("极客公园", "https://www.geekpark.net/rss"),
    ("OpenAI", "https://openai.com/news/rss.xml"),
    ("Google AI Blog", "https://blog.google/innovation-and-ai/technology/ai/rss/"),
    ("TechCrunch AI", "https://techcrunch.com/category/artificial-intelligence/feed/"),
    ("The Verge AI", "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml"),
]

ALLOWED_CATEGORIES = {"发布", "评测", "融资", "政策", "价格"}

# 标题关键词 -> 分类（正则，英文一律要求词边界）
# 反例教训：旧的裸子串匹配把 "Corporate"（含 rate）判成价格、把 "LifeVal"（含 eval）
# 判成评测、把 "cost-effective"（含 cost）判成价格。这里改为词边界 + 明确的定价短语。
CATEGORY_KEYWORDS: list[tuple[str, tuple[str, ...]]] = [
    (
        "价格",
        (
            r"\bpric(e|es|ed|ing)\b",
            r"\bprice\s+(cut|drop|increase|hike|change)\b",
            r"\bcost\s*-?\s*(cut|reduction|saving)\b",
            r"\bsubscription\s+(fee|price|tier)\b",
            r"\bper\s+(month|seat)\b",
            r"降价|涨价|调价|定价|提价|计费|收费|价格|订阅费|月费",
        ),
    ),
    (
        "评测",
        (
            r"\bbenchmark(s|ed|ing)?\b",
            r"\beval(uation)?s?\b",
            r"\bleaderboard\b",
            r"\barena\b",
            r"\branking(s)?\b",
            r"\bscore(s|d)?\b",
            r"评测|测评|实测|横评|跑分|榜单|排行|基准测试",
        ),
    ),
    (
        "融资",
        (
            r"\bfunding\b",
            r"\braise(s|d)?\s+(a\s+)?\$",
            r"\bseries\s+[a-e]\b",
            r"\bvaluation\b",
            r"\bipo\b",
            r"融资|估值|轮融资|领投|募资",
        ),
    ),
    (
        "政策",
        (
            r"\bpolicy\b",
            r"\bregulat(ion|ions|ory|e|es)\b",
            r"\bai\s+act\b",
            r"\bcompliance\b",
            r"\b(governments?|senate|congress|parliament)\b",
            r"政策|监管|合规|备案|法案|立法|治理",
        ),
    ),
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
    """标题分类。命中顺序：价格 > 评测 > 融资 > 政策，未命中归为发布。"""
    low = title.lower()
    for cat, patterns in CATEGORY_KEYWORDS:
        for pat in patterns:
            if re.search(pat, low):
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
    """RSS pubDate / Atom updated -> ISO-8601 with +08:00 offset.

    Atom 的 updated 是 ISO-8601（2026-11-09T08:31:18Z），parsedate_to_datetime
    只认 RFC822，解析失败会让整批条目回退成 now，从而全部堆到列表顶部。
    这里按 RFC822 → ISO-8601 顺序尝试，只有都失败才回退 now。
    """
    raw = (pub_raw or "").strip()
    dt: datetime | None = None
    if raw:
        try:
            dt = parsedate_to_datetime(raw)
        except Exception:  # noqa: BLE001 - RFC822 失败后按 ISO 再试
            dt = None
        if dt is None:
            try:
                dt = datetime.fromisoformat(raw.replace("Z", "+00:00"))
            except Exception:  # noqa: BLE001
                dt = None
    if dt is None:
        return now_iso()
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone(timedelta(hours=8))).strftime("%Y-%m-%dT%H:%M:%S+08:00")


def _sanitize_xml(xml_text: str) -> str:
    """把常见不合法的 XML 修到可解析：控制字符、裸 &、多余 BOM。

    国内 rss（机器之心 / 36氪）经常在 description 里塞未转义的 & 或 HTML 实体，
    ElementTree 会直接 not well-formed。先做最小清洗再重试，不静默丢整源。
    """
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", "", xml_text)
    text = re.sub(r"&(?!#?\w+;)", "&amp;", text)
    text = text.lstrip("\ufeff").strip()
    return text


def _parse_feed(xml_text: str, source_label: str) -> list[dict[str, Any]]:
    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError:
        root = ET.fromstring(_sanitize_xml(xml_text))
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
    # 本次抓取优先：历史条目里可能残留旧版本时间戳（例如 Atom 解析失败被写成 now），
    # 若先按时间排序再去重，这些假时间会压过刚抓到的同标题条目。
    fresh_titles = {
        re.sub(r"[^a-z0-9\u4e00-\u9fff]", "", n["title"].lower()) for n in deduped
    }
    merged = [h for h in history if h.get("title") and re.sub(r"[^a-z0-9\u4e00-\u9fff]", "", h["title"].lower()) not in fresh_titles] + deduped
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
    # 信源多样性：逐条按时间挑选时给每个信源设上限，避免单个 feed 占满列表；
    # 上限不满足总数时再按时间回填，保证条数不因限流而缩水。
    limit = 60
    per_source_cap = max(6, limit // 3)
    picked: list[dict[str, Any]] = []
    overflow: list[dict[str, Any]] = []
    counts: dict[str, int] = {}
    for n in final:
        src = str(n.get("source") or "")
        if counts.get(src, 0) >= per_source_cap:
            overflow.append(n)
            continue
        counts[src] = counts.get(src, 0) + 1
        picked.append(n)
    picked.extend(overflow[: max(0, limit - len(picked))])
    picked.sort(key=lambda n: n.get("time", ""), reverse=True)
    return {"source": "news", "news": picked[:limit], "is_mock": False, "error": None}
