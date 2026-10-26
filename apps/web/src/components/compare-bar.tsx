"use client";

import Link from "next/link";
import { MOCK_MODELS } from "@modelrank/shared";
import { useCompare } from "@/context/compare";

export function CompareBar() {
  const { selected, clear, max } = useCompare();

  if (selected.length === 0) return null;

  const names = selected
    .map((id) => MOCK_MODELS.find((m) => m.id === id)?.name)
    .filter(Boolean) as string[];

  return (
    <div
      style={{
        margin: "14px 44px 0 44px",
        background: "var(--mr-card)",
        border: "1px solid var(--mr-border)",
        borderRadius: 8,
        boxShadow: "0 4px 16px rgba(29,33,41,0.10)",
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        bottom: 16,
        zIndex: 30,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--mr-text)" }}>
          已选 <span style={{ color: "var(--mr-orange)" }}>{selected.length}</span> / {max} 个模型
        </span>
        <span style={{ fontSize: 12, color: "var(--mr-text-2)" }}>{names.join(" / ")}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          onClick={clear}
          style={{
            fontSize: 13,
            color: "var(--mr-text-3)",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          清空
        </button>
        <Link href="/compare" className="mr-btn-primary">
          去对比 →
        </Link>
      </div>
    </div>
  );
}
