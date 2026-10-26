import Link from "next/link";
import { NavHeader } from "@/components/nav-header";
import { Footer } from "@/components/footer";

const DATA_SOURCES = [
  { name: "LMSYS Chatbot Arena 盲测", weight: "低", risk: "低" },
  { name: "MMLU · GPQA（知识/推理）", weight: "中", risk: "低" },
  { name: "GSM8K · Math（数学）", weight: "中", risk: "中" },
  { name: "HumanEval · SWE-bench（代码）", weight: "低", risk: "中" },
  { name: "C-Eval · CMMLU（中文）", weight: "中", risk: "低" },
];

export default function MethodologyPage() {
  return (
    <div>
      <NavHeader />

      <div style={{ padding: "14px 44px 0 44px", fontSize: 12, color: "var(--mr-text-3)" }}>
        <Link href="/" className="mr-link">模型榜</Link>
        <span style={{ color: "var(--mr-text-4)", margin: "0 6px" }}>/</span>
        <span style={{ color: "var(--mr-text-2)" }}>评分方法论</span>
      </div>

      <div style={{ padding: "24px 44px 0 44px" }}>
        <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.4px", color: "var(--mr-text)" }}>评分方法论</div>
        <div style={{ fontSize: 13, color: "var(--mr-text-2)", marginTop: 6 }}>
          公开基准聚合加权 v0.9 · 指数平滑周环比 · 透明可申诉 · 示例/mockup
        </div>
      </div>

      <div style={{ display: "flex", gap: 20, margin: "18px 44px 0 44px" }}>
        <div style={{ flex: 1 }}>
          <div className="mr-card" style={{ padding: "20px 22px" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--mr-text)" }}>综合分权重公式</div>
            <div
              style={{
                marginTop: 14,
                padding: "14px 16px",
                background: "var(--mr-card-2)",
                borderRadius: 4,
                fontSize: 14,
                fontWeight: 600,
                color: "var(--mr-text)",
                lineHeight: 1.8,
              }}
            >
              综合分 = 0.35×推理 + 0.25×代码 + 0.20×数学 + 0.12×中文 + 0.08×多模态
            </div>
            <div style={{ fontSize: 12, color: "var(--mr-text-3)", lineHeight: 1.8, marginTop: 10 }}>
              · α = 0.25 指数平滑周环比，避免单周波动；<br />
              · 盲测加权 v1 暂缓，待样本量 ≥ 3000 后启用（示例/mockup）。
            </div>
          </div>

          <div className="mr-card" style={{ padding: "20px 22px", marginTop: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--mr-text)" }}>归一化映射</div>
            <div style={{ fontSize: 13, color: "var(--mr-text-2)", lineHeight: 1.8, marginTop: 10 }}>
              各维度原始分先在同期全部参评模型内做 min-max 归一化到 0–100，再按上表权重加权求和；置信区间按各基准近 8 周标准差估计，对外披露 ±CI 区间。
            </div>
          </div>

          <div className="mr-card" style={{ padding: "20px 22px", marginTop: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--mr-text)" }}>数据源清单</div>
            <div style={{ marginTop: 12 }}>
              {DATA_SOURCES.map((d, i) => (
                <div
                  key={d.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    height: 40,
                    borderTop: "1px solid var(--mr-border-soft)",
                    borderBottom: i === DATA_SOURCES.length - 1 ? "1px solid var(--mr-border-soft)" : "none",
                  }}
                >
                  <div style={{ flex: 1, fontSize: 13, color: "var(--mr-text)" }}>{d.name}</div>
                  <div style={{ width: 110, fontSize: 12, color: "var(--mr-text-3)" }}>权重 {d.weight}</div>
                  <div style={{ width: 110, fontSize: 12, color: "var(--mr-text-3)" }}>污染风险 {d.risk}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ width: 360, flex: "none" }}>
          <div className="mr-card" style={{ padding: "20px 22px" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--mr-text)" }}>口径假设</div>
            <div style={{ fontSize: 13, color: "var(--mr-text-2)", lineHeight: 1.8, marginTop: 10 }}>
              缓存命中率统一按 <b>30%</b> 估算（行业 20–40% 中值）；成本计算器支持 0 / 30 / 60% 三档切换。
            </div>
          </div>
          <div className="mr-card" style={{ padding: "20px 22px", marginTop: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--mr-text)" }}>更新日志</div>
            <div style={{ fontSize: 12, color: "var(--mr-text-2)", lineHeight: 2, marginTop: 10 }}>
              <span style={{ color: "var(--mr-primary)", fontWeight: 600 }}>10-16</span> · 新增 Llama 4 Maverick<br />
              <span style={{ color: "var(--mr-primary)", fontWeight: 600 }}>10-12</span> · GPT-5 纳入官方价格口径<br />
              <span style={{ color: "var(--mr-primary)", fontWeight: 600 }}>10-08</span> · 权重体系 v0.9 灰度发布
            </div>
          </div>
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            <button className="mr-btn-outline" style={{ height: 36 }}>对结果有异议？申诉 →</button>
            <button className="mr-btn-primary" style={{ height: 36 }}>导出快照（占位）</button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
