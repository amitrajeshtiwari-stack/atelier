import type { MetadataRoute } from "next";
import { getNotices } from "@/lib/notices";
import { SITE_URL } from "@/lib/site";

/** Rebuilt hourly so freshly filed notices reach crawlers the same day. */
export const revalidate = 3600;

const STANDING_PAGES: MetadataRoute.Sitemap = [
  { url: "/", changeFrequency: "daily", priority: 1 },
  { url: "/gazette", changeFrequency: "daily", priority: 0.9 },
  { url: "/archive", changeFrequency: "weekly", priority: 0.6 },
  { url: "/about", changeFrequency: "monthly", priority: 0.5 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const notices = await getNotices().catch(() => []);

  const noticePages: MetadataRoute.Sitemap = notices.map((notice) => ({
    url: `/gazette/${notice.slug}`,
    lastModified: new Date(notice.updated_at),
    changeFrequency: "daily",
    priority: 0.8,
  }));

  return [...STANDING_PAGES, ...noticePages].map((entry) => ({
    ...entry,
    url: entry.url.startsWith("http") ? entry.url : `${SITE_URL}${entry.url}`,
  }));
}
