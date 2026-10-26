import type { Metadata } from "next";
import Link from "next/link";
import { NavHeader } from "@/components/nav-header";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "关于我们 · ModelRank",
  description: "ModelRank 是一个独立的大模型能力排行榜：不接受付费排名，数据来自公开 benchmark。",
};

export default function AboutPage() {
  return (
    <div>
      <NavHeader />

      <div style={{ padding: "24px 44px 0 44px", maxWidth: 760 }}>
        <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.4px", color: "var(--mr-text)" }}>关于 ModelRank</div>
        <div style={{ fontSize: 13, color: "var(--mr-text-2)", marginTop: 6 }}>
          独立、透明、可申诉的大模型能力排行榜
        </div>

        <div className="mr-card" style={{ padding: "22px 24px", marginTop: 18, fontSize: 14, color: "var(--mr-text-2)", lineHeight: 1.9 }}>
          <p>
            ModelRank 是一个面向开发者与技术决策者的大模型能力排行榜。我们把公开可复现的基准测试结果按统一口径聚合加权，输出 0–100 的综合分，并同步展示价格、上下文、速率等采购相关指标，帮助你在选型时少踩坑。
          </p>
          <p style={{ marginTop: 12 }}>
            <b>我们承诺：不接受付费排名、不接受厂商充值上榜。</b>
            任何模型的排名只由其在公开 benchmark 上的实测成绩决定，厂商无法通过付费影响分数或排序。我们也不接受"定向刷榜"——一旦发现训练数据污染，会在方法论页面披露污染风险并下调权重。
          </p>
          <p style={{ marginTop: 12 }}>
            本榜数据全部来自公开 benchmark（LMSYS Chatbot Arena、GPQA、LiveBench、SWE-bench Verified、C-Eval 等，口径见
            <Link href="/methodology" className="mr-link"> 方法论</Link>
            ）。页面中的价格为各厂商公开 API 报价，仅供参考，实际以官方为准。当前站点为示例/mockup 版本，数据用于演示榜单形态。
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
