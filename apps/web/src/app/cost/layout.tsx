import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "成本计算器 · ModelRank",
  description: "按月用量与输入/输出比例，估算各大模型 API 的月度成本。",
};

export default function CostLayout({ children }: { children: React.ReactNode }) {
  return children;
}
