"use client";

import Link from "next/link";
import { Message } from "@arco-design/web-react";
import type { UIModelRecord } from "@/lib/types";
import { useCompare } from "@/context/compare";
import { DeltaText, OpenTag, TierBadge } from "./badges";

function RankBadge({ n }: { n: number }) {
  const color =
    n === 1
      ? "var(--mr-gold)"
      : n === 2
        ? "var(--mr-silver)"
        : n === 3
          ? "var(--mr-bronze)"
          : "var(--mr-text-3)";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 32,
        height: 32,
        borderRadius: 6,
        background: n <= 3 ? color : "var(--mr-card-2)",
        color: n <= 3 ? "#fff" : "var(--mr-text-3)",
        fontSize: 14,
        fontWeight: 700,
        flex: "none",
      }}
    >
      {n}
    </span>
  );
}

function CheckBox({ checked }: { checked: boolean }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 20,
        height: 20,
        border: `1.5px solid ${checked ? "var(--mr-primary)" : "var(--mr-text-4)"}`,
        borderRadius: 4,
        background: checked ? "var(--mr-primary)" : "var(--mr-card)",
        color: "#fff",
        fontSize: 13,
        lineHeight: 1,
        flex: "none",
      }}
    >
      {checked ? "✓" : ""}
    </span>
  );
}

export function LeaderboardCards({ models }: { models: UIModelRecord[] }) {
  const { selected, toggle, has, max } = useCompare();

  return (
    <div className="md:hidden" style={{ padding: "14px 16px 0 16px", display: "flex", flexDirection: "column", gap: 10 }}>
      {models.map((m) => {
        const n = models.filter((x) => x.score > m.score).length + 1;
        const checked = has(m.id);
        return (
          <div
            key={m.id}
            className="mr-card"
            style={{
              padding: "14px 16px",
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
              position: "relative",
            }}
          >
            {/* compare checkbox */}
            <button
              type="button"
              aria-label={`对比 ${m.name}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!has(m.id) && selected.length >= max) {
                  Message.warning({ content: "最多对比 4 个模型" });
                  return;
                }
                toggle(m.id);
              }}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, marginTop: 4 }}
            >
              <CheckBox checked={checked} />
            </button>

            <RankBadge n={n} />

            <div style={{ flex: 1, minWidth: 0 }}>
              {/* row 1: name + tier */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <Link
                  href={`/detail/${m.id}`}
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: "var(--mr-text)",
                    textDecoration: "none",
                  }}
                >
                  {m.name}
                </Link>
                <OpenTag openSource={m.openSource} />
                <TierBadge tier={m.tier} />
              </div>

              {/* row 2: vendor */}
              <div style={{ fontSize: 12, color: "var(--mr-text-3)", marginTop: 3 }}>
                {m.vendor} · {m.context} 上下文
              </div>

              {/* row 3: score + price */}
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 8 }}>
                <div>
                  <span style={{ fontSize: 22, fontWeight: 700, color: "var(--mr-text)" }}>
                    {m.score.toFixed(1)}
                  </span>{" "}
                  <DeltaText model={m} />
                </div>
                <div style={{ fontSize: 12, color: "var(--mr-text-2)", textAlign: "right" }}>
                  ¥{m.priceInput}/¥{m.priceOutput}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* footer */}
      <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 4px 0" }}>
        <Link href="/library" className="mr-btn-outline" style={{ fontSize: 12 }}>
          查看完整榜单 →
        </Link>
      </div>
    </div>
  );
}
