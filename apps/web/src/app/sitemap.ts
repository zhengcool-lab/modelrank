import type { MetadataRoute } from "next";

// 站点地图：列出所有静态路由
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://modelrank.zheng-cool.workers.dev";
  const lastModified = new Date("2026-10-26");
  const routes = [
    "",
    "/compare",
    "/cost",
    "/library",
    "/methodology",
    "/news",
    "/search",
    "/about",
    "/data-sources",
    "/disclaimer",
  ];
  return routes.map((r) => ({
    url: `${base}${r}`,
    lastModified,
    changeFrequency: "daily",
    priority: r === "" ? 1 : 0.7,
  }));
}
