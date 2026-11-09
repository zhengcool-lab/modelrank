"use client";

import Link from "next/link";
import { UI_MODELS } from "@/lib/seed-data";
import { useCompare } from "@/context/compare";

export function CompareBar() {
  const { selected, clear, max } = useCompare();

  if (selected.length === 0) return null;

  const names = selected
    .map((id) => UI_MODELS.find((m) => m.id === id)?.name)
    .filter(Boolean) as string[];

  return (
    <div className="mr-mx mr-compare-bar" style={{ marginTop: 14 }}>
      <div className="mr-compare-info">
        <span className="mr-compare-count">
          已选 <span style={{ color: "var(--mr-orange)" }}>{selected.length}</span> / {max} 个模型
        </span>
        <span className="mr-compare-names" title={names.join(" / ")}>
          {names.join(" / ")}
        </span>
      </div>
      <div className="mr-compare-actions">
        <button type="button" onClick={clear} className="mr-compare-clear">
          清空
        </button>
        <Link href="/compare" className="mr-btn-primary" style={{ whiteSpace: "nowrap", flex: "0 0 auto" }}>
          去对比 →
        </Link>
      </div>
    </div>
  );
}
