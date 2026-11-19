import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { GUIDES, getGuide, relatedGuides } from "@/lib/guides";
import { Reveal } from "@/components/motion/reveal";
import { SITE_NAME, SITE_URL, openGraphFor, twitterFor } from "@/lib/site";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return GUIDES.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return { title: "Guide not found", robots: { index: false } };

  const path = `/guides/${guide.slug}`;
  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical: path },
    openGraph: openGraphFor({
      path,
      title: guide.title,
      description: guide.description,
      type: "article",
    }),
    twitter: twitterFor({ title: guide.title, description: guide.description }),
  };
}

export default async function GuidePage({ params }: Params) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  const url = `${SITE_URL}/guides/${guide.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    articleSection: guide.eyebrow,
    inLanguage: "en-IN",
    mainEntityOfPage: url,
    url,
    author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  };

  return (
    <article className="mx-auto max-w-6xl px-6 pb-32 pt-20 md:px-10 md:pt-28">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Reveal>
        <Link
          href="/guides"
          className="font-mono text-[0.625rem] tracking-[0.14em] text-ink-faint uppercase transition-colors hover:text-ink"
        >
          ← Reference desk
        </Link>
        <p className="eyebrow mt-8">{guide.eyebrow}</p>
        <h1 className="mt-4 max-w-[26ch] text-4xl leading-[1.05] tracking-tight text-ink md:text-5xl">
          {guide.title}
        </h1>
        <p className="mt-6 max-w-[58ch] text-lg leading-relaxed text-ink-soft">
          {guide.lede}
        </p>
        <p className="mt-8 font-mono text-[0.625rem] tracking-[0.18em] text-ink-faint uppercase tabular-nums">
          {guide.readingMinutes} min read
        </p>
      </Reveal>

      <div className="legal-prose mt-14 max-w-[68ch] border-t border-line pt-12">
        {guide.sections.map((section) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            {section.paragraphs.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
            {section.list ? (
              <ul>
                {section.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
            {section.note ? (
              <div className="legal-note">
                <p>{section.note}</p>
              </div>
            ) : null}
          </section>
        ))}
      </div>

      <Reveal className="mt-20 max-w-[68ch] border-t border-line pt-8">
        <p className="text-sm leading-relaxed text-ink-soft">
          The {SITE_NAME} plate is filed daily from official announcements. If a
          notice on it contradicts a guide here, trust the notice — then{" "}
          <Link
            href="/contact"
            className="text-ink underline decoration-line underline-offset-4"
          >
            tell us
          </Link>
          .
        </p>
        <Link
          href="/gazette"
          className="group mt-8 inline-flex min-h-11 items-center gap-3 rounded-full bg-ink px-7 text-sm text-paper transition-colors duration-300 hover:bg-accent-strong"
        >
          Read today&rsquo;s plate
          <ArrowUpRight
            className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            strokeWidth={1.5}
          />
        </Link>
      </Reveal>

      <section className="mt-24">
        <Reveal>
          <p className="eyebrow">Keep reading</p>
        </Reveal>
        <div className="mt-6 border-t border-line">
          {relatedGuides(guide.slug).map((other) => (
            <Link
              key={other.slug}
              href={`/guides/${other.slug}`}
              className="group flex flex-col gap-2 border-b border-line py-6 transition-colors duration-300 hover:bg-accent-soft/40 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8"
            >
              <span className="max-w-[52ch]">
                <span className="block font-display text-lg text-ink">
                  {other.title}
                </span>
                <span className="mt-1 block text-sm text-ink-soft">
                  {other.description}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-3 font-mono text-[0.625rem] tracking-[0.12em] text-ink-faint uppercase">
                {other.readingMinutes} min
                <ArrowUpRight
                  className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  strokeWidth={1.5}
                />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </article>
  );
}
