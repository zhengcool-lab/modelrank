import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "大模型新闻 · ModelRank",
  description: "大模型发布、评测、融资、政策与价格动态聚合。",
};

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
