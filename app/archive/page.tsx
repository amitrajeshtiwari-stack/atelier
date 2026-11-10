import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedPosts } from "@/lib/posts";
import type { PostPublic } from "@/lib/schemas";
import { formatDate } from "@/lib/utils";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "Archive",
  description:
    "Every published entry, oldest truths first — the Atelier's complete index.",
};

export const revalidate = 300;

/** Group posts under "November 2026"-style month banners. */
function groupByMonth(posts: PostPublic[]): Array<{
  label: string;
  posts: PostPublic[];
}> {
  const groups = new Map<string, PostPublic[]>();
  for (const post of posts) {
    if (!post.published_at) continue;
    const d = new Date(post.published_at);
    const label = new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(d);
    const bucket = groups.get(label);
    if (bucket) bucket.push(post);
    else groups.set(label, [post]);
  }
  return [...groups.entries()].map(([label, list]) => ({ label, posts: list }));
}

const CATEGORY_PILL: Record<string, string> = {
  Design: "text-accent-strong",
  Engineering: "text-ink-soft",
  Culture: "text-ink-soft",
  Notes: "text-ink-faint",
};

export default async function ArchivePage() {
  const posts = await getPublishedPosts();
  const groups = groupByMonth(posts);

  return (
    <div className="mx-auto max-w-4xl px-6 pb-32 pt-20 md:px-10 md:pt-28">
      <SectionHeading
        eyebrow="The Archive"
        title="Every page, kept in order"
        lede="The complete index — no covers, no 3D, just the spine of the journal. For the patient and the returning."
      />

      <div className="mt-16">
        {groups.map((group, gi) => (
          <Reveal key={group.label} delay={Math.min(gi * 0.05, 0.15)}>
            <section className="mt-12 first:mt-0">
              <div className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
                <h2 className="font-display text-xl tracking-tight text-ink">
                  {group.label}
                </h2>
                <span className="text-xs text-ink-faint tabular-nums">
                  {group.posts.length}{" "}
                  {group.posts.length === 1 ? "entry" : "entries"}
                </span>
              </div>
              <ol>
                {group.posts.map((post) => (
                  <li
                    key={post.slug}
                    className="group border-b border-line/60 py-4"
                  >
                    <Link
                      href={`/journal/${post.slug}`}
                      className="flex min-h-11 flex-wrap items-baseline gap-x-4 gap-y-1 transition-colors duration-300"
                    >
                      <time
                        dateTime={post.published_at ?? undefined}
                        className="w-24 shrink-0 text-xs text-ink-faint tabular-nums"
                      >
                        {formatDate(post.published_at).replace(/,.*/, "")}
                      </time>
                      <span className="min-w-0 flex-1 font-display text-lg tracking-tight text-ink transition-colors duration-300 group-hover:text-accent-strong">
                        {post.title}
                      </span>
                      <span
                        className={`text-[0.625rem] font-medium uppercase tracking-[0.18em] ${CATEGORY_PILL[post.category] ?? ""}`}
                      >
                        {post.category}
                      </span>
                      <span className="hidden w-14 text-right text-xs text-ink-faint tabular-nums sm:block">
                        {post.reading_time} min
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
