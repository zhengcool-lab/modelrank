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
import re
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
    if vendor == "DeepSeek":
        return _fetch_deepseek(url)
    try:
        with make_client() as client:
            resp = client.get(url)
            resp.raise_for_status()
            # 官网定价页多为反爬（OpenAI 403）或客户端渲染，无可靠 DOM 契约。
            # 这些厂商的价格统一走 OpenRouter 公开模型清单（见 _fetch_openrouter）。
            return None
    except Exception as e:  # noqa: BLE001
        log.warning("vendor %s live fetch failed: %s", vendor, e)
        return None


# ---- OpenRouter 公开模型清单（真实挂牌价，支持无 key 访问） ------------------

OPENROUTER_URL = "https://openrouter.ai/api/v1/models"

# OpenRouter id 前缀 → 本站展示用厂商名
PREFIX_TO_VENDOR: dict[str, str] = {
    "openai": "OpenAI",
    "anthropic": "Anthropic",
    "google": "Google",
    "qwen": "Alibaba",
    "deepseek": "DeepSeek",
}

_OR_VENDOR_PREFIX_RE = re.compile(r"^[^:]+:\s*")


def _fetch_openrouter() -> dict[str, list[dict[str, Any]]]:
    """拉 OpenRouter 公开模型清单，按厂商分组返回真实每百万 token 单价。

    这是替代官网 HTML 抓取的稳定结构化源（官网页 OpenAI 403、Google 超时、
    其余为客户端渲染表格）。只取常规挂牌价：`:batch` / `:free` 等变体带冒号
    后缀，价格不同口径，一律排除。整体失败返回空 dict，各厂商再各自回退。
    """
    try:
        with make_client() as client:
            resp = client.get(OPENROUTER_URL, timeout=40)
            resp.raise_for_status()
            payload = resp.json()
    except Exception as e:  # noqa: BLE001
        log.warning("openrouter: 模型清单抓取失败: %s", e)
        return {}

    by_vendor: dict[str, list[dict[str, Any]]] = {}
    for m in payload.get("data") or []:
        mid = m.get("id") or ""
        if not mid or ":" in mid:
            continue
        prefix = mid.split("/")[0]
        vendor = PREFIX_TO_VENDOR.get(prefix)
        if not vendor:
            continue
        pricing = m.get("pricing") or {}
        try:
            pin = float(pricing.get("prompt")) * 1_000_000
            pout = float(pricing.get("completion")) * 1_000_000
        except (TypeError, ValueError):
            continue
        if pin <= 0 or pout <= 0:
            continue
        raw_name = (m.get("name") or mid.split("/")[-1]).strip()
        name = _OR_VENDOR_PREFIX_RE.sub("", raw_name) or mid.split("/")[-1]
        by_vendor.setdefault(vendor, []).append(
            blank_model(
                vendor=vendor,
                name=name,
                price_input_per_mtok=round(pin, 4),
                price_output_per_mtok=round(pout, 4),
                context_length=m.get("context_length"),
                source_url=f"https://openrouter.ai/{mid}",
                captured_at=now_iso(),
            )
        )
    for v, rows in by_vendor.items():
        log.info("vendor %s: %d live rows (openrouter)", v, len(rows))
    return by_vendor



# ---- DeepSeek pricing page parser -----------------------------------------

_PRICE_RE = re.compile(r"\$\s*([0-9]+(?:\.[0-9]+)?)")


def _parse_price_cell(text: str) -> float | None:
    m = _PRICE_RE.search(text or "")
    if not m:
        return None
    try:
        return float(m.group(1))
    except ValueError:
        return None


def _strip_footnote(name: str) -> str:
    # "deepseek-flash (1)" -> "deepseek-flash"
    return re.sub(r"\s*\(\d+\)\s*$", "", (name or "")).strip()


