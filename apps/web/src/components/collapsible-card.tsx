"use client";

import { useState, type ReactNode } from "react";

/**
 * 可折叠章节卡（手风琴）。
 *
 * 折叠时只隐藏内容、不卸载，折叠状态下 summary 作为一行摘要露出，
 * 让侧栏在收起时仍能读到关键结论而不是一排空壳标题。
 */
export function CollapsibleCard({
  no,
  title,
  summary,
  defaultOpen = false,
  marginTop = 14,
  children,
}: {
  no?: string;
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  marginTop?: number;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mr-card" style={{ padding: "14px 20px", marginTop }}>
      <button type="button" className="mr-acc-head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {no && (
          <span style={{ fontSize: 11, color: "var(--mr-text-4)", fontVariant: "tabular-nums", flex: "none" }}>{no}</span>
        )}
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--mr-text)", flex: "none" }}>{title}</span>
        {!open && summary && <span className="mr-acc-sum">{summary}</span>}
        <span className="mr-acc-chevron" style={{ transform: open ? "rotate(180deg)" : "none" }}>
          ⌄
        </span>
      </button>
      <div style={{ display: open ? "block" : "none", marginTop: 10 }}>{children}</div>
    </div>
  );
}
