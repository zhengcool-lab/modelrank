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
import { useCompare } from "@/context/compare";
import {
  DeltaText,
  OpenTag,
  PriceLevelTag,
  SourceTag,
  Sparkline,
  TierBadge,
} from "./badges";

const columnHelper = createColumnHelper<UIModelRecord>();

function DimBar({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ width: 102 }}>
      <div style={{ fontSize: 12, color: "var(--mr-text-3)" }}>
        {label} {value}
      </div>
      <div
        style={{
          height: 4,
          background: "var(--mr-border-soft)",
          borderRadius: 2,
          marginTop: 2,
        }}
      >
        <div
          style={{
            width: `${value}%`,
            height: 4,
            background: "var(--mr-primary)",
            borderRadius: 2,
          }}
        />
      </div>
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
        borderRadius: 2,
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
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--mr-text)" }}>
                <Link
                  href={`/detail/${m.id}`}
                  style={{ color: "var(--mr-text)", textDecoration: "none" }}
                >
                  {m.name}
                </Link>
                <OpenTag openSource={m.openSource} />
              </div>
              <div style={{ fontSize: 12, color: "var(--mr-text-3)", marginTop: 2 }}>
                {m.vendor} ·{" "}
                <Link href={`/detail/${m.id}`} className="mr-link">
                  查看详情
                </Link>
              </div>
              <div style={{ fontSize: 12, color: "var(--mr-text-4)", marginTop: 2 }}>
                {m.context} 上下文 · 更新于 {m.updatedAt}
              </div>
            </div>
          );
        },
      }),
      columnHelper.display({
        id: "dims",
        header: "能力（推理/代码/中文/多模态）",
        cell: ({ row }) => {
          const d = row.original.dims;
          return (
            <div>
              <div style={{ display: "flex", gap: 8 }}>
                <DimBar label="推理" value={d.reasoning} />
                <DimBar label="代码" value={d.code} />
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 5 }}>
                <DimBar label="中文" value={d.chinese} />
                <DimBar label="多模态" value={d.multimodal} />
              </div>
            </div>
          );
        },
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
              <div style={{ fontSize: 12, color: "var(--mr-text-4)", marginTop: 2 }}>
                ±{m.ci.toFixed(1)}（CI）
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
            <div>
              <div style={{ fontSize: 13, color: "var(--mr-text-2)" }}>
                输入 ¥{m.priceInput} · 输出 ¥{m.priceOutput}
                {m.priceEstimated ? "（估算）" : ""}
              </div>
              <div style={{ marginTop: 3 }}>
                <PriceLevelTag level={m.priceLevel} />
              </div>
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
        id: "trend",
        header: "趋势",
        cell: ({ row }) => <Sparkline model={row.original} />,
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
    rank: 76,
    model: 280,
    dims: 230,
    score: 140,
    price: 180,
    tier: 120,
    source: 110,
    trend: 96,
  };

  const headerGroups = table.getHeaderGroups();
  const rows = table.getRowModel().rows;

  return (
    <div
      className="mr-card"
      style={{ margin: "14px 44px 0 44px", overflow: "hidden" }}
    >
      {/* header row */}
      {headerGroups.map((hg) => (
        <div
          key={hg.id}
          style={{
            display: "flex",
            alignItems: "center",
            height: 44,
            padding: "0 20px",
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
      {/* body rows */}
      {rows.map((row, i) => (
        <div
          key={row.id}
          style={{
            display: "flex",
            alignItems: "center",
            height: 76,
            padding: "0 20px",
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
          示例/mockup 数据 · 共 128 个模型
        </span>
        <Link href="/library" className="mr-btn-primary">
          查看完整榜单
        </Link>
      </div>
    </div>
  );
}
