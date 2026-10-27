"use client";

import { Suspense, useEffect, useState } from "react";
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

function DimBars({ dims }: { dims: { reasoning: number; code: number; chinese: number; multimodal: number } }) {
  const vals = [dims.reasoning, dims.code, dims.chinese, dims.multimodal];
  return (
    <div style={{ padding: "4px 14px" }}>
      {vals.map((v, i) => (
        <div
          key={i}
          style={{
            height: 4,
            background: "var(--mr-border-soft)",
            borderRadius: 2,
            marginBottom: i === vals.length - 1 ? 0 : 4,
          }}
        >
          <div style={{ width: `${v}%`, height: 4, background: "var(--mr-primary)", borderRadius: 2 }} />
        </div>
      ))}
    </div>
  );
}

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
  const seg = BUDGET_SEGMENTS[budget];
  const budgetPick = UI_MODELS.find((m) => m.id === seg.pick);
  const strongest = [...UI_MODELS].sort((a, b) => b.score - a.score)[0];
  const cheapest = [...UI_MODELS].sort((a, b) => a.priceOutput - b.priceOutput)[0];

  // 「重新计算」：当前为 mock，提示用户调整自定义金额
  const onRecalc = () => {
    Message.info({ content: "预算重算请调整自定义金额" });
  };

  return (
    <>
      {models.length === 0 && (
        <div
          style={{
            margin: "0 44px 12px 44px",
            background: "var(--mr-card-2)",
            border: "1px dashed var(--mr-text-4)",
            borderRadius: 8,
            padding: "10px 16px",
            fontSize: 12,
            color: "var(--mr-text-2)",
          }}
        >
          空选择态：尚未选择模型——<Link href="/" className="mr-link">从首页勾选</Link> 2–4 个模型后，此处出现对比横表
        </div>
      )}

      <div style={{ display: "flex", gap: 20, margin: "0 44px", flexWrap: "wrap" }}>
        {/* budget card */}
        <div className="mr-card" style={{ width: 340, flex: "1 1 280px", padding: 20 }}>
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
                  padding: "6px 0",
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
          <button type="button" onClick={onRecalc} className="mr-btn-orange" style={{ width: "100%", marginTop: 16 }}>
            重新计算
          </button>
        </div>

        {/* compare table */}
        {models.length > 0 && (
          <div className="mr-card" style={{ flex: "1 1 360px", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "stretch", borderBottom: "1px solid var(--mr-border)" }}>
              <div style={{ width: 170, flex: "none", padding: "0 16px", fontSize: 12, fontWeight: 600, color: "var(--mr-text-3)", display: "flex", alignItems: "center" }}>
                指标
              </div>
              {models.map((m) => (
                <div key={m.id} style={{ flex: 1, padding: "8px 14px" }}>
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
            {[
              {
                label: "综合评分",
                render: (m: (typeof models)[number]) => (
                  <span style={{ fontSize: 15, fontWeight: 600, color: "var(--mr-text)" }}>
                    {m.score.toFixed(1)} <DeltaText model={m} />
                  </span>
                ),
              },
              {
                label: "速率（tok/s）",
                render: (m: (typeof models)[number]) => (
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--mr-text)" }}>{m.speedTokPerS}</span>
                ),
              },
              {
                label: "上下文窗口",
                render: (m: (typeof models)[number]) => (
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--mr-text)" }}>{m.context}</span>
                ),
              },
              {
                label: "能力（推理/代码/中文/多模态）",
                render: (m: (typeof models)[number]) => <DimBars dims={m.dims} />,
              },
              {
                label: "价格（输入/输出 ¥/M token）",
                render: (m: (typeof models)[number]) => (
                  <span style={{ fontSize: 13, color: "var(--mr-text)" }}>
                    输入 {m.priceInput} / 输出 {m.priceOutput}
                  </span>
                ),
              },
              {
                label: "性价比评级",
                render: (m: (typeof models)[number]) => <TierBadge tier={m.tier} />,
              },
            ].map((row, i) => (
              <div
                key={row.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  minHeight: 52,
                  borderBottom: i === 5 ? "none" : "1px solid var(--mr-border-soft)",
                }}
              >
                <div style={{ width: 170, flex: "none", padding: "0 16px", fontSize: 13, color: "var(--mr-text-2)" }}>
                  {row.label}
                </div>
                {models.map((m) => (
                  <div key={m.id} style={{ flex: 1, fontSize: 13, color: "var(--mr-text)" }}>
                    {row.render(m)}
                  </div>
                ))}
                <div style={{ width: 52, flex: "none" }} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* conclusion cards */}
      <div style={{ display: "flex", gap: 16, margin: "18px 44px 0 44px", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 220px", background: "var(--mr-primary)", borderRadius: 8, padding: "18px 20px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>综合最强</div>
          <Link
            href={`/detail/${strongest.id}`}
            style={{ fontSize: 18, fontWeight: 600, color: "#fff", marginTop: 8, display: "block", textDecoration: "none" }}
          >
            {strongest.name}
          </Link>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 4 }}>
            综合评分 {strongest.score.toFixed(1)}
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 10 }}>
            连续 8 周榜首
          </div>
        </div>
        <div className="mr-card" style={{ flex: "1 1 220px", padding: "18px 20px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--mr-text-2)" }}>性价比最高</div>
          <Link
            href={`/detail/${cheapest.id}`}
            style={{ fontSize: 18, fontWeight: 600, color: "var(--mr-text)", marginTop: 8, display: "block", textDecoration: "none" }}
          >
            {cheapest.name}
          </Link>
          <div style={{ fontSize: 13, color: "var(--mr-text-2)", marginTop: 4 }}>
            输入 ¥{cheapest.priceInput} / 输出 ¥{cheapest.priceOutput} · 月成本推导见
            <Link href="/cost" className="mr-link">成本计算器</Link>
          </div>
          <div style={{ fontSize: 12, color: "var(--mr-text-3)", marginTop: 10 }}>
            {cheapest.openSource ? "开源权重" : "闭源 API"} · 推理速度 {cheapest.speedTokPerS} tok/s · {cheapest.tier} 级性价比
          </div>
        </div>
        <div className="mr-card" style={{ flex: "1 1 220px", padding: "18px 20px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--mr-text-2)" }}>
            预算内推荐（{seg.label}）
          </div>
          {budgetPick && (
            <>
              <Link
                href={`/detail/${budgetPick.id}`}
                style={{ fontSize: 18, fontWeight: 600, color: "var(--mr-text)", marginTop: 8, display: "block", textDecoration: "none" }}
              >
                {budgetPick.name}
              </Link>
              <div style={{ fontSize: 12, color: "var(--mr-text-3)", marginTop: 4 }}>{seg.note}</div>
              <Link
                href={`/detail/${budgetPick.id}`}
                className="mr-btn-orange"
                style={{ width: "100%", marginTop: 10 }}
              >
                查看详情
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default function ComparePage() {
  return (
    <div>
      <NavHeader />

      <div style={{ padding: "14px 44px 0 44px", fontSize: 12, color: "var(--mr-text-3)" }}>
        <Link href="/" className="mr-link">模型榜</Link>
        <span style={{ color: "var(--mr-text-4)", margin: "0 6px" }}>/</span>
        <span style={{ color: "var(--mr-text-2)" }}>对比器</span>
      </div>

      <div style={{ padding: "24px 44px 16px 44px" }}>
        <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.4px", color: "var(--mr-text)" }}>
          模型对比
        </div>
        <div style={{ fontSize: 13, color: "var(--mr-text-2)", marginTop: 6 }}>
          按预算筛选，快速找到最值得上线的模型 · 数据更新于 10-16 08:00
        </div>
      </div>

      {/* useSearchParams 必须包在 Suspense 边界内 */}
      <Suspense fallback={<div style={{ padding: "24px 44px" }}>加载中…</div>}>
        <CompareInner />
      </Suspense>

      <Footer />
    </div>
  );
}
