"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MOCK_NEWS, type NewsCategory } from "@modelrank/shared";
import { NavHeader } from "@/components/nav-header";
import { Footer } from "@/components/footer";

const CATS: ("全部" | NewsCategory)[] = ["全部", "发布", "评测", "融资", "政策", "价格"];

export default function NewsPage() {
  const [cat, setCat] = useState<(typeof CATS)[number]>("全部");
  const rows = useMemo(
    () => (cat === "全部" ? MOCK_NEWS : MOCK_NEWS.filter((n) => n.category === cat)),
    [cat]
  );

  return (
    <div>
      <NavHeader />

      <div style={{ padding: "14px 44px 0 44px", fontSize: 12, color: "var(--mr-text-3)" }}>
        <Link href="/" className="mr-link">模型榜</Link>
        <span style={{ color: "var(--mr-text-4)", margin: "0 6px" }}>/</span>
        <span style={{ color: "var(--mr-text-2)" }}>大模型新闻</span>
      </div>

      <div style={{ padding: "24px 44px 0 44px" }}>
        <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.4px", color: "var(--mr-text)" }}>大模型新闻</div>
        <div style={{ fontSize: 13, color: "var(--mr-text-2)", marginTop: 6 }}>
          发布 · 评测 · 融资 · 政策 · 价格 · 示例/mockup
        </div>
      </div>

      {/* category segmented */}
      <div style={{ display: "inline-flex", background: "var(--mr-card-2)", borderRadius: 4, padding: 3, margin: "16px 44px 0 44px" }}>
        {CATS.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            style={{
              fontSize: 12,
              fontWeight: cat === c ? 600 : 400,
              color: cat === c ? "var(--mr-primary)" : "var(--mr-text-2)",
              background: cat === c ? "var(--mr-card)" : "transparent",
              padding: "6px 16px",
              borderRadius: 4,
              border: "none",
              cursor: "pointer",
              boxShadow: cat === c ? "0 1px 3px rgba(29,33,41,0.12)" : "none",
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {/* cards */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, margin: "16px 44px 0 44px" }}>
        {rows.map((n) => (
          <a
            key={n.id}
            href={n.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              width: 434,
              flex: "none",
              background: "var(--mr-card)",
              border: "1px solid var(--mr-border)",
              borderRadius: 8,
              boxShadow: "var(--mr-shadow)",
              padding: "18px 20px",
              textDecoration: "none",
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "flex", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--mr-primary)", background: "var(--mr-primary-bg)", padding: "1px 8px", borderRadius: 2 }}>
                {n.category}
              </span>
              <span style={{ fontSize: 12, color: "var(--mr-text-3)", background: "var(--mr-card-2)", padding: "1px 8px", borderRadius: 2 }}>
                AI 摘要
              </span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--mr-text)", marginTop: 10, lineHeight: 1.5 }}>
              {n.title}
            </div>
            <div style={{ fontSize: 12, color: "var(--mr-text-3)", marginTop: 6 }}>{n.summary}</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
              <span style={{ fontSize: 12, color: "var(--mr-text-3)" }}>{n.source} · {n.time}</span>
              {n.relatedModel && (
                <span style={{ fontSize: 12, color: "var(--mr-primary)", background: "var(--mr-primary-bg)", padding: "1px 8px", borderRadius: 2 }}>
                  相关：{n.relatedModel}
                </span>
              )}
              <span style={{ fontSize: 12, color: "var(--mr-primary)" }}>站外 ↗</span>
            </div>
          </a>
        ))}
        {rows.length === 0 && (
          <div style={{ fontSize: 13, color: "var(--mr-text-3)", padding: 20 }}>该分类暂无新闻</div>
        )}
      </div>

      <Footer />
    </div>
  );
}
