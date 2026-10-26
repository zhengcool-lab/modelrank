import type { Metadata } from "next";
import "./globals.css";
import "@arco-design/web-react/dist/css/arco.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "ModelRank 模型榜",
  description: "ModelRank — 大模型能力排行榜 · 示例/mockup",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
