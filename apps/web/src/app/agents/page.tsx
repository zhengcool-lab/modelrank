import type { Metadata } from "next";
export const runtime = "edge";

import Link from "next/link";
import { NavHeader } from "@/components/nav-header";
import { Footer } from "@/components/footer";
import { ProductLogo } from "@/components/model-logo";
import {
  AGENT_PRODUCTS,
  AGENT_CATEGORY_LABEL,
  entryPrice,
  hasPublishedMultiplier,
  publishedMultiplierCount,
  type AgentProduct,
  type Grade,
} from "@/lib/agent-data";

export const metadata: Metadata = {
  title: "Agent 产品榜 · ModelRank",
  description:
    "AI Agent 产品榜：编码与办公两类，对比能力、套餐价格与模型计费倍率，价格均标注核对日期与官方来源。",
};

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

export default function AgentsPage() {
  const checked = AGENT_PRODUCTS.map((a) => a.priceCheckedAt).sort().pop() ?? "";
  const coding = AGENT_PRODUCTS.filter((a) => a.category === "coding");
  const office = AGENT_PRODUCTS.filter((a) => a.category === "office");
  const general = AGENT_PRODUCTS.filter((a) => a.category === "general");

  return (
    <div>
      <NavHeader />

      <div className="mr-container">
        <div
          className="mr-pad-x flex flex-col sm:flex-row sm:items-start sm:justify-between"
          style={{ paddingTop: 32 }}
        >
          <div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 700,
                letterSpacing: "-0.5px",
                color: "var(--mr-text)",
                lineHeight: 1.2,
              }}
            >
              Agent 产品榜
            </div>
            <div style={{ fontSize: 13, color: "var(--mr-text-3)", marginTop: 6 }}>
              收录 {AGENT_PRODUCTS.length} 个 Agent 产品 · 能力为编辑评估（非第三方跑分）· 价格核对于 {checked} · 口径见
              <Link href="/methodology" className="mr-link" style={{ marginLeft: 4 }}>
                方法论
              </Link>
            </div>
          </div>
          <Link
            href="/"
            className="mr-link"
            style={{ fontSize: 12, marginTop: 10, whiteSpace: "nowrap" }}
          >
            ← 返回模型榜
          </Link>
        </div>

        {/* 桌面表格 */}
        <div className="hidden md:block mr-mx" style={{ marginTop: 24 }}>
          <div
            style={{
              border: "1px solid var(--mr-border)",
              borderRadius: 12,
              overflow: "hidden",
              background: "var(--mr-card)",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "var(--mr-card-2)", borderBottom: "1px solid var(--mr-border)" }}>
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
                {AGENT_PRODUCTS.map((a, i) => (
                  <tr
                    key={a.id}
                    style={{
                      borderBottom: i === AGENT_PRODUCTS.length - 1 ? "none" : "1px solid var(--mr-border-soft)",
                    }}
                  >
                    <td style={{ padding: "12px 14px" }}>
                      <Link href={`/agent/${a.id}`} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
                        <ProductLogo modelId={a.id} modelName={a.name} size={30} strict />
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
                    <td style={{ padding: "12px 14px", color: "var(--mr-text-2)", whiteSpace: "nowrap" }}>{a.billingMode}</td>
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
                      {a.bestModel ? (
                        <Link href={`/detail/${a.bestModel.slug}`} className="mr-link" style={{ fontSize: 12 }}>
                          {a.bestModel.name} · {a.bestModel.score}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 移动卡片 */}
        <div className="md:hidden mr-mx" style={{ marginTop: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {AGENT_PRODUCTS.map((a) => (
            <Link
              key={a.id}
              href={`/agent/${a.id}`}
              style={{
                display: "block",
                padding: 14,
                borderRadius: 12,
                border: "1px solid var(--mr-border)",
                background: "var(--mr-card)",
                textDecoration: "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <ProductLogo modelId={a.id} modelName={a.name} size={34} strict />
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

        {/* 分组速览 */}
        <div className="mr-mx" style={{ marginTop: 28, display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          {[
            { title: "编码类", list: coding, note: "以 IDE / 终端为主战场，按订阅额度或 credits 计费" },
            { title: "办公类", list: office, note: "文档、表格、项目协作闭环，普遍采用积分制" },
            { title: "通用类", list: general, note: "对话式助手 + 自主执行，额度按档位统一发放" },
          ].map((g) => (
            <div
              key={g.title}
              style={{
                padding: 16,
                borderRadius: 12,
                border: "1px solid var(--mr-border)",
                background: "var(--mr-card-2)",
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--mr-text)" }}>
                {g.title} · {g.list.length}
              </div>
              <div style={{ fontSize: 12, color: "var(--mr-text-3)", marginTop: 6, lineHeight: 1.6 }}>{g.note}</div>
              <div style={{ fontSize: 12, color: "var(--mr-text-2)", marginTop: 8 }}>
                {g.list.map((x) => x.name).join(" / ")}
              </div>
            </div>
          ))}
        </div>

        <div className="mr-mx" style={{ marginTop: 24, marginBottom: 40, fontSize: 12, lineHeight: 1.7, color: "var(--mr-text-3)" }}>
          <b style={{ color: "var(--mr-text-2)" }}>读表说明</b>
          ：能力等级 S / A / B / C 为编辑评估，依据官方功能清单与公开横评结论，不代表第三方 benchmark 分数；
          「可调用强模型」取该产品官方列出的可选型号中站内评分最高者，分数与其模型详情页一致，
          未逐一公开型号清单的产品（WorkBuddy、扣子、Manus 等）该列为推断，不作绝对断言。
          「模型倍率」只有官方公开了数值的才显示倍率（如 TRAE 的 Seed 系列 2.5 折、Devin 的 Gemini 4 Argon 5 折），
          其余产品官方仅说明「按模型 Token 单价浮动」而未给数值，本榜不推算、不估算。
          「起价」取最低可购买档位；标「询价」的档位（Devin Teams/Enterprise、ChatGPT Go、Manus 个人档）无固定标价，不计入起价。
          价格均来自官方定价页，促销价为连续包月/年付价。
        </div>
      </div>

      <Footer />
    </div>
  );
}
