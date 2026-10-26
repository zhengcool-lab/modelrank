import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "模型库 · ModelRank",
  description: "全量大模型榜单，按厂商、评分与价格浏览，查看每个模型的详情。",
};

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
