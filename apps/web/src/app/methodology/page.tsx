import type { Metadata } from "next";
import Link from "next/link";
import { SEED_BENCHMARKS } from "@/lib/seed-data";
import { getMethodologyWeightMap, formatDate } from "@/lib/derived-data";
import { NavHeader } from "@/components/nav-header";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "评分方法论 · ModelRank",
  description: "公开基准聚合加权口径、权重分配、归一化方式与数据更新说明。",
};

const RISK_LABEL: Record<string, string> = { low: "低", med: "中", high: "高" };

// 污染风险视觉分级：高=红、中=黄、低=绿（复用全站语义色变量，深浅模式自适应）
const RISK_STYLE: Record<string, { background: string; color: string }> = {
  high: { background: "var(--mr-down-bg)", color: "var(--mr-down)" },
  med: { background: "var(--mr-warn-bg)", color: "var(--mr-warn-text)" },
  low: { background: "var(--mr-up-bg)", color: "var(--mr-up)" },
};

// 基准 → 综合分维度映射：把下方「基准权重」与上方「维度权重」两套体系对齐
const BENCH_DIMENSION: Record<string, string> = {
  "lmsys-arena": "推理",
  "gpqa-diamond": "数学",
  livebench: "推理",
  "swe-bench-verified": "代码",
  ceval: "中文",
};

// benchmarkMap 中的名称 → SEED_BENCHMARKS 的 id，用于把闭环保重映射回数据源表
const CLOSED_BENCH_NAME_TO_ID: Record<string, string> = {
  "LMSYS Chatbot Arena": "lmsys-arena",
  LiveBench: "livebench",
  "GPQA Diamond": "gpqa-diamond",
  "SWE-bench Verified": "swe-bench-verified",
  "C-Eval": "ceval",
};

