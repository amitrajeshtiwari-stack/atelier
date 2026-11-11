import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getPostBySlug, getPublishedPosts } from "@/lib/posts";
import { renderMarkdown } from "@/lib/markdown";
import { formatDate } from "@/lib/utils";
import { AmbientStage } from "@/components/three/ambient-stage";
import { ReadingProgress } from "@/components/post/reading-progress";
import { TableOfContents } from "@/components/post/table-of-contents";
import { ReactionsBar } from "@/components/post/reactions-bar";
import { CommentsRoom } from "@/components/post/comments-room";
import { Reveal } from "@/components/motion/reveal";
import { PostCard } from "@/components/journal/post-card";

export const revalidate = 60;

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getPostBySlug(slug);
  if (!entry) return {};
  const { post } = entry;
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      images: post.cover_image_url ? [{ url: post.cover_image_url }] : undefined,
    },
  };
}

export default async function PostPage({ params }: Params) {
  const { slug } = await params;
  const entry = await getPostBySlug(slug);
  if (!entry) notFound();

  const { post, comments } = entry;
  const { html, headings } = renderMarkdown(post.content_md);

  // Two neighbors for the "keep walking" strip: the next entry when there
  // is one, otherwise the previous (the oldest post has no "next"), plus
  // the newest post as the second door — never the current post itself.
  const all = await getPublishedPosts();
  const index = all.findIndex((p) => p.slug === post.slug);
  const next = all[index + 1] ?? all[index - 1];
  const first = all[0];
  const neighbors = [
    ...(next ? [next] : []),
    ...(first && first.slug !== post.slug && first.slug !== next?.slug ? [first] : []),
  ].slice(0, 2);

  return (
    <article className="grain relative overflow-hidden">
      <ReadingProgress />
      <AmbientStage />

      {/* ── Cover + masthead ──────────────────────────────────────────── */}
      <header className="relative z-10 mx-auto max-w-6xl px-6 pt-28 md:px-10 md:pt-36">
        <Reveal>
          <Link
            href="/journal"
            className="inline-flex min-h-11 items-center gap-2 text-sm text-ink-faint transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-4" strokeWidth={1.5} />
            Journal
          </Link>
          <p className="eyebrow mt-8">{post.category}</p>
          <h1 className="mt-4 max-w-[20ch] text-display">{post.title}</h1>
          {post.subtitle ? (
            <p className="mt-6 max-w-[52ch] text-xl leading-relaxed text-ink-soft">
              {post.subtitle}
            </p>
          ) : null}
          <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-ink-faint">
            <span className="text-ink">{post.author_name}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={post.published_at ?? undefined}>
              {formatDate(post.published_at)}
            </time>
            <span aria-hidden="true">·</span>
            <span>{post.reading_time} min read</span>
            {post.tags.length > 0 ? (
              <>
                <span aria-hidden="true">·</span>
                <span>{post.tags.join(", ")}</span>
              </>
            ) : null}
          </div>
        </Reveal>
        {post.cover_image_url ? (
          <Reveal delay={0.1} className="mt-12">
            <div className="relative aspect-[16/7] overflow-hidden rounded-[var(--radius-card)] border border-line shadow-lift">
              <Image
                src={post.cover_image_url}
                alt=""
                fill
                priority
                sizes="(min-width: 1152px) 72rem, 100vw"
                className="object-cover"
              />
            </div>
          </Reveal>
        ) : null}
      </header>

      {/* ── Body + TOC rail ───────────────────────────────────────────── */}
      <div className="relative z-10 mx-auto mt-16 grid max-w-6xl gap-12 px-6 md:px-10 lg:grid-cols-[1fr_16rem]">
        <div className="min-w-0">
          <Reveal>
            <div
              className="prose-atelier max-w-[68ch] text-lg leading-[1.85] text-ink"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </Reveal>

          <Reveal className="mt-16">
            <ReactionsBar postId={post.id} />
          </Reveal>

          <CommentsRoom postId={post.id} initialComments={comments} />
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-28">
            <TableOfContents headings={headings} />
          </div>
        </aside>
      </div>

      {/* ── Keep walking ──────────────────────────────────────────────── */}
      {neighbors.length > 0 ? (
        <section className="relative z-10 mx-auto mt-28 max-w-6xl px-6 md:px-10">
          <p className="eyebrow">Keep walking</p>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {neighbors.map((n) => (
              <PostCard key={n.slug} post={n} />
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}
