"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { UI_MODELS } from "@/lib/seed-data";
import { NavHeader } from "@/components/nav-header";
import { Footer } from "@/components/footer";
import { TierBadge } from "@/components/badges";

const VENDORS = ["全部", "OpenAI", "Anthropic", "Google", "深度求索", "阿里", "Meta", "Mistral", "腾讯", "阶跃星辰", "MiniMax", "零一万物", "智谱", "百川", "Microsoft"];
const PAGE_SIZE = 10;

export default function LibraryPage() {
  const [vendor, setVendor] = useState("全部");
  const [page, setPage] = useState(1);

  const rows = useMemo(
    () => (vendor === "全部" ? UI_MODELS : UI_MODELS.filter((m) => m.vendor === vendor)),
    [vendor]
  );

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));

  // 切换厂商筛选时回到第 1 页
  useEffect(() => {
    setPage(1);
  }, [vendor]);

  // 兜底：当 rows 变化导致当前页越界时收敛到最后一页
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const pickVendor = (v: string) => setVendor(v);

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
          全量 128 个模型 · 按综合分排序 · 数据更新于 10-16 08:00
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
              onClick={() => pickVendor(v)}
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
        {pageRows.map((m) => {
          const n = UI_MODELS.filter((x) => x.score > m.score).length + 1;
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
            第 {(page - 1) * PAGE_SIZE + (pageRows.length ? 1 : 0)}–
            {(page - 1) * PAGE_SIZE + pageRows.length} 条 / 共 {rows.length} 个模型
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{
                height: 28,
                padding: "0 12px",
                fontSize: 12,
                borderRadius: 4,
                border: "1px solid var(--mr-border)",
                background: "var(--mr-card)",
                color: page <= 1 ? "var(--mr-text-4)" : "var(--mr-text-2)",
                cursor: page <= 1 ? "not-allowed" : "pointer",
              }}
            >
              上一页
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                aria-current={p === page ? "page" : undefined}
                style={{
                  height: 28,
                  minWidth: 28,
                  padding: "0 8px",
                  fontSize: 12,
                  fontWeight: p === page ? 600 : 400,
                  borderRadius: 4,
                  border: `1px solid ${p === page ? "var(--mr-primary)" : "var(--mr-border)"}`,
                  background: p === page ? "var(--mr-primary)" : "var(--mr-card)",
                  color: p === page ? "#fff" : "var(--mr-text-2)",
                  cursor: "pointer",
                }}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              style={{
                height: 28,
                padding: "0 12px",
                fontSize: 12,
                borderRadius: 4,
                border: "1px solid var(--mr-border)",
                background: "var(--mr-card)",
                color: page >= totalPages ? "var(--mr-text-4)" : "var(--mr-text-2)",
                cursor: page >= totalPages ? "not-allowed" : "pointer",
              }}
            >
              下一页
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
