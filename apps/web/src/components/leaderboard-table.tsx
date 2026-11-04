"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Message } from "@arco-design/web-react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import type { UIModelRecord } from "@/lib/types";
import { OFFICIAL_SITES, displayDomain } from "@/lib/official-sites";
import { useCompare } from "@/context/compare";
import {
  DeltaText,
  OpenTag,
  SourceTag,
  TierBadge,
} from "./badges";
import { ProductLogo } from "./model-logo";

const columnHelper = createColumnHelper<UIModelRecord>();

/** 能力五维网格：财务/战略/法律/工程/经济（AA Capability Indexes 真实指数分，0–100） */
function DimsGrid({
  dims,
}: {
  dims?: {
    financeAndAccounting?: number;
    strategyAndOps?: number;
    legal?: number;
    engineering?: number;
    economics?: number;
  };
}) {
  if (!dims) {
    return (
      <span style={{ fontSize: 12, color: "var(--mr-text-3)" }}>
        暂无该项评测
      </span>
    );
  }
  const items = [
    { label: "财务", value: dims.financeAndAccounting },
    { label: "战略", value: dims.strategyAndOps },
    { label: "法律", value: dims.legal },
    { label: "工程", value: dims.engineering },
    { label: "经济", value: dims.economics },
  ];
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, auto)",
        columnGap: 8,
        rowGap: 4,
        width: "fit-content",
      }}
    >
      {items.map((it) => (
        <div key={it.label} style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
          <span style={{ fontSize: 12, color: "var(--mr-text-4)" }}>{it.label}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--mr-text-2)" }}>
            {it.value != null ? it.value.toFixed(1) : "--"}
          </span>
        </div>
      ))}
    </div>
  );
}

function CheckBox({ checked }: { checked: boolean }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 16,
        height: 16,
        border: `1.5px solid ${checked ? "var(--mr-primary)" : "var(--mr-text-4)"}`,
        borderRadius: 4,
        background: checked ? "var(--mr-primary)" : "var(--mr-card)",
        color: "#fff",
        fontSize: 12,
        lineHeight: 1,
      }}
    >
      {checked ? "✓" : ""}
    </span>
  );
}

