"use client";

import Link from "next/link";
import { useState } from "react";
import { ProductLogo } from "@/components/model-logo";
import {
  AGENT_PRODUCTS,
  AGENT_CATEGORY_LABEL,
  entryPrice,
  hasPublishedMultiplier,
  publishedMultiplierCount,
  type AgentCategory,
  type AgentProduct,
  type Grade,
} from "@/lib/agent-data";

type TabKey = "coding" | "general";

const TABS: {
  key: TabKey;
  label: string;
  cats: AgentCategory[];
  desc: string;
}[] = [
  {
    key: "coding",
    label: "编码 Agent",
    cats: ["coding"],
    desc: "以 IDE / 终端为主战场，按订阅额度或 credits 计费；看补全质量、多文件改动与代码库理解。",
  },
  {
    key: "general",
    label: "通用 Agent",
    cats: ["office", "general"],
    desc: "对话式助手与办公协作（文档、表格、项目管理），额度按档位发放或按积分计费。",
  },
];

const GRADE_COLOR: Record<Grade, string> = {
  S: "var(--mr-primary)",
  A: "var(--mr-up)",
  B: "var(--mr-text-3)",
  C: "var(--mr-text-4)",
};

function GradePill({ label, grade }: { label: string; grade?: Grade }) {
  if (!grade) return null;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 11,
        color: "var(--mr-text-3)",
      }}
    >
      {label}
      <b style={{ color: GRADE_COLOR[grade], fontSize: 12, fontWeight: 700 }}>{grade}</b>
    </span>
  );
}

function gradeSummary(a: AgentProduct): string {
  const parts: string[] = [];
  if (a.grades.coding) parts.push(`编码 ${a.grades.coding}`);
  if (a.grades.office) parts.push(`办公 ${a.grades.office}`);
  if (a.grades.automation) parts.push(`自动化 ${a.grades.automation}`);
  if (a.grades.research) parts.push(`调研 ${a.grades.research}`);
  return parts.join(" · ");
}

function BestModelCell({ a }: { a: AgentProduct }) {
  if (!a.bestModel) {
    return <span style={{ color: "var(--mr-text-3)", fontSize: 12 }}>未公开型号</span>;
  }
  if (a.bestModel.slug && a.bestModel.score != null) {
    return (
      <Link href={`/detail/${a.bestModel.slug}`} className="mr-link" style={{ fontSize: 12 }}>
        {a.bestModel.name} · {a.bestModel.score}
      </Link>
    );
  }
  return (
    <span style={{ fontSize: 12 }}>
      {a.bestModel.name}
      <span style={{ color: "var(--mr-text-3)", marginLeft: 4 }}>· 站内未收录</span>
    </span>
  );
}

function ProductRow({ a }: { a: AgentProduct }) {
  return (
    <>
      <td style={{ padding: "12px 14px" }}>
        <Link
          href={`/agent/${a.id}`}
          style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}
        >
          <ProductLogo modelId={a.id} modelName={a.name} size={30} strict kind="agent" />
          <span>
            <span style={{ display: "block", color: "var(--mr-text)", fontWeight: 600 }}>{a.name}</span>
            <span style={{ display: "block", fontSize: 11, color: "var(--mr-text-3)" }}>{a.vendor}</span>
          </span>
        </Link>
      </td>
      <td style={{ padding: "12px 14px", color: "var(--mr-text-2)" }}>
        {AGENT_CATEGORY_LABEL[a.category]}
      </td>
      <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
        <span style={{ display: "flex", gap: 8 }}>
          <GradePill label="编" grade={a.grades.coding} />
          <GradePill label="办" grade={a.grades.office} />
          <GradePill label="自" grade={a.grades.automation} />
          <GradePill label="研" grade={a.grades.research} />
        </span>
      </td>
      <td style={{ padding: "12px 14px", color: "var(--mr-text)", fontWeight: 600, whiteSpace: "nowrap" }}>
        {entryPrice(a)}
      </td>
      <td style={{ padding: "12px 14px", color: "var(--mr-text-2)", whiteSpace: "nowrap" }}>
        {a.billingMode}
      </td>
      <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
        {hasPublishedMultiplier(a) ? (
          <span style={{ color: "var(--mr-up)", fontWeight: 600 }}>
            公开 {publishedMultiplierCount(a)} 项
          </span>
        ) : (
          <span style={{ color: "var(--mr-text-3)" }}>未公开数值</span>
        )}
      </td>
      <td style={{ padding: "12px 14px", color: "var(--mr-text-2)", whiteSpace: "nowrap" }}>
        <BestModelCell a={a} />
      </td>
    </>
  );
}

