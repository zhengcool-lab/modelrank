"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Message } from "@arco-design/web-react";
import { UI_MODELS } from "@/lib/seed-data";
import { NavHeader } from "@/components/nav-header";
import { Footer } from "@/components/footer";
import { useCompare } from "@/context/compare";
import { DeltaText, TierBadge } from "@/components/badges";

const BUDGET_SEGMENTS = [
  { id: 0, label: "¥0–100", pick: "deepseek-r1", note: "月成本 ≈ ¥47（按 3000 万输入 token 估算）" },
  { id: 1, label: "¥100–500", pick: "gpt-5", note: "月成本 ≈ ¥320（按 3000 万输入 token 估算）" },
  { id: 2, label: "¥500+", pick: "claude-opus-4-5", note: "月成本 ≈ ¥3,810（按 3000 万输入 token 估算）" },
] as const;

function contextToK(c: string): number {
  if (c.endsWith("M")) return parseFloat(c) * 1000;
  if (c.endsWith("K")) return parseFloat(c);
  return parseFloat(c) || 0;
}

// 能力子维度：统一 4 条，带标签与数值（P1#33）
const DIM_ROWS: { key: "reasoning" | "code" | "chinese" | "multimodal"; label: string }[] = [
  { key: "reasoning", label: "推理" },
  { key: "code", label: "代码" },
  { key: "chinese", label: "中文" },
  { key: "multimodal", label: "多模态" },
];

