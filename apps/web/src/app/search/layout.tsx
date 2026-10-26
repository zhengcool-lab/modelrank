import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "搜索 · ModelRank",
  description: "按模型名、厂商与关键词检索全站模型与新闻。",
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