export default function MethodologyPage() {
  const wm = getMethodologyWeightMap();
  // 闭环保重：id → weight（与维度权重自洽，含多模态 8% 专家评测兜底）
  const closedWeightById: Record<string, number> = {};
  for (const bm of wm.benchmarkMap) {
    const id = CLOSED_BENCH_NAME_TO_ID[bm.benchmark];
    if (id) closedWeightById[id] = bm.weight;
  }
  const dimensionFormula = Object.entries(wm.dimensionWeights)
    .map(([dim, w]) => `${Math.round(w * 100)}% × ${dim}`)
    .join(" + ");
  return (
    <div>
      <NavHeader />

      <div className="mr-container">
      <div className="mr-pad-x" style={{ paddingTop: 14, fontSize: 12, color: "var(--mr-text-3)" }}>
        <Link href="/" className="mr-link">模型榜</Link>
        <span style={{ color: "var(--mr-text-4)", margin: "0 6px" }}>/</span>
        <span style={{ color: "var(--mr-text-2)" }}>评分方法论</span>
      </div>

      <div className="mr-pad-x" style={{ paddingTop: 24 }}>
        <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.4px", color: "var(--mr-text)" }}>评分方法论</div>
        <div style={{ fontSize: 13, color: "var(--mr-text-2)", marginTop: 6 }}>
          公开基准聚合加权 v0.9 · 指数平滑周环比 · 透明可申诉
        </div>
      </div>

      <div className="mr-mx flex flex-col md:flex-row" style={{ gap: 20, marginTop: 18 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="mr-card" style={{ padding: "20px 22px" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--mr-text)" }}>综合分权重（维度）</div>
            <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
              {Object.entries(wm.dimensionWeights).map(([dim, w]) => (
                <span
                  key={dim}
                  style={{
                    display: "inline-flex",
                    alignItems: "baseline",
                    gap: 4,
                    padding: "4px 10px",
                    borderRadius: 4,
                    background: "var(--mr-card-2)",
                    fontSize: 12,
                    color: "var(--mr-text)",
                  }}
                >
                  <span style={{ color: "var(--mr-text-2)" }}>{dim}</span>
                  <span style={{ fontWeight: 600, fontVariant: "tabular-nums" }}>{Math.round(w * 100)}%</span>
                </span>
              ))}
            </div>
            <div
              style={{
                marginTop: 12,
                padding: "12px 14px",
                background: "var(--mr-card-2)",
                borderRadius: 4,
                fontSize: 13,
                color: "var(--mr-text)",
                lineHeight: 1.7,
              }}
            >
              综合分 = {dimensionFormula}
            </div>
            <div style={{ fontSize: 12, color: "var(--mr-text-3)", lineHeight: 1.8, marginTop: 10 }}>
              · β = 0.25 指数平滑周环比，避免单周波动；<br />
              · 盲测加权 v1 暂缓，待样本量 ≥ 3000 后启用。
            </div>
          </div>

          <div className="mr-card" style={{ padding: "20px 22px", marginTop: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--mr-text)" }}>归一化映射</div>
            <div style={{ fontSize: 13, color: "var(--mr-text-2)", lineHeight: 1.8, marginTop: 10 }}>
              各维度原始分先在同期全部参评模型内做 min-max 归一化到 0–100，再按上表权重加权求和；置信区间按各基准近 8 周标准差估计，对外披露 ±CI 区间。
            </div>
          </div>

          <div className="mr-card" style={{ padding: "20px 22px", marginTop: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--mr-text)" }}>基准权重映射</div>
            <div style={{ marginTop: 12 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  minHeight: 28,
                  gap: 8,
                  fontSize: 12,
                  color: "var(--mr-text-3)",
                  borderTop: "1px solid var(--mr-border-soft)",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>基准</div>
                <div style={{ width: 56, flex: "none" }}>维度</div>
                <div style={{ width: 56, flex: "none", textAlign: "right" }}>权重</div>
              </div>
              {wm.benchmarkMap.map((bm, i) => (
                <div
                  key={bm.benchmark}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    minHeight: 36,
                    gap: 8,
                    padding: "6px 0",
                    borderTop: "1px solid var(--mr-border-soft)",
                    borderBottom: i === wm.benchmarkMap.length - 1 ? "1px solid var(--mr-border-soft)" : "none",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0, fontSize: 13, color: "var(--mr-text)", lineHeight: 1.4 }}>{bm.benchmark}</div>
                  <div style={{ width: 56, flex: "none", fontSize: 12, color: "var(--mr-text-2)" }}>{bm.dimension}</div>
                  <div style={{ width: 56, flex: "none", fontSize: 12, color: "var(--mr-text-3)", textAlign: "right", fontVariant: "tabular-nums" }}>
                    {Math.round(bm.weight * 100)}%
                  </div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, color: "var(--mr-text-3)", lineHeight: 1.8, marginTop: 10 }}>{wm.note}</div>
          </div>

          <div className="mr-card" style={{ padding: "20px 22px", marginTop: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--mr-text)" }}>数据源清单</div>
            <div style={{ marginTop: 12 }}>
              {/* 表头行 */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  minHeight: 28,
                  gap: 8,
                  fontSize: 12,
                  color: "var(--mr-text-3)",
                  borderTop: "1px solid var(--mr-border-soft)",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>基准</div>
                <div style={{ width: 56, flex: "none" }}>对应维度</div>
                <div style={{ width: 56, flex: "none", textAlign: "right" }}>权重</div>
                <div style={{ width: 64, flex: "none" }}>污染风险</div>
              </div>
              {SEED_BENCHMARKS.map((d, i) => {
                const risk = RISK_LABEL[d.contaminationRisk] ?? d.contaminationRisk;
                const riskStyle = RISK_STYLE[d.contaminationRisk];
                const closedW = closedWeightById[d.id];
                return (
                  <div
                    key={d.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      minHeight: 36,
                      gap: 8,
                      padding: "6px 0",
                      borderTop: "1px solid var(--mr-border-soft)",
                      borderBottom: i === SEED_BENCHMARKS.length - 1 ? "1px solid var(--mr-border-soft)" : "none",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0, fontSize: 13, color: "var(--mr-text)", lineHeight: 1.4, wordBreak: "break-word" }}>{d.name}</div>
                    <div style={{ width: 56, flex: "none", fontSize: 12, color: "var(--mr-text-2)" }}>{BENCH_DIMENSION[d.id] ?? "—"}</div>
                    <div style={{ width: 56, flex: "none", fontSize: 12, color: "var(--mr-text-3)", textAlign: "right", fontVariant: "tabular-nums" }}>
                      {closedW != null ? `${Math.round(closedW * 100)}%` : `${Math.round(d.weight * 100)}%`}
                    </div>
                    <div style={{ width: 64, flex: "none" }}>
                      <span
                        style={{
                          display: "inline-block",
                          fontSize: 12,
                          lineHeight: "20px",
                          padding: "0 8px",
                          borderRadius: 10,
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                          ...riskStyle,
                        }}
                      >
                        {risk}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: 12, color: "var(--mr-text-3)", lineHeight: 1.8, marginTop: 10 }}>{wm.note}</div>
          </div>
        </div>

        <div style={{ flex: "none", minWidth: 0 }} className="md:w-[360px]">
          <div className="mr-card" style={{ padding: "20px 22px" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--mr-text)" }}>口径假设</div>
            <div style={{ fontSize: 13, color: "var(--mr-text-2)", lineHeight: 1.8, marginTop: 10 }}>
              缓存命中率统一按 <b>30%</b> 估算（行业 20–40% 中值）；成本计算器支持 0 / 30 / 60% 三档切换。
            </div>
          </div>
          <div className="mr-card" style={{ padding: "20px 22px", marginTop: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--mr-text)" }}>更新日志</div>
            <div style={{ fontSize: 12, color: "var(--mr-text-2)", lineHeight: 2, marginTop: 10, fontVariant: "tabular-nums" }}>
              <span style={{ color: "var(--mr-primary)", fontWeight: 600 }}>{formatDate("10-16")}</span> · 新增 Llama 4 Maverick<br />
              <span style={{ color: "var(--mr-primary)", fontWeight: 600 }}>{formatDate("10-12")}</span> · GPT-5 纳入官方价格口径<br />
              <span style={{ color: "var(--mr-primary)", fontWeight: 600 }}>{formatDate("10-08")}</span> · 权重体系 v0.9 灰度发布
            </div>
          </div>
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            <Link
              href="/disclaimer"
              className="mr-btn-outline"
              style={{ height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              对结果有异议？申诉 →
            </Link>
            <button
              className="mr-btn-primary"
              style={{ height: 36, opacity: 0.5, cursor: "not-allowed" }}
              disabled
              aria-disabled="true"
              title="功能开发中，敬请期待"
            >
              导出快照（即将上线）
            </button>
          </div>
        </div>
      </div>
      </div>

      <Footer />
    </div>
  );
}
