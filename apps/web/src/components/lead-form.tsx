"use client";

import Link from "next/link";
import { UI_MODELS } from "@/lib/seed-data";
import type { UIModelRecord } from "@/lib/types";
import { ProductLogo, VendorLogo } from "./model-logo";
import { TierBadge } from "./badges";

type Sibling = NonNullable<UIModelRecord["siblings"]>[number];

/**
 * 详情页右栏：同厂商其他模型列表。
 * 数据来源分两层：
 *  1. 本期榜单内的同厂商模型（可点进详情页，带分数与性价比档）；
 *  2. AA 收录库里该厂商其余模型（含未达收录门槛/未入榜的，标注"未进本期榜单"）。
 */
export function SameVendorModels({
  vendor,
  currentId,
  siblings,
  vendorStats,
}: {
  vendor: string;
  currentId: string;
  siblings?: Sibling[];
  vendorStats?: UIModelRecord["vendorStats"];
}) {
  const board = UI_MODELS.filter((m) => m.vendor === vendor && m.id !== currentId).slice(0, 4);
  const boardIds = new Set(board.map((m) => m.id));
  const rest = (siblings ?? []).filter((s) => !boardIds.has(s.id) && s.id !== currentId && !s.inBoard).slice(0, 4);
  const total = vendorStats?.total ?? board.length + rest.length;
  const hasAny = board.length + rest.length > 0;

  return (
    <div className="mr-card" style={{ padding: "18px 20px", marginTop: 14 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--mr-text)" }}>{vendor} 其他模型</div>
        {total > 0 && (
          <div style={{ fontSize: 11, color: "var(--mr-text-3)" }}>AA 收录 {total} 个</div>
        )}
      </div>

      {!hasAny ? (
        <div>
          <div style={{ fontSize: 12, color: "var(--mr-text-3)", marginTop: 10, lineHeight: 1.6 }}>
            该厂商在 AA 收录库中暂无其他模型记录。
          </div>
          <Link
            href="/library"
            className="mr-link"
            style={{ display: "inline-block", marginTop: 8, fontSize: 12, fontWeight: 600 }}
          >
            浏览完整榜单 →
          </Link>
        </div>
      ) : (
        <div style={{ marginTop: 8, display: "flex", flexDirection: "column" }}>
          {/* 榜内同厂商模型：可跳转 */}
          {board.map((m) => (
            <Link
              key={m.id}
              href={`/detail/${m.id}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 0",
                borderBottom: "1px solid var(--mr-border-soft)",
                textDecoration: "none",
              }}
            >
              <ProductLogo modelId={m.id} modelName={m.name} size={28} radius={6} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--mr-text)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {m.name}
                </div>
                <div style={{ fontSize: 11, color: "var(--mr-text-3)", marginTop: 1 }}>
                  本期榜单
                  {m.releaseDate ? ` · ${m.releaseDate}` : ""}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--mr-text)" }}>{m.score.toFixed(1)}</span>
                <TierBadge tier={m.tier} />
              </div>
            </Link>
          ))}

          {/* 未进本期榜单的同厂商模型：只展示，不跳转 */}
          {rest.map((s) => (
            <div
              key={s.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 0",
                borderBottom: "1px solid var(--mr-border-soft)",
              }}
            >
              <VendorLogo vendor={vendor} size={28} radius={6} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--mr-text-2)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {s.name}
                </div>
                <div style={{ fontSize: 11, color: "var(--mr-text-3)", marginTop: 1 }}>
                  {s.open === true ? "开源权重" : s.open === false ? "闭源" : "开闭源未标注"}
                  {s.releaseDate ? ` · ${s.releaseDate}` : ""} · 未进本期榜单
                </div>
              </div>
              {typeof s.score === "number" && (
                <span style={{ fontSize: 12, color: "var(--mr-text-3)", whiteSpace: "nowrap" }}>
                  AA {s.score}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
