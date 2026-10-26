import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "模型对比 · ModelRank",
  description: "勾选 2–4 个大模型，按预算横向对比评分、速率、上下文与价格。",
};

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
