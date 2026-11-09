import type { Metadata } from "next";
export const runtime = "edge";

import Link from "next/link";
import { NavHeader } from "@/components/nav-header";
import { Footer } from "@/components/footer";
import { AgentBoard } from "@/components/agent-board";
import { PageHeader } from "@/components/page-header";
import { AGENT_PRODUCTS } from "@/lib/agent-data";

export const metadata: Metadata = {
  title: "Agent 产品榜 · ModelRank",
  description:
    "AI Agent 产品榜：编码 Agent 与通用 Agent 两类，对比能力、套餐价格与模型计费倍率，价格均标注核对日期与官方来源。",
};

export default function AgentsPage() {
  // 各产品核对日不同（每日只对「官网仍列出原价」的产品刷新），列表页不能只报最新日期
  const dates = Array.from(new Set(AGENT_PRODUCTS.map((a) => a.priceCheckedAt))).sort();
  const checked = dates[dates.length - 1] ?? "";
  const checkedNote =
    dates.length > 1
      ? `（最早 ${dates[0]}，逐产品核对日见详情页）`
      : "（逐产品核对日见详情页）";
  const codingCount = AGENT_PRODUCTS.filter((a) => a.category === "coding").length;
  const generalCount = AGENT_PRODUCTS.length - codingCount;

  return (
    <div>
      <NavHeader />

      <div className="mr-container">
        <PageHeader
          breadcrumb={[{ label: "模型榜", href: "/" }, { label: "Agent 产品榜" }]}
          title="Agent 产品榜"
          subtitle={
            <>
              收录 {AGENT_PRODUCTS.length} 个 Agent 产品（编码 {codingCount} · 通用 {generalCount}）· 能力为编辑评估（非第三方跑分）· 口径见
              <Link href="/methodology" className="mr-link" style={{ marginLeft: 4 }}>
                方法论
              </Link>
              <span style={{ display: "block", color: "var(--mr-text-4)", marginTop: 4 }}>
                价格核对于 {checked}
                {checkedNote}
              </span>
            </>
          }
        />

        <AgentBoard />

        <div className="mr-mx" style={{ marginTop: 24, marginBottom: 40, fontSize: 12, lineHeight: 1.7, color: "var(--mr-text-3)" }}>
          <b style={{ color: "var(--mr-text-2)" }}>读表说明</b>
          ：能力等级 S / A / B / C 为编辑评估，依据官方功能清单与公开横评结论，不代表第三方 benchmark 分数；
          「可调用强模型」取该产品官方列出的可选型号中站内评分最高者，分数与其模型详情页一致。
          官方点名了型号但站内未收录的（如 Kiro 的 Claude Sonnet 4.5、Windsurf 的 SWE-2）标注「站内未收录」，
          官方完全未公开型号清单的（Augment、Replit、bolt、v0、Warp、Zed、Notion 等）标注「未公开型号」——两种情况都不补分数、不推测归属。
          「模型倍率」只有官方公开了数值的才显示倍率（如 TRAE 的 Seed 系列 2.5 折、Devin 的 Gemini 4 Argon 5 折），
          其余产品官方仅说明「按模型 Token 单价浮动」而未给数值，本榜不推算、不估算。
          「起价」取最低可购买档位；标「询价」的档位（Devin Teams/Enterprise、ChatGPT Go、Manus 个人档、Kiro 团队版等）无固定标价，不计入起价。
          价格均来自官方定价页，促销价为连续包月/年付价；图标取自各产品官网的官方 favicon / app icon，未做重绘。
        </div>
      </div>

      <Footer />
    </div>
  );
}
