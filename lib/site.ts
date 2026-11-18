/**
 * Public identity of the publication, in one place.
 *
 * The canonical origin comes from `NEXT_PUBLIC_SITE_URL` so a deploy only
 * has to set one environment variable — canonicals, the sitemap, robots
 * and social cards all follow it. On localhost it falls back to the dev
 * server, which keeps local metadata honest without hardcoding a domain
 * we have not launched on yet.
 */
import type { Metadata } from "next";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/+$/, "");

export const SITE_NAME = "Gazette";

export const SITE_TAGLINE = "Government job openings, filed daily";

export const SITE_DESCRIPTION =
  "A daily plate of India government job notifications — departments, vacancies, last dates, at a glance. Every notice links to the official portal.";

export const SITE_LOCALE = "en_IN";

/**
 * The inbox readers can actually reach. Set `NEXT_PUBLIC_CONTACT_EMAIL` in
 * the deployment environment; until then it points at a reserved `.example`
 * domain so a placeholder can never be mistaken for a live address.
 */
export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@gazette.example";

/** The date the policy pages were last revised. */
export const POLICIES_UPDATED = "18 November 2026";

/** The shared social card every page falls back to. */
export const SOCIAL_IMAGE = {
  url: "/og.png",
  width: 1200,
  height: 630,
  alt: `${SITE_NAME} — ${SITE_TAGLINE}`,
} as const;

/**
 * A complete Open Graph block for one page. Metadata objects are replaced
 * wholesale per route, so pages build theirs through this helper rather
 * than patching individual fields and losing the image.
 */
export function openGraphFor({
  path,
  title = `${SITE_NAME} — ${SITE_TAGLINE}`,
  description = SITE_DESCRIPTION,
  type = "website",
}: {
  path: string;
  title?: string;
  description?: string;
  type?: "website" | "article";
}) {
  return {
    type,
    siteName: SITE_NAME,
    locale: SITE_LOCALE,
    url: path,
    title,
    description,
    images: [SOCIAL_IMAGE],
  };
}

/** The matching Twitter/X card for the same page. */
export function twitterFor({
  title = `${SITE_NAME} — ${SITE_TAGLINE}`,
  description = SITE_DESCRIPTION,
}: {
  title?: string;
  description?: string;
}) {
  return {
    card: "summary_large_image" as const,
    title,
    description,
    images: [SOCIAL_IMAGE.url],
  };
}

/**
 * Metadata for a standing page in one call — title, description, canonical
 * and both social cards — so no route forgets one of them.
 */
export function pageMeta({
  path,
  title,
  description,
}: {
  path: string;
  title: string;
  description: string;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: openGraphFor({ path, title, description }),
    twitter: twitterFor({ title, description }),
  };
}
