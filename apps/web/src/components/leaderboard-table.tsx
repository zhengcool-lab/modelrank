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
  TierBadge,
} from "./badges";

const columnHelper = createColumnHelper<UIModelRecord>();

/** 2×2 能力维度网格：推理/代码 上排，中文/多模态 下排，纯数字无 bar */
function DimsGrid({ dims }: { dims: { reasoning: number; code: number; chinese: number; multimodal: number } }) {
  const items = [
    { label: "推理", value: dims.reasoning },
    { label: "代码", value: dims.code },
    { label: "中文", value: dims.chinese },
    { label: "多模态", value: dims.multimodal },
  ];
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, auto)",
        columnGap: 14,
        rowGap: 4,
        width: "fit-content",
      }}
    >
      {items.map((it) => (
        <div key={it.label} style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          <span style={{ fontSize: 10, color: "var(--mr-text-4)" }}>{it.label}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--mr-text-2)" }}>{it.value}</span>
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
        header: () => (
          <div>
            <div>能力</div>
            <div style={{ fontSize: 10, fontWeight: 400, color: "var(--mr-text-4)", marginTop: 1 }}>
              推理·代码·中文·多模态
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
    dims: 140,
    score: 120,
    price: 160,
    tier: 80,
    source: 80,
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
            height: 64,
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
          共 128 个模型
        </span>
        <Link href="/library" className="mr-btn-primary">
          查看完整榜单
        </Link>
      </div>
    </div>
  );
}
