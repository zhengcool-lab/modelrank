import type { MetadataRoute } from "next";

// robots：允许全部抓取，并指向 sitemap
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://modelrank.zheng-cool.workers.dev/sitemap.xml",
  };
}
