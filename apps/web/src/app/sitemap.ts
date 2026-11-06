import type { MetadataRoute } from "next";
import { AGENT_PRODUCTS } from "@/lib/agent-data";
import { UI_MODELS } from "@/lib/seed-data";
import { SITE_URL } from "@/lib/site";

// 站点地图：静态路由 + Agent 产品详情 + 模型详情
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-11-06");
  const routes = [
    "",
    "/agents",
    "/compare",
    "/cost",
    "/library",
    "/methodology",
    "/news",
    "/search",
    "/about",
    "/data-sources",
    "/disclaimer",
    ...AGENT_PRODUCTS.map((a) => `/agent/${a.id}`),
    ...UI_MODELS.map((m) => `/detail/${m.id}`),
  ];
  return routes.map((r) => ({
    url: `${SITE_URL}${r}`,
    lastModified,
    changeFrequency: "daily",
    priority: r === "" || r === "/agents" ? 1 : 0.7,
  }));
}
