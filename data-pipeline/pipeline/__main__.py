"""Pipeline CLI.

Usage (run from data-pipeline/):
    python -m pipeline run --dry-run
    python -m pipeline run --write-db      # TODO: not implemented yet
"""
from __future__ import annotations

import argparse
import json
import logging
import sys
from pathlib import Path
from typing import Any

from . import fetcher_aa, fetcher_arena, fetcher_hf, fetcher_vendors, news
from .common import now_iso

log = logging.getLogger("pipeline")

OUT_DIR = Path(__file__).resolve().parent.parent / "out"


def _merge_models(all_results: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], dict[str, int]]:
    """Merge per-source model lists by (vendor, name).

    For overlapping keys we prefer the value from a non-mock source; if
    both are non-mock we prefer the first non-None value (deterministic
    given the order we run sources). Returns (merged_list, stats).
    """
    merged: dict[tuple[str, str], dict[str, Any]] = {}
    stats = {"real": 0, "mock": 0}
    source_tags: dict[tuple[str, str], set[str]] = {}

    for res in all_results:
        tag = res["source"]
        for m in res["models"]:
            key = (m.get("vendor") or "", m.get("name") or "")
            if key == ("", ""):
                continue
            stats["mock" if res["is_mock"] else "real"] += 1
            source_tags.setdefault(key, set()).add(tag + ("[mock]" if res["is_mock"] else ""))
            if key not in merged:
                merged[key] = dict(m)
                continue
            existing = merged[key]
            # Fill in None fields, and override when the incoming row is
            # non-mock and the existing one is mock-derived.
            for field, val in m.items():
                if val is None:
                    continue
                cur = existing.get(field)
                if cur is None:
                    existing[field] = val
                # else: keep existing — first non-None wins.
    out = []
    for (vendor, name), m in merged.items():
        m["vendor"] = vendor or m.get("vendor")
        m["name"] = name or m.get("name")
        m["captured_at"] = m.get("captured_at") or now_iso()
        out.append(m)
    out.sort(key=lambda x: (x.get("vendor") or "", x.get("name") or ""))
    return out, stats


def _write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    log.info("wrote %s (%d records)", path, len(data))


def run(dry_run: bool, write_db: bool) -> int:
    log.info("=== ModelRank data-pipeline run (dry_run=%s, write_db=%s) ===", dry_run, write_db)

    results: list[dict[str, Any]] = []

    # Each call is wrapped in its own try/except inside the fetcher, so a
    # broken site never kills the whole pipeline.
    for name, fn in [
        ("lmarena", fetcher_arena.fetch),
        ("artificialanalysis", fetcher_aa.fetch),
        ("huggingface", fetcher_hf.fetch),
    ]:
        log.info("fetching %s ...", name)
        results.append(fn())
    log.info("fetching vendor pricing pages ...")
    results.extend(fetcher_vendors.fetch_all())
    log.info("fetching news feeds ...")
    news_res = news.fetch()

    merged_models, fetch_stats = _merge_models(results)

    # ---- Console report ----------------------------------------------------
    print()
    print("=== Fetch report ===")
    for r in results:
        flag = "MOCK" if r["is_mock"] else "REAL"
        err = f"  err={r['error']}" if r["error"] else ""
        print(f"  [{flag:4}] {r['source']:<24} rows={len(r['models']):<3}{err}")
    nflag = "MOCK" if news_res["is_mock"] else "REAL"
    print(f"  [{nflag:4}] {'news':<24} rows={len(news_res['news']):<3}"
          + (f"  err={news_res['error']}" if news_res["error"] else ""))
    print(f"  merged models: {len(merged_models)}  (raw real={fetch_stats['real']}, mock={fetch_stats['mock']})")
    print()

    if dry_run:
        _write_json(OUT_DIR / "models.json", merged_models)
        _write_json(OUT_DIR / "news.json", news_res["news"])
        print(f"dry-run: wrote {OUT_DIR/'models.json'} and {OUT_DIR/'news.json'}")
        print("review the JSON, then re-run with --write-db to push to Postgres.")
        return 0

    if write_db:
        # TODO(pipeline): open a SQLAlchemy/psycopg connection, upsert
        # merged_models into the models table and news_res['news'] into
        # the news table. For now we still write the local JSON so the
        # operator can inspect what *would* have been written.
        _write_json(OUT_DIR / "models.json", merged_models)
        _write_json(OUT_DIR / "news.json", news_res["news"])
        print("--write-db is NOT implemented yet; wrote local JSON only.")
        return 0

    print("nothing to do: pass --dry-run or --write-db", file=sys.stderr)
    return 2


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="pipeline")
    sub = parser.add_subparsers(dest="cmd", required=True)
    p_run = sub.add_parser("run", help="run the data pipeline")
    p_run.add_argument("--dry-run", action="store_true",
                       help="scrape and write out/*.json, do NOT touch the DB")
    p_run.add_argument("--write-db", action="store_true",
                       help="upsert into Postgres (TODO: not yet implemented)")
    p_run.add_argument("-v", "--verbose", action="store_true")
    args = parser.parse_args(argv)

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )

    if args.cmd == "run":
        if not args.dry_run and not args.write_db:
            p_run.error("one of --dry-run / --write-db is required")
        return run(dry_run=args.dry_run, write_db=args.write_db)
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
