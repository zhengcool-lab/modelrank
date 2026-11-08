import type { Metadata } from "next";
import Link from "next/link";
import { NavHeader } from "@/components/nav-header";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "数据来源 · ModelRank",
  description: "ModelRank 榜单数据来源：公开 benchmark、厂商公开 API 报价、官方博客与新闻稿。",
};

const SOURCES = [
  {
    name: "LMSYS Chatbot Arena (Elo)",
    url: "https://lmarena.ai",
    用途: "人类盲测 Elo 分，权重 35%",
    污染风险: "高",
  },
  {
    name: "GPQA Diamond",
    url: "https://github.com/gpqa-bench/gpqa",
    用途: "研究生级科学推理，权重 20%",
    污染风险: "中",
  },
  {
    name: "LiveBench",
    url: "https://livebench.ai",
    用途: "动态更新的对抗性基准，权重 20%",
    污染风险: "低",
  },
  {
    name: "SWE-bench Verified",
    url: "https://www.swebench.com",
    用途: "真实 GitHub issue 修复，权重 15%",
    污染风险: "中",
  },
  {
    name: "C-Eval",
    url: "https://cevalbenchmark.com",
    用途: "中文综合知识，权重 10%",
    污染风险: "高",
  },
];

export default function DataSourcesPage() {
  return (
    <div>
      <NavHeader />

      <div className="mr-container">
      <div className="mr-pad-x" style={{ paddingTop: 24, maxWidth: 760, margin: "0 auto" }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.4px", color: "var(--mr-text)", margin: 0 }}>
          数据来源
        </h1>
        <div style={{ fontSize: 13, color: "var(--mr-text-2)", marginTop: 6 }}>
          所有榜单分数均可追溯到下列公开来源
        </div>

        <div className="mr-card" style={{ padding: "22px 24px", marginTop: 18, overflowWrap: "break-word" }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--mr-text)", margin: 0 }}>Benchmark 基准</h2>
          <div style={{ fontSize: 12, color: "var(--mr-text-3)", marginTop: 6 }}>
            图例：<span style={{ color: "#c0392b" }}>● 高</span> = 污染风险高、<span style={{ color: "#9a6a00" }}>● 中</span>、<span style={{ color: "#2e7d4f" }}>● 低</span>
          </div>
          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            {SOURCES.map((s) => (
              <div
                key={s.name}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 12px",
                  border: "0.5px solid var(--mr-hairline)",
                  borderRadius: "var(--mr-radius)",
                }}
              >
                <div style={{ minWidth: 0, overflowWrap: "break-word" }}>
                  <a href={s.url} target="_blank" rel="noreferrer noopener" className="mr-link">
                    {s.name}
                  </a>
                  <div style={{ fontSize: 12, color: "var(--mr-text-3)", marginTop: 3 }}>
                    {s.用途}
                  </div>
                </div>
                <div
                  style={{
                    flexShrink: 0,
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: "var(--mr-pill)",
                    background:
                      s.污染风险 === "高"
                        ? "rgba(217,70,70,0.12)"
                        : s.污染风险 === "中"
                          ? "rgba(217,150,30,0.12)"
                          : "rgba(50,160,90,0.12)",
                    color:
                      s.污染风险 === "高"
                        ? "#c0392b"
                        : s.污染风险 === "中"
                          ? "#9a6a00"
                          : "#2e7d4f",
                  }}
                >
                  污染风险：{s.污染风险}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mr-card" style={{ padding: "22px 24px", marginTop: 14, overflowWrap: "break-word" }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--mr-text)", margin: 0 }}>价格与产品信息</h2>
          <p style={{ marginTop: 10, fontSize: 14, color: "var(--mr-text-2)", lineHeight: 1.8 }}>
            页面展示的输入/输出 token 价格、上下文窗口、吞吐速率均来自各厂商官网公开 API 文档
            （OpenAI、Anthropic、Google、DeepSeek、阿里通义、Meta、Mistral AI），采集后由内部数据仓库统一维护。
            价格更新日期见每个模型详情页。
          </p>
          <p style={{ marginTop: 10, fontSize: 14, color: "var(--mr-text-2)", lineHeight: 1.8 }}>
            方法论与加权口径见 <Link href="/methodology" className="mr-link">方法论页</Link>。
            如发现数据错误或过期，欢迎通过详情页底部"企业咨询留资"反馈，我们会在 1 周内核实更新。
          </p>
        </div>
      </div>
      </div>

      <Footer />
    </div>
  );
}
