"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { UI_NEWS } from "@/lib/news-data";
import type { NewsCategory } from "@/lib/types";
import { getNewsRelatedModelId } from "@/lib/derived-data";
import { NavHeader } from "@/components/nav-header";
import { Footer } from "@/components/footer";
import { PageHeader } from "@/components/page-header";

const CATS: ("全部" | NewsCategory)[] = ["全部", "发布", "评测", "融资", "政策", "价格"];

/** 首屏直接展示全部（当前 8 条，未来数据扩容后仍可全量平铺，无需分页按钮） */
const INITIAL_COUNT = 8;

/** 把 ISO 时间戳格式化为相对时间（seed-data 中 time 字段存的是 ISO 串） */
function fmtRelative(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return iso;
  const diff = Math.max(0, Date.now() - t);
  const min = Math.floor(diff / 60000);
  if (min < 1) return "刚刚";
  if (min < 60) return `${min} 分钟前`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} 小时前`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} 天前`;
  const dt = new Date(t);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** tooltip 用完整日期时间 */
function fmtFull(iso: string): string {
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return iso;
  return t.toLocaleString("zh-CN", { hour12: false });
}

const clamp2: React.CSSProperties = {
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: 2,
  overflow: "hidden",
  overflowWrap: "anywhere",
};

