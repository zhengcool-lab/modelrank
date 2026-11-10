#!/usr/bin/env python3
"""Agent 套餐价格一致性：基准 JSON ↔ apps/web/src/lib/agent-data.ts。

用法：
  sync-agent-pricing.py --check                     # 比对源码与基准，漂移时退出码 2
  sync-agent-pricing.py --write                     # 把基准回写到 agent-data.ts（自动修复）
  sync-agent-pricing.py --verify-page <html文件>    # 校验官方定价页是否仍含基准价位/档位名

设计原则：
- 基准（data-pipeline/reference/agent-pricing.json）是套餐价位/档位的唯一权威，来源是人工逐档核对的官方定价页；
- 只改 agent-data.ts 里对应产品的 plans 数组，不动其它产品、不动其它字段；
- priceCheckedAt 的权威属于每日定价核对流程（check-agent-pricing.py + refresh-agent-price-date.py）：
  核对通过才允许刷成当天，本脚本不把单纯日期差异判为漂移，也不回退日期，避免两条流程互相打架；
- 无法可靠解析时宁可报错退出，也不做「猜着改」。
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
REF = os.path.join(ROOT, "data-pipeline", "reference", "agent-pricing.json")
SRC = os.path.join(ROOT, "apps", "web", "src", "lib", "agent-data.ts")

FIELD_ORDER = ("name", "monthly", "annual", "promo", "currency", "perSeat", "quota", "note")


def load_ref():
    with open(REF, encoding="utf-8") as f:
        return json.load(f)


def read_src():
    with open(SRC, encoding="utf-8") as f:
        return f.read()


def product_span(text, pid):
    """返回该产品对象在源码中的 [start, end)，按 `id: "<pid>",` 定位到下一个 `  {` 或数组结尾。"""
    key = 'id: "%s",' % pid
    i = text.find(key)
    if i < -1:
        raise SystemExit("找不到产品 id=%s" % pid)
    # 产品对象结束：从 id 起找到下一个顶层 `\n  {` 或数组结尾
    end = len(text)
    for m in re.finditer(r"\n  \{\n", text[i:]):
        end = i + m.start()
        break
    close = text.find("\n  },\n", i)
    if close != -1:
        end = min(end, close)
    return i, end


PLAN_LINE = re.compile(r"\{([^{}]*)\}")


def parse_plans(block):
    """把 plans 数组块解析成 dict 列表（只认 AgentPlan 的字段）。"""
    plans = []
    for m in PLAN_LINE.finditer(block):
        body = m.group(1)
        item = {}
        for part in re.finditer(
            r'(name|monthly|annual|promo|currency|perSeat|quota|note): (("[^"]*")|(true|false)|(-?\d+(?:\.\d+)?))',
            body,
        ):
            k, raw = part.group(1), part.group(2)
            if raw.startswith('"'):
                item[k] = raw[1:-1]
            elif raw in ("true", "false"):
                item[k] = raw == "true"
            else:
                item[k] = float(raw) if "." in raw else int(raw)
        if item:
            plans.append(item)
    return plans


def render_plans(plans):
    lines = ["    plans: ["]
    for p in plans:
        parts = []
        for k in FIELD_ORDER:
            if k not in p:
                continue
            v = p[k]
            if isinstance(v, bool):
                parts.append("%s: %s" % (k, "true" if v else "false"))
            elif isinstance(v, str):
                parts.append('%s: "%s"' % (k, v))
            elif isinstance(v, float) and v.is_integer():
                parts.append("%s: %d" % (k, v))
            else:
                parts.append("%s: %s" % (k, v))
        lines.append("      { %s }," % ", ".join(parts))
    lines.append("    ],")
    return "\n".join(lines)


def diff_plans(ref_plans, cur_plans):
    diffs = []
    ref_by = {p["name"]: p for p in ref_plans}
    cur_by = {p.get("name"): p for p in cur_plans}
    for name in sorted(set(ref_by) | set(cur_by)):
        if name not in cur_by:
            diffs.append("+ 缺档位 %s（基准 %s）" % (name, ref_by[name]))
        elif name not in ref_by:
            diffs.append("- 多出档位 %s（源码 %s）" % (name, cur_by[name]))
        else:
            r, c = ref_by[name], cur_by[name]
            for k in FIELD_ORDER:
                if r.get(k) != c.get(k):
                    diffs.append("~ %s.%s 源码=%r 基准=%r" % (name, k, c.get(k), r.get(k)))
    return diffs


def do_check(ref):
    text = read_src()
    bad = 0
    for prod in ref["products"]:
        pid = prod["id"]
        start, end = product_span(text, pid)
        block = text[start:end]
        m = re.search(r"plans: \[.*?\n    \],", block, re.S)
        if not m:
            print("!! %s 找不到 plans 数组" % pid)
            bad += 1
            continue
        cur = parse_plans(m.group(0))
        diffs = diff_plans(prod["plans"], cur)
        if diffs:
            bad += 1
            print("[%s] 套餐价与基准不一致（%d 处）：" % (pid, len(diffs)))
            for d in diffs:
                print("   " + d)
        else:
            print("[%s] 与基准一致（%d 档）" % (pid, len(cur)))
        # 日期差异只提示、不计漂移：核对日由每日核对流程（refresh-agent-price-date.py）维护
        checked = re.search(r'priceCheckedAt: "([^"]*)"', block)
        if not checked:
            bad += 1
            print("[%s] priceCheckedAt 字段缺失" % pid)
        elif checked.group(1) != ref["checkedAt"]:
            print("[%s] 核对日 %s（基准人工核对日 %s，日期差异不计漂移）" % (
                pid, checked.group(1), ref["checkedAt"]))
    return 2 if bad else 0


def do_write(ref):
    text = read_src()
    changed = 0
    for prod in ref["products"]:
        pid = prod["id"]
        start, end = product_span(text, pid)
        block = text[start:end]
        m = re.search(r"plans: \[.*?\n    \],", block, re.S)
        if not m:
            print("!! %s 找不到 plans 数组，跳过" % pid, file=sys.stderr)
            continue
        # 仅在套餐档位/价位本身漂移时回写；priceCheckedAt 由每日核对流程维护，这里不动
        cur = parse_plans(m.group(0))
        if not diff_plans(prod["plans"], cur):
            continue
        new_block = block[: m.start()].rstrip(" \t") + render_plans(prod["plans"]) + block[m.end():]
        text = text[:start] + new_block + text[end:]
        changed += 1
        print("[%s] 已回写 %d 档套餐价（核对日保持不变）" % (pid, len(prod["plans"])))
    if changed:
        with open(SRC, "w", encoding="utf-8") as f:
            f.write(text)
    else:
        print("无需改动")
    return 0


def do_verify_page(path, ref):
    with open(path, encoding="utf-8", errors="ignore") as f:
        raw = f.read()
    text = re.sub(r"<script.*?</script>|<style.*?</style>", "", raw, flags=re.S)
    text = re.sub(r"<[^>]+>", "\n", text)
    import html as htmlmod

    text = htmlmod.unescape(text)
    missing = []
    for prod in ref["products"]:
        for tok in prod.get("verifyTokens", []):
            if tok not in text:
                missing.append("%s 页内未出现「%s」" % (prod["id"], tok))
    if missing:
        print("官方定价页与基准不一致（可能已改价/改档）：")
        for x in missing:
            print("   " + x)
        return 3
    print("官方定价页仍含全部基准价位与档位名")
    return 0


def main():
    ref = load_ref()
    mode = sys.argv[1] if len(sys.argv) > 1 else "--check"
    if mode == "--check":
        return do_check(ref)
    if mode == "--write":
        return do_write(ref)
    if mode == "--verify-page":
        if len(sys.argv) < 3:
            print("用法：sync-agent-pricing.py --verify-page <html文件>", file=sys.stderr)
            return 1
        return do_verify_page(sys.argv[2], ref)
    print("未知参数：%s" % mode, file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
