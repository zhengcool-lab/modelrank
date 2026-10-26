"use client";

import { useMemo, useState } from "react";
import { UI_MODELS } from "@/lib/seed-data";
import type { Tier } from "@/lib/types";
import { LeaderboardTable } from "@/components/leaderboard-table";

const TIERS: Tier[] = ["S", "A", "B", "C"];

/** 各档选中时的实底配色，沿用 TierBadge 语义 */
const TIER_ACTIVE_STYLE: Record<Tier, { color: string; bg: string; border: string }> = {
  S: { color: "#fff", bg: "var(--mr-primary)", border: "var(--mr-primary)" },
  A: { color: "#fff", bg: "var(--mr-a-badge)", border: "var(--mr-a-badge)" },
  B: { color: "#fff", bg: "var(--mr-text-3)", border: "var(--mr-text-3)" },
  C: { color: "var(--mr-text-2)", bg: "var(--mr-card-2)", border: "var(--mr-border)" },
};

export function TierFilteredBoard() {
  const [selected, setSelected] = useState<ReadonlySet<Tier>>(new Set());

  const toggle = (t: Tier) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });

  const filtered = useMemo(
    () => (selected.size === 0 ? UI_MODELS : UI_MODELS.filter((m) => selected.has(m.tier))),
    [selected]
  );

  return (
    <>
      {/* 性价比档多选 */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 44px 0 44px" }}>
        <span style={{ fontSize: 12, color: "var(--mr-text-3)" }}>性价比档：</span>
        {TIERS.map((t) => {
          const active = selected.has(t);
          const s = TIER_ACTIVE_STYLE[t];
          return (
            <button
              key={t}
              type="button"
              onClick={() => toggle(t)}
              aria-pressed={active}
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: active ? s.color : "var(--mr-text-2)",
                background: active ? s.bg : "var(--mr-card)",
                border: `1px solid ${active ? s.border : "var(--mr-border)"}`,
                borderRadius: 4,
                height: 28,
                minWidth: 36,
                padding: "0 12px",
                cursor: "pointer",
              }}
            >
              {t}
            </button>
          );
        })}
        <span style={{ fontSize: 12, color: "var(--mr-text-3)" }}>
          {selected.size === 0 ? "未筛选 · 全部档位" : `已选 ${[...selected].join(" / ")} · ${filtered.length} 个模型`}
        </span>
      </div>

      <LeaderboardTable models={filtered} />
    </>
  );
}