function ListView({ list }: { list: AgentProduct[] }) {
  return (
    <>
      {/* 桌面表格 */}
      <div className="hidden md:block mr-mx" style={{ marginTop: 18 }}>
        <div
          style={{
            border: "0.5px solid var(--mr-hairline)",
            borderRadius: "var(--mr-radius)",
            overflow: "hidden",
            background: "var(--mr-card)",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "var(--mr-card-2)", borderBottom: "0.5px solid var(--mr-hairline)" }}>
                {["产品", "类别", "能力评估", "起价", "计费方式", "模型倍率", "可调用强模型"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "10px 14px",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--mr-text-2)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((a, i) => (
                <tr
                  key={a.id}
                  style={{
                    borderBottom: i === list.length - 1 ? "none" : "1px solid var(--mr-border-soft)",
                  }}
                >
                  <ProductRow a={a} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 移动卡片 */}
      <div className="md:hidden mr-mx" style={{ marginTop: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {list.map((a) => (
            <Link
              key={a.id}
              href={`/agent/${a.id}`}
              style={{
                display: "block",
                padding: 14,
                borderRadius: "var(--mr-radius)",
                border: "0.5px solid var(--mr-hairline)",
                background: "var(--mr-card)",
                textDecoration: "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <ProductLogo modelId={a.id} modelName={a.name} size={34} strict kind="agent" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "var(--mr-text)" }}>{a.name}</div>
                  <div style={{ fontSize: 11, color: "var(--mr-text-3)", marginTop: 2 }}>
                    {a.vendor} · {AGENT_CATEGORY_LABEL[a.category]} · {a.billingMode}
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--mr-text)", whiteSpace: "nowrap" }}>
                  {entryPrice(a)}
                </div>
              </div>
              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: 11,
                  color: "var(--mr-text-3)",
                }}
              >
                <span>{gradeSummary(a)}</span>
                <span style={{ color: hasPublishedMultiplier(a) ? "var(--mr-up)" : "var(--mr-text-4)" }}>
                  {hasPublishedMultiplier(a) ? "倍率公开" : "倍率未公开"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

export function AgentBoard() {
  const [tab, setTab] = useState<TabKey>("coding");
  const active = TABS.find((t) => t.key === tab) ?? TABS[0];

  const byTab = TABS.map((t) => ({
    ...t,
    list: AGENT_PRODUCTS.filter((a) => t.cats.includes(a.category)),
  }));
  const counts = byTab.map((t) => ({ key: t.key, label: t.label, count: t.list.length }));

  return (
    <div>
      {/* 标签页 */}
      <div className="mr-mx" style={{ marginTop: 22 }}>
        <div
          role="tablist"
          aria-label="Agent 类别"
          style={{
            display: "inline-flex",
            padding: 4,
            gap: 4,
            borderRadius: "var(--mr-radius)",
            border: "0.5px solid var(--mr-hairline)",
            background: "var(--mr-card-2)",
          }}
        >
          {counts.map((t) => {
            const on = t.key === tab;
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={on}
                onClick={() => setTab(t.key)}
                style={{
                  appearance: "none",
                  border: on ? "1px solid transparent" : "0.5px solid var(--mr-hairline)",
                  cursor: "pointer",
                  padding: "8px 16px",
                  borderRadius: "var(--mr-radius)",
                  fontSize: 13,
                  fontWeight: on ? 700 : 500,
                  lineHeight: 1.2,
                  background: on ? "var(--mr-primary)" : "var(--mr-card)",
                  color: on ? "#fff" : "var(--mr-text-2)",
                  boxShadow: on ? "0 1px 2px rgba(0,0,0,.18)" : "none",
                  transition: "background .15s, color .15s",
                }}
              >
                {t.label}
                <span
                  style={{
                    marginLeft: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    opacity: on ? 0.9 : 0.65,
                  }}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>
        <div style={{ fontSize: 12, color: "var(--mr-text-3)", marginTop: 8, lineHeight: 1.6 }}>
          {active.desc}
        </div>
      </div>

      {/*
        两个标签的内容都服务端渲染，只切换显示：切换零延迟，
        且两类的产品与详情页内链都在 HTML 里（不被客户端状态挡住）。
      */}
      {byTab.map((t) => (
        <div key={t.key} style={{ display: t.key === tab ? undefined : "none" }}>
          <ListView list={t.list} />
        </div>
      ))}
    </div>
  );
}
