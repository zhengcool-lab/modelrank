"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MOCK_MODELS } from "@modelrank/shared";
import { NavHeader } from "@/components/nav-header";
import { Footer } from "@/components/footer";
import { TierBadge } from "@/components/badges";

const VENDORS = ["全部", "OpenAI", "Anthropic", "Google", "深度求索", "阿里", "Meta", "Mistral"];

export default function LibraryPage() {
  const [vendor, setVendor] = useState("全部");
  const rows = useMemo(
    () => (vendor === "全部" ? MOCK_MODELS : MOCK_MODELS.filter((m) => m.vendor === vendor)),
    [vendor]
  );

  return (
    <div>
      <NavHeader />

      <div style={{ padding: "14px 44px 0 44px", fontSize: 12, color: "var(--mr-text-3)" }}>
        <Link href="/" className="mr-link">模型榜</Link>
        <span style={{ color: "var(--mr-text-4)", margin: "0 6px" }}>/</span>
        <span style={{ color: "var(--mr-text-2)" }}>模型库</span>
      </div>

      <div style={{ padding: "24px 44px 0 44px" }}>
        <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.4px", color: "var(--mr-text)" }}>模型库</div>
        <div style={{ fontSize: 13, color: "var(--mr-text-2)", marginTop: 6 }}>
          全量 128 个模型 · 按综合分排序 · 数据更新于 10-16 08:00 · 示例/mockup
        </div>
      </div>

      {/* vendor filter tags */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 44px 0 44px" }}>
        <span style={{ fontSize: 12, color: "var(--mr-text-3)", marginRight: 4 }}>厂商分组：</span>
        {VENDORS.map((v) => {
          const active = vendor === v;
          return (
            <button
              key={v}
              onClick={() => setVendor(v)}
              style={{
                fontSize: 12,
                fontWeight: active ? 600 : 400,
                color: active ? "var(--mr-primary)" : "var(--mr-text-2)",
                height: 28,
                lineHeight: "26px",
                padding: "0 12px",
                border: `1px solid ${active ? "var(--mr-primary)" : "var(--mr-border)"}`,
                borderRadius: 4,
                background: active ? "var(--mr-primary-bg)" : "var(--mr-card)",
                cursor: "pointer",
              }}
            >
              {v}
            </button>
          );
        })}
      </div>

      {/* table */}
      <div className="mr-card" style={{ margin: "14px 44px 0 44px", overflow: "hidden" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            height: 42,
            padding: "0 24px",
            background: "var(--mr-card-2)",
            borderBottom: "1px solid var(--mr-border)",
          }}
        >
          <div style={{ width: 70, flex: "none", fontSize: 12, fontWeight: 600, color: "var(--mr-text-3)" }}>排名</div>
          <div style={{ width: 320, flex: "none", fontSize: 12, fontWeight: 600, color: "var(--mr-text-3)" }}>模型</div>
          <div style={{ width: 180, flex: "none", fontSize: 12, fontWeight: 600, color: "var(--mr-text-3)" }}>评分（±CI）</div>
          <div style={{ width: 220, flex: "none", fontSize: 12, fontWeight: 600, color: "var(--mr-text-3)" }}>价格 输入/输出（¥/M）</div>
          <div style={{ width: 120, flex: "none", fontSize: 12, fontWeight: 600, color: "var(--mr-text-3)" }}>性价比</div>
          <div style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "var(--mr-text-3)", textAlign: "right" }}>操作</div>
        </div>
        {rows.map((m) => {
          const n = MOCK_MODELS.filter((x) => x.score > m.score).length + 1;
          const rankColor =
            n === 1 ? "var(--mr-gold)" : n === 2 ? "var(--mr-silver)" : n === 3 ? "var(--mr-bronze)" : "var(--mr-text-3)";
          return (
            <div
              key={m.id}
              style={{
                display: "flex",
                alignItems: "center",
                height: 56,
                padding: "0 24px",
                borderBottom: "1px solid var(--mr-border-soft)",
              }}
            >
              <div style={{ width: 70, flex: "none", fontSize: 13, fontWeight: 600, color: rankColor }}>{n}</div>
              <div style={{ width: 320, flex: "none", fontSize: 14, fontWeight: 600, color: "var(--mr-text)" }}>
                <Link href={`/detail/${m.id}`} style={{ color: "var(--mr-text)", textDecoration: "none" }}>
                  {m.name}
                </Link>{" "}
                <span style={{ fontSize: 12, color: "var(--mr-text-3)", fontWeight: 400 }}>
                  {m.vendor} · {m.openSource ? "开源" : "闭源"}
                </span>
              </div>
              <div style={{ width: 180, flex: "none", fontSize: 13, color: "var(--mr-text)" }}>
                {m.score.toFixed(1)} <span style={{ fontSize: 12, color: "var(--mr-text-3)" }}>±{m.ci.toFixed(1)}</span>
              </div>
              <div style={{ width: 220, flex: "none", fontSize: 13, color: "var(--mr-text-2)" }}>
                {m.priceInput} / {m.priceOutput}{m.priceEstimated ? "（估算）" : ""}
              </div>
              <div style={{ width: 120, flex: "none" }}>
                <TierBadge tier={m.tier} />
              </div>
              <div style={{ flex: 1, textAlign: "right" }}>
                <Link href={`/detail/${m.id}`} className="mr-link" style={{ fontSize: 12 }}>
                  查看详情
                </Link>
              </div>
            </div>
          );
        })}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 48,
            padding: "0 24px",
            background: "var(--mr-card-2)",
            borderTop: "1px solid var(--mr-border)",
          }}
        >
          <span style={{ fontSize: 12, color: "var(--mr-text-3)" }}>
            示例/mockup · 当前展示 {rows.length} 个模型，其余约 120 个略
          </span>
          <span style={{ fontSize: 12, color: "var(--mr-text-3)" }}>共 128 条</span>
        </div>
      </div>

      <Footer />
    </div>
  );
}