function CompareInner() {
  const sp = useSearchParams();
  const { selected, toggle, clear, has } = useCompare();
  const [budget, setBudget] = useState<number>(1);
  // 自定义金额受控
  const [customBudget, setCustomBudget] = useState<string>("");

  // 从 ?ids=a,b,c 同步初始选中到 CompareContext
  useEffect(() => {
    const idsParam = sp.get("ids");
    if (!idsParam) return;
    const ids = idsParam.split(",").map((s) => s.trim()).filter((s) => UI_MODELS.some((m) => m.id === s));
    if (ids.length === 0) return;
    clear();
    ids.forEach((id) => {
      if (!has(id)) toggle(id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp]);

  const models = UI_MODELS.filter((m) => selected.includes(m.id));

  // P2#6：空态热门 chips —— 按 score 降序 Top6，点击即加入对比（复用 toggle）
  const hotModels = useMemo(
    () => [...UI_MODELS].sort((a, b) => b.score - a.score).slice(0, 6),
    [],
  );
  // P1#5：底部推荐卡 —— 按 score 降序 Top3，排除已加入对比的模型，空态下不渲染
  const recModels = useMemo(() => {
    const byScore = [...UI_MODELS].sort((a, b) => b.score - a.score);
    return byScore.filter((m) => !selected.includes(m.id)).slice(0, 3);
  }, [selected]);

  // 「重新计算」：当前为 mock，提示用户调整自定义金额
  const onRecalc = () => {
    Message.info({ content: "预算重算请调整自定义金额" });
  };

  // —— 每行最优值计算（P1#32）——
  // better: "max" 越大越好 / "min" 越小越好；返回最优 model id 集合（并列时多个）
  const bestIds = (getValue: (m: (typeof models)[number]) => number, better: "max" | "min"): Set<string> => {
    if (models.length === 0) return new Set();
    let bestVal = getValue(models[0]);
    for (const m of models) {
      const v = getValue(m);
      if (better === "max" ? v > bestVal : v < bestVal) bestVal = v;
    }
    // 并列容差：数值相等即并列最优
    return new Set(models.filter((m) => getValue(m) === bestVal).map((m) => m.id));
  };

  const bestScore = bestIds((m) => m.score, "max");
  const bestSpeed = bestIds((m) => m.speedTokPerS, "max");
  const bestContext = bestIds((m) => contextToK(m.context), "max");
  const bestPrice = bestIds((m) => m.priceOutput, "min");
  const bestDims: Record<string, Set<string>> = {};
  for (const d of DIM_ROWS) {
    bestDims[d.key] = bestIds((m) => m.dims?.[d.key] ?? -1, "max");
  }

  const bestStyle = (isBest: boolean): React.CSSProperties => ({
    fontWeight: isBest ? 700 : 400,
    color: isBest ? "var(--mr-primary)" : "var(--mr-text)",
    fontVariantNumeric: "tabular-nums",
  });

  const bestStar = (isBest: boolean) =>
    isBest ? (
      <span style={{ marginLeft: 4, color: "var(--mr-primary)", fontSize: 12, fontWeight: 700 }}>★</span>
    ) : null;

  // 对比横表的行定义：label + 每个模型的单元格渲染
  type RowDef = {
    label: string;
    renderCell: (m: (typeof models)[number]) => React.ReactNode;
    bestSet?: Set<string>;
  };

  const tableRows: RowDef[] = [
    {
      label: "综合评分",
      bestSet: bestScore,
      renderCell: (m) => (
        <span style={{ fontSize: 16, fontWeight: 600, ...bestStyle(bestScore.has(m.id)) }}>
          {m.score.toFixed(1)} <DeltaText model={m} />
          {bestStar(bestScore.has(m.id))}
        </span>
      ),
    },
    {
      label: "速率（tok/s）",
      bestSet: bestSpeed,
      renderCell: (m) => (
        <span style={{ fontSize: 14, ...bestStyle(bestSpeed.has(m.id)) }}>
          {m.speedTokPerS}{bestStar(bestSpeed.has(m.id))}
        </span>
      ),
    },
    {
      label: "上下文窗口",
      bestSet: bestContext,
      renderCell: (m) => (
        <span style={{ fontSize: 14, ...bestStyle(bestContext.has(m.id)) }}>
          {m.context}{bestStar(bestContext.has(m.id))}
        </span>
      ),
    },
    ...DIM_ROWS.map<RowDef>((d) => ({
      label: `能力 · ${d.label}`,
      bestSet: bestDims[d.key],
      renderCell: (m) => {
        const v = m.dims?.[d.key];
        const isBest = bestDims[d.key].has(m.id);
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, height: 6, background: "var(--mr-border-soft)", borderRadius: 3, overflow: "hidden" }}>
              <div
                style={{
                  width: `${v}%`,
                  height: 6,
                  background: isBest ? "var(--mr-primary)" : "var(--mr-text-4)",
                  borderRadius: 3,
                }}
              />
            </div>
            <span style={{ minWidth: 28, textAlign: "right", fontSize: 13, ...bestStyle(isBest) }}>
              {v ?? "--"}
            </span>
          </div>
        );
      },
    })),
    {
      label: "价格（输入/输出 ¥/M token）",
      bestSet: bestPrice,
      renderCell: (m) => (
        <span style={{ fontSize: 13, ...bestStyle(bestPrice.has(m.id)) }}>
          {m.priceInput > 0 ? `输入 ${m.priceInput} / 输出 ${m.priceOutput}` : "待核对"}
          {bestStar(bestPrice.has(m.id))}
        </span>
      ),
    },
    {
      label: "性价比评级",
      renderCell: (m) => <TierBadge tier={m.tier} />,
    },
  ];

  // 推荐卡通用顶部小标签
  const RecTag = ({ children, tone }: { children: React.ReactNode; tone: "blue" | "orange" | "gray" }) => {
    const colors =
      tone === "blue"
        ? { bg: "var(--mr-primary-bg)", color: "var(--mr-primary)" }
        : tone === "orange"
          ? { bg: "var(--mr-orange-bg)", color: "var(--mr-orange)" }
          : { bg: "var(--mr-card-2)", color: "var(--mr-text-2)" };
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          height: 22,
          padding: "0 8px",
          fontSize: 12,
          fontWeight: 600,
          borderRadius: 2,
          background: colors.bg,
          color: colors.color,
        }}
      >
        {children}
      </span>
    );
  };

  // P1#4/P1#5/P2#6：空态只渲染"人用的"完整空态（含热门 chips），不再在下方挂预算卡与推荐卡
  if (models.length === 0) {
    return (
      <div className="mr-mx" style={{ marginTop: 0 }}>
        <div
          style={{
            background: "var(--mr-card-2)",
            border: "1px dashed var(--mr-text-4)",
            borderRadius: 8,
            padding: "36px 20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
          }}
        >
          <span aria-hidden style={{ fontSize: 36, lineHeight: 1 }}>
            ⚖️
          </span>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--mr-text)" }}>尚未选择模型</div>
          <div style={{ fontSize: 13, color: "var(--mr-text-2)" }}>
            点击下方热门模型快速加入，或去模型库挑选 2–4 个模型开始对比
          </div>
          {/* 热门模型 chips：点击即加入对比，复用现有 toggle/context */}
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              justifyContent: "center",
              maxWidth: 560,
            }}
          >
            {hotModels.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => toggle(m.id)}
                style={{
                  height: 32,
                  padding: "0 14px",
                  fontSize: 12,
                  borderRadius: 16,
                  border: "1px solid var(--mr-primary)",
                  background: "var(--mr-primary-bg)",
                  color: "var(--mr-primary)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {m.name} ＋
              </button>
            ))}
          </div>
          <Link href="/library" className="mr-btn-primary">
            去模型库挑选模型
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mr-mx" style={{ display: "flex", gap: 20, flexWrap: "wrap", marginTop: 0 }}>
        {/* budget card */}
        <div className="mr-card" style={{ width: 340, flex: "1 1 280px", padding: 20, boxSizing: "border-box" }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--mr-text)", marginBottom: 14 }}>月预算</div>
          <div style={{ display: "flex", background: "var(--mr-card-2)", borderRadius: 4, padding: 3, marginBottom: 14 }}>
            {BUDGET_SEGMENTS.map((s) => (
              <button
                key={s.id}
                onClick={() => setBudget(s.id)}
                style={{
                  flex: 1,
                  textAlign: "center",
                  fontSize: 12,
                  fontWeight: budget === s.id ? 600 : 400,
                  color: budget === s.id ? "var(--mr-primary)" : "var(--mr-text-2)",
                  background: budget === s.id ? "var(--mr-card)" : "transparent",
                  height: 32,
                  borderRadius: 4,
                  border: "none",
                  cursor: "pointer",
                  boxShadow: budget === s.id ? "0 1px 3px rgba(29,33,41,0.12)" : "none",
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 12, color: "var(--mr-text-2)", marginBottom: 6 }}>自定义金额</div>
          <input
            value={customBudget}
            onChange={(e) => setCustomBudget(e.target.value)}
            placeholder="输入预算金额（元/月）"
            style={{
              width: "100%",
              height: 32,
              lineHeight: "30px",
              padding: "0 12px",
              border: "1px solid var(--mr-border)",
              borderRadius: 4,
              background: "var(--mr-card)",
              color: "var(--mr-text)",
              boxSizing: "border-box",
              outline: "none",
            }}
          />
          <div style={{ fontSize: 12, color: "var(--mr-text-2)", marginTop: 10 }}>
            按预算自动计算推荐模型与月用量。
          </div>
          {/* 橙色 CTA 降级为品牌蓝主按钮（P1#35） */}
          <button type="button" onClick={onRecalc} className="mr-btn-primary" style={{ width: "100%", marginTop: 16 }}>
            重新计算
          </button>
        </div>

        {/* P1#2：横表可横向滚动（外层 overflow-x:auto，内层 minWidth 保证窄屏触发滚动而非裁切）。指标列固定 150px，模型列等分撑满 */}
        <div className="mr-card" style={{ flex: "1 1 360px", overflowX: "auto", minWidth: 0 }}>
          <div style={{ minWidth: 720 }}>
            <div style={{ display: "flex", alignItems: "stretch", borderBottom: "1px solid var(--mr-border)", background: "var(--mr-card-2)", padding: "4px 0" }}>
              <div style={{ width: 150, flex: "none", padding: "0 16px", fontSize: 12, fontWeight: 600, color: "var(--mr-text-3)", display: "flex", alignItems: "center" }}>
                指标
              </div>
              {models.map((m) => (
                <div key={m.id} style={{ flex: 1, minWidth: 0, padding: "4px 14px" }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--mr-text)" }}>
                    {m.name}{" "}
                    <span
                      onClick={() => toggle(m.id)}
                      style={{ fontSize: 12, color: "var(--mr-down)", cursor: "pointer" }}
                    >
                      ✕
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--mr-text-3)" }}>
                    {m.vendor} · {m.openSource ? "开源" : "闭源"}
                  </div>
                </div>
              ))}
              <Link
                href="/search"
                style={{
                  width: 52,
                  flex: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderLeft: "1px solid var(--mr-border)",
                  fontSize: 20,
                  color: "var(--mr-primary)",
                  textDecoration: "none",
                }}
              >
                ＋
              </Link>
            </div>
            {tableRows.map((row, i) => (
              <div
                key={row.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  minHeight: 44,
                  padding: "2px 0",
                  borderBottom: i === tableRows.length - 1 ? "none" : "1px solid var(--mr-border)",
                }}
              >
                <div style={{ width: 150, flex: "none", padding: "0 16px", fontSize: 12.5, fontWeight: 600, color: "var(--mr-text-2)" }}>
                  {row.label}
                </div>
                {models.map((m) => (
                  <div key={m.id} style={{ flex: 1, minWidth: 0, fontSize: 13, color: "var(--mr-text)" }}>
                    {row.renderCell(m)}
                  </div>
                ))}
                <div style={{ width: 52, flex: "none" }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* P1#5：推荐卡按 UI_MODELS score 降序 Top3 真实派生（排除已选），点击跳详情；空态不渲染。P2#9：minWidth:0 + boxSizing 防 375px 溢出 */}
      <div className="mr-mx" style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 18 }}>
        {recModels.map((m, i) => {
          const tone = i === 0 ? "blue" : i === 1 ? "orange" : "gray";
          const tag = i === 0 ? "综合最强" : i === 1 ? "高分推荐" : "热门之选";
          return (
            <div
              key={m.id}
              className="mr-card"
              style={{ flex: "1 1 220px", padding: "18px 20px", minWidth: 0, boxSizing: "border-box" }}
            >
              <RecTag tone={tone}>{tag}</RecTag>
              <Link
                href={`/detail/${m.id}`}
                style={{ fontSize: 18, fontWeight: 600, color: "var(--mr-text)", marginTop: 10, display: "block", textDecoration: "none" }}
              >
                {m.name}
              </Link>
              <div style={{ fontSize: 13, color: "var(--mr-text-2)", marginTop: 6, fontVariantNumeric: "tabular-nums" }}>
                综合评分 {m.score.toFixed(1)}
              </div>
              <div style={{ fontSize: 12, color: "var(--mr-text-3)", marginTop: 10 }}>
                {m.vendor} · {m.priceInput > 0 ? `输入 ¥${m.priceInput} / 输出 ¥${m.priceOutput}` : "价格待核对"} · {m.tier} 级性价比
              </div>
              <Link href={`/detail/${m.id}`} className="mr-btn-outline" style={{ width: "100%", marginTop: 12 }}>
                查看详情
              </Link>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default function ComparePage() {
  // 数据更新时间：取全部模型 priceUpdatedAt 最大值（与首页口径一致）
  const lastUpdated = UI_MODELS.map((m) => m.priceUpdatedAt).sort().pop() ?? "";
  return (
    <div>
      <NavHeader />

      <div className="mr-container">
      <div className="mr-pad-x" style={{ paddingTop: 14, fontSize: 12, color: "var(--mr-text-3)" }}>
        <Link href="/" className="mr-link">模型榜</Link>
        <span style={{ color: "var(--mr-text-4)", margin: "0 6px" }}>/</span>
        <span style={{ color: "var(--mr-text-2)" }}>对比器</span>
      </div>

      <div className="mr-pad-x" style={{ paddingTop: 24, paddingBottom: 16 }}>
        <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.4px", color: "var(--mr-text)" }}>
          模型对比
        </div>
        <div style={{ fontSize: 13, color: "var(--mr-text-2)", marginTop: 6 }}>
          按预算筛选，快速找到最值得上线的模型 · 数据更新于 {lastUpdated.slice(5)}
        </div>
      </div>

      {/* useSearchParams 必须包在 Suspense 边界内 */}
      <Suspense fallback={<div className="mr-pad-x" style={{ paddingTop: 24 }}>加载中…</div>}>
        <CompareInner />
      </Suspense>
      </div>

      <Footer />
    </div>
  );
}
