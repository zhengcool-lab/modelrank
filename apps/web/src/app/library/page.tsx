"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { UI_MODELS } from "@/lib/seed-data";
import { NavHeader } from "@/components/nav-header";
import { Footer } from "@/components/footer";
import { ProductLogo } from "@/components/model-logo";
import { PageHeader } from "@/components/page-header";

const PAGE_SIZE = 10;

type SortKey = "score" | "price" | "context";
type SourceFilter = "all" | "open" | "closed";
type TierFilter = "all" | "S" | "A" | "B" | "C";
type PriceFilter = "all" | "low" | "mid" | "high";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "score", label: "按综合评分" },
  { key: "price", label: "按价格（输出价升序）" },
  { key: "context", label: "按上下文窗口" },
];

// 厂商列表从数据动态推导，避免写死的清单漏模型
const VENDORS = ["全部", ...Array.from(new Set(UI_MODELS.map((m) => m.vendor)))];

const SOURCE_OPTIONS: { key: SourceFilter; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "open", label: "开源" },
  { key: "closed", label: "闭源" },
];

const TIER_OPTIONS: { key: TierFilter; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "S", label: "S" },
  { key: "A", label: "A" },
  { key: "B", label: "B" },
  { key: "C", label: "C" },
];

const PRICE_OPTIONS: { key: PriceFilter; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "low", label: "低价" },
  { key: "mid", label: "中价" },
  { key: "high", label: "高价" },
];

function contextToK(c: string): number {
  if (c.endsWith("M")) return parseFloat(c) * 1000;
  if (c.endsWith("K")) return parseFloat(c);
  return parseFloat(c) || 0;
}

// 32px 统一高度的筛选 chip（P1#25）
function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontSize: 12,
        fontWeight: active ? 600 : 400,
        color: active ? "var(--mr-primary)" : "var(--mr-text-2)",
        height: 32,
        padding: "0 12px",
        border: `1px solid ${active ? "var(--mr-primary)" : "var(--mr-border)"}`,
        borderRadius: "var(--mr-pill)",
        background: active ? "var(--mr-primary-bg)" : "var(--mr-card)",
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

// 页面内自绘的性价比等级 chip（与 badges.tsx 同一套 --mr-* token；B/C 用半透明灰+描边，深浅色都不发飘）
function TierChip({ tier }: { tier: string }) {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    S: { bg: "var(--mr-primary)", color: "#fff", border: "var(--mr-primary)" },
    A: { bg: "var(--mr-a-badge)", color: "#fff", border: "var(--mr-a-badge)" },
    B: {
      bg: "color-mix(in srgb, var(--mr-text-3) 26%, transparent)",
      color: "var(--mr-text-2)",
      border: "color-mix(in srgb, var(--mr-text-3) 38%, transparent)",
    },
    C: { bg: "var(--mr-card-2)", color: "var(--mr-text-3)", border: "var(--mr-border)" },
  };
  const s = map[tier] ?? map.C;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 22,
        padding: "0 8px",
        fontSize: 12,
        fontWeight: 600,
        borderRadius: "var(--mr-pill)",
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
      }}
    >
      {tier}
    </span>
  );
}

