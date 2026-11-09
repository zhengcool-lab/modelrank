import type { Metadata } from "next";
export const runtime = "edge";

import Link from "next/link";
import { notFound } from "next/navigation";
import { NavHeader } from "@/components/nav-header";
import { Footer } from "@/components/footer";
import { ProductLogo } from "@/components/model-logo";
import { AGENT_CATEGORY_LABEL, AGENT_PRODUCTS, getAgent, planPriceLabel, type AgentPlan, type Grade } from "@/lib/agent-data";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const a = getAgent(id);
  if (!a) return { title: "Agent 未收录 · ModelRank" };
  return {
    title: `${a.name} · Agent 产品详情 · ModelRank`,
    description: `${a.name}（${a.vendor}）的能力评估、套餐价格与模型计费倍率，价格核对于 ${a.priceCheckedAt}。`,
  };
}

const GRADE_COLOR: Record<Grade, string> = {
  S: "var(--mr-primary)",
  A: "var(--mr-up)",
  B: "var(--mr-text-3)",
  C: "var(--mr-text-4)",
};

const GRADE_TEXT: Record<Grade, string> = { S: "行业领先", A: "成熟可用", B: "够用", C: "偏弱" };

const DIM_LABEL: Record<string, string> = {
  coding: "编码",
  research: "调研",
  office: "办公",
  automation: "自动化",
};

function money(p: AgentPlan) {
  return planPriceLabel(p);
}

