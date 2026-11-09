import type { Metadata } from "next";
import { NavHeader } from "@/components/nav-header";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "免责声明 · ModelRank",
  description: "ModelRank 数据仅供参考，不构成采购或投资建议；第三方商标归各自所有。",
};

export default function DisclaimerPage() {
  return (
    <div>
      <NavHeader />

      <div className="mr-container">
      <div className="mr-pad-x" style={{ paddingTop: 24, maxWidth: 760, margin: "0 auto" }}>
        <h1 style={{ fontSize: "clamp(24px, 2.6vw, 32px)", fontWeight: 700, letterSpacing: "-0.6px", color: "var(--mr-text)", margin: 0 }}>免责声明</h1>
        <div style={{ fontSize: 13, color: "var(--mr-text-2)", marginTop: 6 }}>
          信息仅供参考，最终以厂商官方文档为准
        </div>

        <div className="mr-card" style={{ padding: "22px 24px", marginTop: 18, fontSize: 14, color: "var(--mr-text-2)", lineHeight: 1.9, overflowWrap: "break-word" }}>
          <p>
            本站展示的模型评分、价格、速率、上下文窗口等信息均基于公开资料整理，<b>仅供参考，不构成任何采购建议或投资建议</b>。模型能力与 API 价格会随版本迭代快速变化，请在正式决策前以各厂商官方文档与报价为准。
          </p>
          <p style={{ marginTop: 12 }}>
            本站为示例/mockup 站点，部分数据为演示用途的虚构数据，不代表任何厂商的真实产品状态。因使用本站信息而产生的任何直接或间接损失，本站不承担责任。
          </p>
          <p style={{ marginTop: 12 }}>
            文中出现的 GPT、Claude、Gemini、DeepSeek、Qwen、Llama、Mistral 等名称与标识均为其各自权利人的商标或商号，本站仅作事实性引用，与这些厂商无任何隶属或背书关系。
          </p>
          <p style={{ marginTop: 12 }}>
            如发现数据有误或涉及权利问题，欢迎通过页面底部邮箱联系我们，我们会在核实后尽快更正。
          </p>
        </div>
      </div>
      </div>

      <Footer />
    </div>
  );
}