export default function LibraryPage() {
  const [vendor, setVendor] = useState("全部");
  const [source, setSource] = useState<SourceFilter>("all");
  const [tier, setTier] = useState<TierFilter>("all");
  const [price, setPrice] = useState<PriceFilter>("all");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("score");
  const [page, setPage] = useState(1);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = UI_MODELS.filter((m) => {
      if (vendor !== "全部" && m.vendor !== vendor) return false;
      if (source === "open" && !m.openSource) return false;
      if (source === "closed" && m.openSource) return false;
      if (tier !== "all" && m.tier !== tier) return false;
      if (price !== "all" && m.priceLevel !== price) return false;
      if (q && !m.name.toLowerCase().includes(q) && !m.vendor.toLowerCase().includes(q)) return false;
      return true;
    });
    const sorted = [...filtered];
    if (sortBy === "score") sorted.sort((a, b) => b.score - a.score);
    else if (sortBy === "price") sorted.sort((a, b) => a.priceOutput - b.priceOutput);
    else sorted.sort((a, b) => contextToK(b.context) - contextToK(a.context));
    return sorted;
  }, [vendor, source, tier, price, query, sortBy]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));

  // 切换筛选/排序时回到第 1 页
  useEffect(() => {
    setPage(1);
  }, [vendor, source, tier, price, query, sortBy]);

  // 兜底：当 rows 变化导致当前页越界时收敛到最后一页
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // 空态「清除筛选」：一键回到全部模型
  const clearFilters = () => {
    setVendor("全部");
    setSource("all");
    setTier("all");
    setPrice("all");
    setQuery("");
  };

  const hasActiveFilter =
    vendor !== "全部" || source !== "all" || tier !== "all" || price !== "all" || query.trim() !== "";

  const rankOf = (m: (typeof UI_MODELS)[number]) =>
    UI_MODELS.filter((x) => x.score > m.score).length + 1;

  const sortLabel = SORT_OPTIONS.find((s) => s.key === sortBy)?.label ?? "";

  // 数据更新时间：取全部模型 priceUpdatedAt 最大值（与首页口径一致）
  const lastUpdated = UI_MODELS.map((m) => m.priceUpdatedAt).sort().pop() ?? "";

  const paginationBtnStyle = (active: boolean, disabled: boolean): React.CSSProperties => ({
    height: 32,
    minWidth: 32,
    padding: "0 12px",
    fontSize: 12,
    fontWeight: active ? 600 : 400,
    borderRadius: "var(--mr-pill)",
    border: `1px solid ${active ? "var(--mr-primary)" : "var(--mr-border)"}`,
    background: active ? "var(--mr-primary)" : "var(--mr-card)",
    color: disabled ? "var(--mr-text-4)" : active ? "#fff" : "var(--mr-text-2)",
    cursor: disabled ? "not-allowed" : "pointer",
  });

  // P2#7：空态升级为图标 + 文案 + 清除筛选按钮（桌面表格与移动卡片共用）
  const emptyState = (
    <div
      style={{
        padding: "40px 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        textAlign: "center",
      }}
    >
      <span
        aria-hidden
        style={{
          fontSize: 32,
          lineHeight: 1,
          color: "var(--mr-text-4)",
        }}
      >
        🔍
      </span>
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--mr-text)" }}>
        没有符合条件的模型
      </div>
      <div style={{ fontSize: 12, color: "var(--mr-text-3)" }}>
        试试调整筛选条件或更换搜索关键词
      </div>
      {hasActiveFilter && (
        <button
          type="button"
          onClick={clearFilters}
          className="mr-btn-outline"
          style={{ marginTop: 6 }}
        >
          清除全部筛选
        </button>
      )}
    </div>
  );

  return (
    <div>
      <NavHeader />

      <div className="mr-container">
      <PageHeader
        breadcrumb={[{ label: "模型榜", href: "/" }, { label: "模型库" }]}
        title="模型库"
        subtitle={
          <>
            共 {rows.length} 个模型 · {sortLabel} · 数据更新于 {lastUpdated.slice(5)}
          </>
        }
      />

      {/* 分组筛选栏：搜索 + 排序 + 厂商 + 开源闭源 + 性价比 + 价格区间（P1#23） */}
      <div className="mr-pad-x" style={{ paddingTop: 16 }}>
        <div className="mr-card" style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
          {/* 第一行：搜索 + 排序 */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索模型名 / 厂商"
              style={{
                flex: "1 1 200px",
                maxWidth: 280,
                height: 32,
                padding: "0 12px",
                fontSize: 13,
                border: "0.5px solid var(--mr-hairline)",
                borderRadius: "var(--mr-pill)",
                background: "var(--mr-card)",
                color: "var(--mr-text)",
                boxSizing: "border-box",
                outline: "none",
              }}
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              style={{
                height: 32,
                padding: "0 10px",
                fontSize: 13,
                border: "0.5px solid var(--mr-hairline)",
                borderRadius: "var(--mr-pill)",
                background: "var(--mr-card)",
                color: "var(--mr-text)",
                boxSizing: "border-box",
                cursor: "pointer",
              }}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* 第二行：厂商（移动端横向滚动，右侧不再被切；桌面端换行） */}
          <div
            className="flex-nowrap md:flex-wrap"
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              overflowX: "auto",
              WebkitOverflowScrolling: "touch",
            }}
          >
            <span style={{ fontSize: 12, color: "var(--mr-text-3)", width: 56, flex: "none" }}>厂商</span>
            {VENDORS.map((v) => (
              <FilterChip key={v} active={vendor === v} onClick={() => setVendor(v)}>{v}</FilterChip>
            ))}
          </div>

          {/* 第三行：开源/闭源 + 性价比 + 价格区间（移动端各组可横滑，右侧不被切） */}
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
            <div
              className="flex-nowrap md:flex-wrap"
              style={{ display: "flex", gap: 8, alignItems: "center", overflowX: "auto", WebkitOverflowScrolling: "touch" }}
            >
              <span style={{ fontSize: 12, color: "var(--mr-text-3)", flex: "none" }}>类型</span>
              {SOURCE_OPTIONS.map((o) => (
                <FilterChip key={o.key} active={source === o.key} onClick={() => setSource(o.key)}>{o.label}</FilterChip>
              ))}
            </div>
            <div
              className="flex-nowrap md:flex-wrap"
              style={{ display: "flex", gap: 8, alignItems: "center", overflowX: "auto", WebkitOverflowScrolling: "touch" }}
            >
              <span style={{ fontSize: 12, color: "var(--mr-text-3)", flex: "none" }}>能力档</span>
              {TIER_OPTIONS.map((o) => (
                <FilterChip key={o.key} active={tier === o.key} onClick={() => setTier(o.key)}>{o.label}</FilterChip>
              ))}
            </div>
            <div
              className="flex-nowrap md:flex-wrap"
              style={{ display: "flex", gap: 8, alignItems: "center", overflowX: "auto", WebkitOverflowScrolling: "touch" }}
            >
              <span style={{ fontSize: 12, color: "var(--mr-text-3)", flex: "none" }}>价格</span>
              {PRICE_OPTIONS.map((o) => (
                <FilterChip key={o.key} active={price === o.key} onClick={() => setPrice(o.key)}>{o.label}</FilterChip>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 桌面端表格（≥768px） */}
      <div className="mr-card mr-mx hidden md:block" style={{ marginTop: 14, overflowX: "auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            height: 42,
            padding: "0 24px",
            background: "var(--mr-card-2)",
            borderBottom: "0.5px solid var(--mr-hairline)",
          }}
        >
          <div style={{ width: 70, flex: "none", fontSize: 12, fontWeight: 600, color: "var(--mr-text-3)" }}>排名</div>
          <div style={{ width: 320, flex: "none", fontSize: 12, fontWeight: 600, color: "var(--mr-text-3)" }}>模型</div>
          <div style={{ width: 160, flex: "none", fontSize: 12, fontWeight: 600, color: "var(--mr-text-3)", textAlign: "right", paddingRight: 4 }}>评分（±CI）</div>
          <div style={{ width: 200, flex: "none", fontSize: 12, fontWeight: 600, color: "var(--mr-text-3)", textAlign: "right", paddingRight: 12 }}>价格 输入/输出（$/M）</div>
          <div style={{ width: 110, flex: "none", fontSize: 12, fontWeight: 600, color: "var(--mr-text-3)" }}>能力档</div>
          <div style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "var(--mr-text-3)", textAlign: "right" }}>操作</div>
        </div>
        {pageRows.map((m) => {
          const n = rankOf(m);
          const rankColor =
            n === 1 ? "var(--mr-gold)" : n === 2 ? "var(--mr-silver)" : n === 3 ? "var(--mr-bronze)" : "var(--mr-text-3)";
          return (
            <div
              key={m.id}
              className="mr-row-hover"
              style={{
                display: "flex",
                alignItems: "center",
                minHeight: 58,
                padding: "10px 24px",
                borderBottom: "1px solid var(--mr-border-soft)",
              }}
            >
              <div style={{ width: 70, flex: "none", fontSize: 13, fontWeight: 600, color: rankColor, fontVariantNumeric: "tabular-nums" }}>{n}</div>
              <div style={{ width: 320, flex: "none", display: "flex", alignItems: "center", gap: 10 }}>
                <ProductLogo modelId={m.id} modelName={m.name} size={32} radius={8} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--mr-text)" }}>
                    <Link href={`/detail/${m.id}`} style={{ color: "var(--mr-text)", textDecoration: "none" }}>
                      {m.name}
                    </Link>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--mr-text-3)", fontWeight: 400 }}>
                    {m.vendor} · {m.openSource ? "开源" : "闭源"}
                  </div>
                </div>
              </div>
              {/* 数值列右对齐 + 等宽数字（P1#24）；分数下方配胶囊条，强弱一眼可比 */}
              <div
                style={{
                  width: 160,
                  flex: "none",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: 5,
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 650,
                      color: "var(--mr-text)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {m.score.toFixed(1)}
                  </span>
                  {m.ci > 0 && (
                    <span style={{ fontSize: 12, color: "var(--mr-text-3)" }}>
                      ±{m.ci.toFixed(1)}
                    </span>
                  )}
                </div>
                <div className="mr-scorebar" style={{ width: 118 }} aria-hidden>
                  <i style={{ width: `${Math.max(4, Math.min(100, (m.score / 60) * 100))}%` }} />
                </div>
              </div>
              <div style={{ width: 200, flex: "none", fontSize: 13, color: "var(--mr-text-2)", textAlign: "right", fontVariantNumeric: "tabular-nums", paddingRight: 12 }}>
                {m.priceInput > 0 ? `$${m.priceInput} / $${m.priceOutput}${m.priceEstimated ? "（估算）" : ""}` : "待核对"}
              </div>
              <div style={{ width: 110, flex: "none", paddingLeft: 12 }}>
                <TierChip tier={m.tier} />
              </div>
              <div style={{ flex: 1, textAlign: "right" }}>
                <Link href={`/detail/${m.id}`} className="mr-link" style={{ fontSize: 12 }}>
                  查看详情
                </Link>
              </div>
            </div>
          );
        })}
        {pageRows.length === 0 && emptyState}
      </div>

      {/* 移动端卡片列表（<768px）。P1#1：外层不可内联 display:flex，否则压过 md:hidden 导致桌面端双渲染 */}
      <div className="md:hidden" style={{ padding: "14px 16px 0" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {pageRows.map((m) => {
          const n = rankOf(m);
          const rankColor =
            n === 1 ? "var(--mr-gold)" : n === 2 ? "var(--mr-silver)" : n === 3 ? "var(--mr-bronze)" : "var(--mr-text-3)";
          return (
            <div key={m.id} className="mr-card" style={{ padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: rankColor, width: 24, fontVariantNumeric: "tabular-nums" }}>{n}</span>
                <ProductLogo modelId={m.id} modelName={m.name} size={30} radius={8} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link href={`/detail/${m.id}`} style={{ color: "var(--mr-text)", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
                    {m.name}
                  </Link>
                  <div style={{ fontSize: 12, color: "var(--mr-text-3)" }}>
                    {m.vendor} · {m.openSource ? "开源" : "闭源"}
                  </div>
                </div>
                <TierChip tier={m.tier} />
              </div>
              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                  color: "var(--mr-text-2)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                <span>
                  评分 <strong style={{ color: "var(--mr-text)" }}>{m.score.toFixed(1)}</strong>
                  {m.ci > 0 && (
                    <span style={{ color: "var(--mr-text-3)" }}> ±{m.ci.toFixed(1)}</span>
                  )}
                </span>
                <span>
                  价格 <strong style={{ color: "var(--mr-text)" }}>{m.priceInput > 0 ? `$${m.priceInput} / $${m.priceOutput}` : "待核对"}</strong>
                </span>
              </div>
              <div style={{ marginTop: 10, textAlign: "right" }}>
                <Link href={`/detail/${m.id}`} className="mr-link" style={{ fontSize: 12 }}>查看详情 →</Link>
              </div>
            </div>
          );
        })}
        </div>
        {pageRows.length === 0 && (
          <div className="mr-card">{emptyState}</div>
        )}
      </div>

      {/* 分页 */}
      <div className="mr-mx" style={{ marginTop: 0 }}>
        <div
          className="mr-card"
          style={{
            marginTop: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            minHeight: 48,
            padding: "8px 24px",
            flexWrap: "wrap",
            gap: 8,
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
              style={paginationBtnStyle(false, page <= 1)}
            >
              上一页
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                aria-current={p === page ? "page" : undefined}
                style={paginationBtnStyle(p === page, false)}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              style={paginationBtnStyle(false, page >= totalPages)}
            >
              下一页
            </button>
          </div>
        </div>
      </div>
      </div>

      <Footer />
    </div>
  );
}