export default async function AgentDetailPage({ params }: Props) {
  const { id } = await params;
  const a = getAgent(id);
  if (!a) notFound();

  const dims = Object.entries(a.grades) as [string, Grade][];
  const published = (a.multipliers ?? []).filter((m) => typeof m.factor === "number" && m.factor > 0);

  return (
    <div>
      <NavHeader />

      <div className="mr-container">
        <div className="mr-pad-x" style={{ paddingTop: 24 }}>
          <div style={{ fontSize: 12, color: "var(--mr-text-3)" }}>
            <Link href="/" className="mr-link">模型榜</Link>
            <span style={{ color: "var(--mr-text-4)", margin: "0 6px" }}>/</span>
            <Link href="/agents" className="mr-link">Agent 产品榜</Link>
            <span style={{ color: "var(--mr-text-4)", margin: "0 6px" }}>/</span>
            <span style={{ color: "var(--mr-text-2)" }}>{a.name}</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 14 }}>
            <ProductLogo modelId={a.id} modelName={a.name} size={56} radius={12} strict kind="agent" />
            <div>
              <div style={{ fontSize: "clamp(22px, 2.4vw, 30px)", fontWeight: 700, letterSpacing: "-0.5px", color: "var(--mr-text)", lineHeight: 1.2 }}>{a.name}</div>
              <div style={{ fontSize: 13, color: "var(--mr-text-3)", marginTop: 4 }}>
                {a.vendor} · {AGENT_CATEGORY_LABEL[a.category]}类 · {a.billingMode}
              </div>
            </div>
          </div>

          <div style={{ fontSize: 14, color: "var(--mr-text-2)", marginTop: 14, lineHeight: 1.7 }}>{a.tagline}</div>
        </div>

        {/* 能力评估 */}
        <div className="mr-mx" style={{ marginTop: 22 }}>
          <div
            style={{
              padding: 16,
              borderRadius: "var(--mr-radius)",
              border: "0.5px solid var(--mr-hairline)",
              background: "var(--mr-card)",
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--mr-text)" }}>能力评估</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 20, marginTop: 14 }}>
              {dims.map(([k, g]) => (
                <div key={k} style={{ minWidth: 88 }}>
                  <div style={{ fontSize: 11, color: "var(--mr-text-3)" }}>{DIM_LABEL[k] ?? k}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 2 }}>
                    <span style={{ fontSize: 22, fontWeight: 700, color: GRADE_COLOR[g] }}>{g}</span>
                    <span style={{ fontSize: 11, color: "var(--mr-text-3)" }}>{GRADE_TEXT[g]}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, color: "var(--mr-text-3)", marginTop: 12, lineHeight: 1.6 }}>
              依据：{a.gradeBasis}
            </div>
            {a.bestModel && (
              <div
                style={{
                  marginTop: 12,
                  paddingTop: 12,
                  borderTop: "1px solid var(--mr-border-soft)",
                  fontSize: 12,
                  color: "var(--mr-text-2)",
                }}
              >
                可调用强模型
                <span style={{ marginLeft: 6, color: "var(--mr-text-3)", fontSize: 11 }}>
                  （官方列出型号中站内评分最高者）
                </span>
                ：
                {a.bestModel.slug && a.bestModel.score != null ? (
                  <Link href={`/detail/${a.bestModel.slug}`} className="mr-link" style={{ marginLeft: 4 }}>
                    {a.bestModel.name}（AA 智能指数 {a.bestModel.score}）
                  </Link>
                ) : (
                  <span style={{ marginLeft: 4 }}>
                    {a.bestModel.name}
                    <span style={{ color: "var(--mr-text-3)", marginLeft: 4 }}>（站内未收录该型号，暂无评分）</span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 套餐价格 */}
        <div className="mr-mx" style={{ marginTop: 22 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--mr-text)", marginBottom: 10 }}>
            套餐价格
            <span style={{ fontSize: 11, fontWeight: 400, color: "var(--mr-text-3)", marginLeft: 8 }}>
              核对日期 {a.priceCheckedAt}
            </span>
          </div>
          <div style={{ border: "0.5px solid var(--mr-hairline)", borderRadius: "var(--mr-radius)", overflow: "hidden", background: "var(--mr-card)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "var(--mr-card-2)", borderBottom: "0.5px solid var(--mr-hairline)" }}>
                  {["套餐", "价格", "额度", "备注"].map((h) => (
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
                {a.plans.map((p, i) => (
                  <tr
                    key={p.name}
                    style={{
                      borderBottom: i === a.plans.length - 1 ? "none" : "1px solid var(--mr-border-soft)",
                    }}
                  >
                    <td style={{ padding: "11px 14px", color: "var(--mr-text)", fontWeight: 600, whiteSpace: "nowrap" }}>{p.name}</td>
                    <td style={{ padding: "11px 14px", color: "var(--mr-text)", whiteSpace: "nowrap" }}>{money(p)}</td>
                    <td style={{ padding: "11px 14px", color: "var(--mr-text-2)" }}>{p.quota ?? "—"}</td>
                    <td style={{ padding: "11px 14px", color: "var(--mr-text-3)", fontSize: 12 }}>{p.note ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 模型与倍率 */}
        <div className="mr-mx" style={{ marginTop: 22 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--mr-text)", marginBottom: 10 }}>可选模型与计费倍率</div>
          <div style={{ fontSize: 12, color: "var(--mr-text-3)", marginBottom: 10, lineHeight: 1.6 }}>
            可选模型：{a.models.join(" / ")}
          </div>
          {a.multipliers && a.multipliers.length > 0 ? (
            <div style={{ border: "0.5px solid var(--mr-hairline)", borderRadius: "var(--mr-radius)", overflow: "hidden", background: "var(--mr-card)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "var(--mr-card-2)", borderBottom: "0.5px solid var(--mr-hairline)" }}>
                    {["模型 / 项", "倍率", "说明"].map((h) => (
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
                  {a.multipliers.map((m, i) => (
                    <tr
                      key={m.model}
                      style={{
                        borderBottom: i === a.multipliers!.length - 1 ? "none" : "1px solid var(--mr-border-soft)",
                      }}
                    >
                      <td style={{ padding: "11px 14px", color: "var(--mr-text)", fontWeight: 600 }}>{m.model}</td>
                      <td style={{ padding: "11px 14px", whiteSpace: "nowrap" }}>
                        {typeof m.factor === "number" && m.factor > 0 ? (
                          <span style={{ color: "var(--mr-up)", fontWeight: 700 }}>{m.factor}x</span>
                        ) : m.factor === 0 ? (
                          <span style={{ color: "var(--mr-text-3)" }}>不扣积分</span>
                        ) : (
                          <span style={{ color: "var(--mr-text-4)" }}>未公开</span>
                        )}
                      </td>
                      <td style={{ padding: "11px 14px", color: "var(--mr-text-2)", fontSize: 12, lineHeight: 1.6 }}>{m.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          <div style={{ fontSize: 12, color: "var(--mr-text-3)", marginTop: 10, lineHeight: 1.7 }}>
            {published.length > 0
              ? `其中 ${published.length} 项为官方公开的正数倍率，按官方原值展示；标注「未公开」的条目为官方仅作定性说明、未给倍率数值，本榜不估算。`
              : "该产品官方只说明额度与模型 Token 单价挂钩，未公开逐模型倍率数值，本榜不作推算。"}
          </div>
        </div>

        {/* 来源 */}
        <div className="mr-mx" style={{ marginTop: 22, marginBottom: 40 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--mr-text-2)", marginBottom: 8 }}>价格与规则来源</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {a.sources.map((s) => (
              <a
                key={s.url}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mr-link"
                style={{ fontSize: 12, wordBreak: "break-all" }}
              >
                {s.label}
                {s.overseas && (
                  <span style={{ marginLeft: 6, fontSize: 11, color: "var(--mr-text-4)" }}>（海外站点，需代理访问）</span>
                )}
              </a>
            ))}
          </div>

          <div
            style={{
              marginTop: 24,
              paddingTop: 16,
              borderTop: "1px solid var(--mr-border-soft)",
              fontSize: 12,
              color: "var(--mr-text-3)",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "baseline",
              rowGap: 6,
              columnGap: 10,
            }}
          >
            <span>其他 Agent：</span>
            {AGENT_PRODUCTS.filter((x) => x.id !== a.id).map((prod) => (
              <Link key={prod.id} href={`/agent/${prod.id}`} className="mr-link" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                {prod.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
