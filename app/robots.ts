import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Crawl rules. Everything reader-facing is fair game; the JSON feed is
 * excluded so search results always resolve to a page, never to raw data.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
