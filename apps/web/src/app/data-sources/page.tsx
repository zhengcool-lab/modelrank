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

      <div style={{ padding: "24px 44px 0 44px", maxWidth: 820 }}>
        <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.4px", color: "var(--mr-text)" }}>
          数据来源
        </div>
        <div style={{ fontSize: 13, color: "var(--mr-text-2)", marginTop: 6 }}>
          所有榜单分数均可追溯到下列公开来源
        </div>

        <div className="mr-card" style={{ padding: "22px 24px", marginTop: 18 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--mr-text)" }}>Benchmark 基准</div>
          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            {SOURCES.map((s) => (
              <div
                key={s.name}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 12px",
                  border: "1px solid var(--mr-border)",
                  borderRadius: 6,
                }}
              >
                <div>
                  <a href={s.url} target="_blank" rel="noreferrer noopener" className="mr-link">
                    {s.name}
                  </a>
                  <div style={{ fontSize: 12, color: "var(--mr-text-3)", marginTop: 3 }}>
                    {s.用途}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 12,
                    padding: "2px 8px",
                    borderRadius: 4,
                    background:
                      s.污染风险 === "高"
                        ? "rgba(217,70,70,0.12)"
                        : s.污染风险 === "中"
                          ? "rgba(217,150,30,0.12)"
                          : "rgba(50,160,90,0.12)",
                    color: "var(--mr-text-2)",
                  }}
                >
                  污染风险：{s.污染风险}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mr-card" style={{ padding: "22px 24px", marginTop: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--mr-text)" }}>价格与产品信息</div>
          <p style={{ marginTop: 10, fontSize: 14, color: "var(--mr-text-2)", lineHeight: 1.8 }}>
            页面展示的输入/输出 token 价格、上下文窗口、吞吐速率均来自各厂商官网公开 API 文档
            （OpenAI、Anthropic、Google、DeepSeek、阿里通义、Meta、Mistral AI），采集后在本仓库
            <code style={{ margin: "0 4px", padding: "2px 6px", borderRadius: 3, background: "var(--mr-border)" }}>
              apps/web/src/lib/seed-data.ts
            </code>
            中维护。价格更新日期见每个模型详情页。
          </p>
          <p style={{ marginTop: 10, fontSize: 14, color: "var(--mr-text-2)", lineHeight: 1.8 }}>
            方法论与加权口径见 <Link href="/methodology" className="mr-link">方法论页</Link>。
            如发现数据错误或过期，欢迎通过详情页底部"企业咨询留资"反馈，我们会在 1 周内核实更新。
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
