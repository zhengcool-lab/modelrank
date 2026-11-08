"use client";

import Link from "next/link";
import { Message } from "@arco-design/web-react";
import type { UIModelRecord } from "@/lib/types";
import { useCompare } from "@/context/compare";
import { DeltaText, OpenTag, RankBadge, TierBadge } from "./badges";
import { ProductLogo } from "./model-logo";

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
    <div className="md:hidden flex flex-col" style={{ padding: "14px 16px 0 16px", gap: 10 }}>
      {models.map((m) => {
        const n = models.filter((x) => x.score > m.score).length + 1;
        const checked = has(m.id);
        return (
          <div
            key={m.id}
            className="mr-card"
            style={{
              padding: "12px 14px",
              display: "flex",
              gap: 10,
              alignItems: "center",
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
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              <CheckBox checked={checked} />
            </button>

            {/* 排名角标叠在图标左上角，省掉独立排名列 */}
            <div style={{ position: "relative", flex: "none" }}>
              <ProductLogo modelId={m.id} modelName={m.name} size={36} radius={8} />
              <RankBadge n={n} />
            </div>

            {/* 紧凑双行布局：行1 = 名字+评分+涨跌（右对齐），行2 = 标签+厂商+价格（左右铺满） */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* row 1: model name + score + delta */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Link
                  href={`/detail/${m.id}`}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontSize: 15,
                    fontWeight: 600,
                    color: "var(--mr-text)",
                    textDecoration: "none",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {m.name}
                </Link>
                <span
                  style={{
                    flex: "none",
                    display: "inline-flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: 4,
                  }}
                >
                  <span
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      color: "var(--mr-text)",
                      lineHeight: 1,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {m.score.toFixed(1)}
                  </span>
                  <span className="mr-scorebar" style={{ width: 56 }} aria-hidden>
                    <i style={{ width: `${Math.max(4, Math.min(100, (m.score / 60) * 100))}%` }} />
                  </span>
                </span>
                <DeltaText model={m} hideEmpty />
              </div>

              {/* row 2: tags + vendor + price */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                <OpenTag openSource={m.openSource} />
                <TierBadge tier={m.tier} />
                <span
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontSize: 12,
                    color: "var(--mr-text-3)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {m.vendor} · {m.context === "--" ? "上下文待核" : `${m.context} 上下文`}
                </span>
                <span
                  style={{
                    flex: "none",
                    fontSize: 13,
                    color: "var(--mr-text-2)",
                    textAlign: "right",
                  }}
                >
                  {m.priceInput > 0 ? `$${m.priceInput}/$${m.priceOutput}` : "待核对"}
                </span>
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