export default function NewsPage() {
  const [cat, setCat] = useState<(typeof CATS)[number]>("全部");
  const [showAll, setShowAll] = useState(false);

  const rows = useMemo(
    () => (cat === "全部" ? UI_NEWS : UI_NEWS.filter((n) => n.category === cat)),
    [cat]
  );
  const countOf = (c: (typeof CATS)[number]) =>
    c === "全部" ? UI_NEWS.length : UI_NEWS.filter((n) => n.category === c).length;
  /** 只展示有内容的分类，空分类自动隐藏（数据源每日更新，分类会动态增减） */
  const visibleCats = useMemo<typeof CATS>(
    () => ["全部", ...CATS.slice(1).filter((c) => countOf(c) > 0)],
    []
  );
  const visible = showAll ? rows : rows.slice(0, INITIAL_COUNT);

  return (
    <div>
      <NavHeader />

      <div className="mr-container">
      <PageHeader
        breadcrumb={[{ label: "模型榜", href: "/" }, { label: "大模型新闻" }]}
        title="大模型新闻"
        subtitle={<>聚合 {UI_NEWS.length} 条大模型行业动态 · 发布 / 评测 / 融资 / 政策 / 价格</>}
      />

      {/* category segmented — 单行横向滚动，避免移动端孤行换行 */}
      <div
        className="mr-mx"
        style={{
          display: "flex",
          background: "var(--mr-card-2)",
          borderRadius: "var(--mr-pill)",
          padding: 3,
          marginTop: 16,
          overflowX: "auto",
          flexWrap: "nowrap",
          maxWidth: "100%",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {visibleCats.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              flexShrink: 0,
              whiteSpace: "nowrap",
              fontWeight: cat === c ? 600 : 400,
              color: cat === c ? "var(--mr-primary)" : "var(--mr-text-2)",
              background: cat === c ? "var(--mr-card)" : "transparent",
              padding: "6px 12px",
              borderRadius: "var(--mr-pill)",
              border: "none",
              cursor: "pointer",
              boxShadow: cat === c ? "var(--mr-shadow)" : "none",
            }}
          >
            {c}
            <span
              style={{
                fontSize: 11,
                lineHeight: "16px",
                minWidth: 16,
                textAlign: "center",
                padding: "0 4px",
                borderRadius: "var(--mr-radius)",
                color: cat === c ? "var(--mr-primary)" : "var(--mr-text-3)",
                background: cat === c ? "var(--mr-primary-bg)" : "var(--mr-card)",
              }}
            >
              {countOf(c)}
            </span>
          </button>
        ))}
      </div>

      {/* cards — 响应式网格，单卡也自然占满而非居左留白 */}
      <div
        className="mr-mx"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(340px, 100%), 1fr))",
          gap: 14,
          marginTop: 16,
        }}
      >
        {visible.map((n) => {
          const relatedId = getNewsRelatedModelId(n);
          return (
            <div
              key={n.id}
              role="link"
              tabIndex={0}
              aria-label={`阅读原文：${n.title}（新窗口打开）`}
              onClick={() => window.open(n.url, "_blank", "noopener,noreferrer")}
              onKeyDown={(e) => {
                if (e.key === "Enter") window.open(n.url, "_blank", "noopener,noreferrer");
              }}
              style={{
                background: "var(--mr-card)",
                border: "0.5px solid var(--mr-hairline)",
                borderRadius: "var(--mr-radius)",
                boxShadow: "var(--mr-shadow)",
                padding: "16px 18px",
                boxSizing: "border-box",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                transition: "box-shadow .18s,border-color .18s,transform .18s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(29,33,41,.10)";
                e.currentTarget.style.borderColor = "var(--mr-primary)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "var(--mr-shadow)";
                e.currentTarget.style.borderColor = "var(--mr-border)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--mr-primary)", background: "var(--mr-primary-bg)", padding: "2px 10px", borderRadius: "var(--mr-pill)"}}>
                  {n.category}
                </span>
                <span style={{ fontSize: 12, color: "var(--mr-text-3)", whiteSpace: "nowrap" }} title={fmtFull(n.time)}>
                  {n.source} · {fmtRelative(n.time)}
                </span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "var(--mr-text)", marginTop: 10, lineHeight: 1.5, ...clamp2 }}>
                {n.title}
              </div>
              <div style={{ fontSize: 13, color: "var(--mr-text-2)", marginTop: 6, lineHeight: 1.6, ...clamp2 }}>{n.summary}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, gap: 8 }}>
                <span style={{ fontSize: 12, color: "var(--mr-primary)", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 4 }}>
                  阅读原文 ↗
                </span>
                {n.relatedModel &&
                  (relatedId ? (
                    <Link
                      href={`/detail/${relatedId}`}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      style={{ fontSize: 12, color: "var(--mr-primary)", background: "var(--mr-primary-bg)", padding: "2px 10px", borderRadius: "var(--mr-pill)", whiteSpace: "nowrap", textDecoration: "none" }}
                    >
                      相关：{n.relatedModel}
                    </Link>
                  ) : (
                    <span
                      title="该关键词未对应站内已收录模型"
                      style={{ fontSize: 12, color: "var(--mr-text-3)", background: "var(--mr-card-2)", border: "1px solid var(--mr-border-soft)", padding: "2px 10px", borderRadius: "var(--mr-pill)", whiteSpace: "nowrap" }}
                    >
                      相关：{n.relatedModel}
                    </span>
                  ))}
              </div>
            </div>
          );
        })}
        {rows.length === 0 && (
          <div
            style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              padding: "48px 20px",
              background: "var(--mr-card)",
              border: "1px dashed var(--mr-border)",
              borderRadius: "var(--mr-radius)",
              color: "var(--mr-text-3)",
              fontSize: 13,
            }}
          >
            「{cat}」分类暂无新闻，看看其它分类吧
          </div>
        )}
      </div>

      {/* 数据量超过首屏时提供展开入口 */}
      {rows.length > INITIAL_COUNT && (
        <div className="mr-mx" style={{ marginTop: 16, textAlign: "center" }}>
          {showAll ? (
            <div style={{ fontSize: 12, color: "var(--mr-text-3)" }}>已展示全部 {rows.length} 条新闻 · 历史归档随数据源扩展逐步上线</div>
          ) : (
            <button
              type="button"
              className="mr-btn-outline"
              onClick={() => setShowAll(true)}
              style={{ fontSize: 13, padding: "8px 24px" }}
            >
              加载更多（剩余 {rows.length - INITIAL_COUNT} 条）
            </button>
          )}
        </div>
      )}
      </div>

      <Footer />
    </div>
  );
}
