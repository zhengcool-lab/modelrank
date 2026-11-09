import type { Metadata } from "next";
import "./globals.css";
import "@arco-design/web-react/dist/css/arco.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  metadataBase: new URL("https://modelrank-1br.pages.dev"),
  title: "ModelRank 模型榜",
  description: "ModelRank — 大模型能力排行榜，覆盖价格、性能与能力档分级。",
  openGraph: {
    title: "ModelRank 模型榜",
    description: "公开基准聚合加权的大模型能力排行榜，覆盖价格、性能与能力档分级。",
    url: "/",
    siteName: "ModelRank·模型榜",
    locale: "zh_CN",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "ModelRank 模型榜",
    description: "公开基准聚合加权的大模型能力排行榜。",
  },
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