export function LeaderboardTable({ models }: { models: UIModelRecord[] }) {
  const { selected, toggle, has, max } = useCompare();
  const [sorting, setSorting] = useState<SortingState>([
    { id: "score", desc: true },
  ]);

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "select",
        header: () => {
          const allOn = models.every((m) => selected.includes(m.id));
          return (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <button
                aria-label="全选"
                onClick={() => {
                  models.forEach((m) => {
                    if (!has(m.id) && selected.length < max) toggle(m.id);
                  });
                  if (allOn) models.forEach((m) => has(m.id) && toggle(m.id));
                }}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                <CheckBox checked={allOn} />
              </button>
            </div>
          );
        },
        cell: ({ row }) => (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <button
              aria-label={`对比 ${row.original.name}`}
              onClick={() => {
                // 已选满 4 个再勾选第 5 个时给出提示（context.toggle 内部会静默拦截）
                if (!has(row.original.id) && selected.length >= max) {
                  Message.warning({ content: "最多对比 4 个模型" });
                  return;
                }
                toggle(row.original.id);
              }}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              <CheckBox checked={has(row.original.id)} />
            </button>
          </div>
        ),
      }),
      columnHelper.accessor("score", {
        id: "rank",
        header: "排名",
        cell: ({ row }) => {
          const r = row.original;
          const n = models.filter((m) => m.score > r.score).length + 1;
          const medal =
            n === 1
              ? { bg: "var(--mr-gold)", color: "#fff" }
              : n === 2
                ? { bg: "var(--mr-silver)", color: "#fff" }
                : n === 3
                  ? { bg: "var(--mr-bronze)", color: "#fff" }
                  : { bg: "transparent", color: "var(--mr-text-3)" };
          return (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 24,
                height: 24,
                borderRadius: 4,
                background: medal.bg,
                color: n <= 3 ? medal.color : "var(--mr-text-3)",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {n}
            </span>
          );
        },
      }),
      columnHelper.accessor("name", {
        id: "model",
        header: "模型",
        cell: ({ row }) => {
          const m = row.original;
          return (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <ProductLogo modelId={m.id} modelName={m.name} size={36} radius={8} />
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--mr-text)" }}>
                    <Link
                      href={`/detail/${m.id}`}
                      style={{ color: "var(--mr-text)", textDecoration: "none" }}
                    >
                      {m.name}
                    </Link>
                  </span>
                  <OpenTag openSource={m.openSource} />
                </div>
                <div style={{ fontSize: 12, color: "var(--mr-text-3)", marginTop: 4 }}>
                  {m.vendor} ·{" "}
                  <Link href={`/detail/${m.id}`} className="mr-link">
                    查看详情
                  </Link>
                </div>
                <div style={{ fontSize: 12, color: "var(--mr-text-4)", marginTop: 2 }}>
                  {m.context === "--" ? "上下文待核" : `${m.context} 上下文`} · 更新于 {m.updatedAt}
                </div>
              </div>
            </div>
          );
        },
      }),
      columnHelper.display({
        id: "dims",
        header: () => (
          <div>
            <div>能力</div>
            <div style={{ fontSize: 12, fontWeight: 400, color: "var(--mr-text-4)", marginTop: 1 }}>
              推理·代码·数学·中文·多模态
            </div>
          </div>
        ),
        cell: ({ row }) => <DimsGrid dims={row.original.dims} />,
      }),
      columnHelper.accessor("score", {
        id: "score",
        header: () => {
          const sort = sorting.find((s) => s.id === "score");
          const arrow =
            sort === undefined ? "⇅" : sort.desc ? "↓" : "↑";
          return (
            <span style={{ cursor: "pointer", userSelect: "none" }}>
              评分 <span style={{ color: "var(--mr-text-4)", fontSize: 12 }}>{arrow}</span>
            </span>
          );
        },
        cell: ({ row }) => {
          const m = row.original;
          return (
            <div>
              <div>
                <span style={{ fontSize: 16, fontWeight: 600, color: "var(--mr-text)" }}>
                  {m.score.toFixed(1)}
                </span>{" "}
                <DeltaText model={m} />
              </div>
              <div style={{ fontSize: 12, color: "var(--mr-text-3)", marginTop: 2 }}>
                {m.ci > 0 ? `±${m.ci.toFixed(1)}（CI）` : "暂无置信区间"}
              </div>
            </div>
          );
        },
      }),
      columnHelper.display({
        id: "price",
        header: "价格（输入/输出）",
        cell: ({ row }) => {
          const m = row.original;
          return (
            <div style={{ fontSize: 13, color: "var(--mr-text-2)" }}>
              {m.priceInput > 0 ? `输入 $${m.priceInput} · 输出 $${m.priceOutput}` : "待核对"}
              {m.priceEstimated ? "（估算）" : ""}
            </div>
          );
        },
      }),
      columnHelper.accessor("tier", {
        id: "tier",
        header: "性价比",
        cell: ({ row }) => <TierBadge tier={row.original.tier} />,
      }),
      columnHelper.accessor("source", {
        id: "source",
        header: "来源",
        cell: ({ row }) => <SourceTag source={row.original.source} />,
      }),
      columnHelper.display({
        id: "site",
        header: "官网",
        cell: ({ row }) => {
          const url = OFFICIAL_SITES[row.original.vendor];
          const modelUrl = row.original.website;
          if (!url && !modelUrl) {
            return (
              <span style={{ fontSize: 12, color: "var(--mr-text-3)" }}>暂无数据</span>
            );
          }
          return (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
              {url && (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 12, color: "var(--mr-primary)", textDecoration: "none" }}
                >
                  {displayDomain(url)} ↗
                </a>
              )}
              {modelUrl && (
                <a
                  href={modelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="该模型在 Artificial Analysis 的独立评测页（per-model 数据源）"
                  style={{ fontSize: 12, color: "var(--mr-text-3)", textDecoration: "none" }}
                >
                  模型页 ↗
                </a>
              )}
            </span>
          );
        },
      }),
    ],
    [models, selected, has, toggle, max, sorting]
  );

  const table = useReactTable<UIModelRecord>({
    data: models,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const widths: Record<string, number> = {
    select: 40,
    rank: 64,
    model: 280,
    dims: 150,
    score: 120,
    price: 160,
    tier: 80,
    source: 80,
    site: 140,
  };

  const headerGroups = table.getHeaderGroups();
  const rows = table.getRowModel().rows;

  return (
    <div
      className="mr-card mr-mx"
      style={{ marginTop: 14, overflowX: "auto", overflowY: "hidden" }}
    >
      {/* header row */}
      {headerGroups.map((hg) => (
        <div
          key={hg.id}
          style={{
            display: "flex",
            alignItems: "center",
            padding: "12px 20px 14px",
            background: "var(--mr-card-2)",
            borderBottom: "1px solid var(--mr-border)",
            boxSizing: "border-box",
          }}
        >
          {hg.headers.map((header) => {
            const col = header.column;
            const sortable = col.id === "score";
            return (
              <div
                key={header.id}
                style={{
                  width: widths[col.id] ?? 120,
                  flex: "none",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--mr-text-3)",
                  cursor: sortable ? "pointer" : "default",
                }}
                onClick={
                  sortable ? () => col.toggleSorting(undefined) : undefined
                }
              >
                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
              </div>
            );
          })}
        </div>
      ))}
      {/* body rows：奇偶斑马纹 + hover 品牌浅蓝 */}
      <style>{`
        .lb-row:nth-child(even) { background: var(--mr-card-2); }
        .lb-row { transition: background 0.15s ease; }
        .lb-row:hover { background: var(--mr-primary-bg); }
      `}</style>
      <div>
      {rows.map((row, i) => (
        <div
          key={row.id}
          className="lb-row"
          style={{
            display: "flex",
            alignItems: "center",
            minHeight: 76,
            padding: "12px 20px",
            borderBottom:
              i === rows.length - 1
                ? "none"
                : "1px solid var(--mr-border-soft)",
            boxSizing: "border-box",
          }}
        >
          {row.getVisibleCells().map((cell) => (
            <div
              key={cell.id}
              style={{
                width: widths[cell.column.id] ?? 120,
                flex: "none",
              }}
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </div>
          ))}
        </div>
      ))}
      </div>
      {/* footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 44,
          padding: "0 20px",
          background: "var(--mr-card-2)",
          borderTop: "1px solid var(--mr-border)",
        }}
      >
        <span style={{ fontSize: 12, color: "var(--mr-text-3)" }}>
          共 {models.length} 个模型
        </span>
        <Link href="/library" className="mr-btn-primary">
          查看完整榜单
        </Link>
      </div>
    </div>
  );
}
