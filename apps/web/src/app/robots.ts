import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// robots：允许全部抓取，并指向本站 sitemap
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