def _parse_deepseek_html(html: str, url: str) -> list[dict[str, Any]] | None:
    """Parse the DeepSeek Models & Pricing table.

    The page renders a single wide table with one label column and one column
    per model. We locate the pricing block and pull PEAK rates (cache-miss
    input + output) as the list price. Peak rates are the vendor's headline
    number; off-peak is exactly half per the footnote.
    """
    from bs4 import BeautifulSoup

    soup = BeautifulSoup(html, "html.parser")
    tables = soup.find_all("table")
    target: Any = None
    for t in tables:
        head = t.find("tr")
        if head and "MODEL" in head.get_text(" ").upper():
            target = t
            break
    if target is None:
        return None

    rows = target.find_all("tr")
    if not rows:
        return None

    # First row carries the model names in columns after the label cell.
    first_cells = rows[0].find_all(["th", "td"])
    model_names: list[str] = []
    for c in first_cells[1:]:
        # skip cells that span the whole label row
        if int(c.get("colspan", 1)) > 1 and not c.get_text(strip=True).startswith("deepseek"):
            continue
        nm = _strip_footnote(c.get_text(" ", strip=True))
        if nm:
            model_names.append(nm)
    if not model_names:
        return None

    # Walk rows, tracking which pricing block we are inside. For each model
    # column we collect peak cache-miss input and peak output.
    n_models = len(model_names)
    input_peak: list[float | None] = [None] * n_models
    output_peak: list[float | None] = [None] * n_models
    in_block: str | None = None  # "cache_hit" | "cache_miss" | "output"

    for tr in rows[1:]:
        cells = tr.find_all(["th", "td"])
        labels = [c.get_text(" ", strip=True) for c in cells]
        joined = " ".join(labels).upper()

        if "CACHE HIT" in joined:
            in_block = "cache_hit"
            continue
        if "CACHE MISS" in joined:
            in_block = "cache_miss"
            continue
        if "OUTPUT TOKENS" in joined:
            in_block = "output"
            continue
        # Rows that are not OFF-PEAK/PEAK sub-rows reset state (e.g.
        # CONTEXT LENGTH, CONCURRENCY LIMIT, FEATURES).
        is_peak_row = any(c.strip().upper() == "PEAK" for c in labels)
        is_offpeak_row = any(c.strip().upper() == "OFF-PEAK" for c in labels)
        if not (is_peak_row or is_offpeak_row):
            in_block = None
            continue
        if not is_peak_row:
            continue
        if in_block not in ("cache_miss", "output"):
            continue

        # Price cells are the trailing numeric cells in this row. Because of
        # rowspans the cell count varies; collect all $ values present.
        prices = [_parse_price_cell(c.get_text(" ", strip=True)) for c in cells]
        prices = [p for p in prices if p is not None]
        if len(prices) < n_models:
            continue
        # The first n_models prices are the per-model peak values.
        for i in range(n_models):
            val = prices[i]
            if in_block == "cache_miss":
                input_peak[i] = val
            elif in_block == "output":
                output_peak[i] = val

    out: list[dict[str, Any]] = []
    for i, name in enumerate(model_names):
        pin, pout = input_peak[i], output_peak[i]
        if pin is None or pout is None:
            log.warning("deepseek: missing price for %s (in=%s out=%s)", name, pin, pout)
            continue
        out.append(
            blank_model(
                vendor="DeepSeek",
                name=name,
                price_input_per_mtok=pin,
                price_output_per_mtok=pout,
                context_length=1_000_000,
                source_url=url,
                captured_at=now_iso(),
            )
        )
    return out or None


def _fetch_deepseek(url: str) -> list[dict[str, Any]] | None:
    """Fetch DeepSeek pricing. The bare pretty URL is mis-served by the
    static host (returns the 'Your First API Call' shell), so we retry with
    an explicit /index.html path if the first parse yields no rows.
    """
    candidates = [url]
    if not url.endswith("/index.html"):
        candidates.append(url.rstrip("/") + "/index.html")

    last_err: Exception | None = None
    for u in candidates:
        try:
            with make_client() as client:
                resp = client.get(u)
                resp.raise_for_status()
                rows = _parse_deepseek_html(resp.text, url)
                if rows:
                    log.info("deepseek: parsed %d rows from %s", len(rows), u)
                    return rows
                log.warning("deepseek: no pricing rows parsed from %s", u)
        except Exception as e:  # noqa: BLE001
            last_err = e
            log.warning("deepseek fetch failed for %s: %s", u, e)
    if last_err is not None:
        log.warning("deepseek: all candidates failed (%s); falling back to mock", last_err)
    return None


def fetch_all() -> list[dict[str, Any]]:
    """每家厂商按优先级取真实数据：OpenRouter（五家同口径）→ 官网解析 → mock。"""
    or_rows = _fetch_openrouter()
    out: list[dict[str, Any]] = []
    for cfg in VENDORS:
        vendor = cfg["vendor"]
        rows = or_rows.get(vendor)
        if rows:
            out.append({"source": f"vendor:{vendor}", "models": rows, "is_mock": False, "error": None})
            continue
        live = _try_live(vendor, cfg["url"])
        if live:
            log.info("vendor %s: %d live rows (official page)", vendor, len(live))
            out.append({"source": f"vendor:{vendor}", "models": live, "is_mock": False, "error": None})
            continue
        log.warning("vendor %s: no live rows extracted, using mock pricing", vendor)
        out.append(
            {
                "source": f"vendor:{vendor}",
                "models": _to_rows(vendor, cfg["url"], cfg["mock"]),
                "is_mock": True,
                "error": "no live source available; using curated mock",
            }
        )
    return out
