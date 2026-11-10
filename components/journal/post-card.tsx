"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { PostPublic } from "@/lib/schemas";
import { cn, formatDate } from "@/lib/utils";
import { TiltCard } from "@/components/ui/tilt-card";

const CATEGORY_TINTS: Record<string, string> = {
  Design: "bg-accent-soft text-accent-strong",
  Engineering: "bg-ink/5 text-ink-soft dark:bg-ink/10",
  Culture: "bg-ink/5 text-ink-soft dark:bg-ink/10",
  Notes: "bg-ink/5 text-ink-soft dark:bg-ink/10",
};

/**
 * Journal card — cover, category, title, excerpt, byline. The featured
 * variant spans wide and tilts deeper; the grid variant is restrained.
 */
export function PostCard({
  post,
  featured = false,
  priority = false,
}: {
  post: PostPublic;
  featured?: boolean;
  priority?: boolean;
}) {
  return (
    <TiltCard maxTilt={featured ? 3.5 : 2.5} className="h-full">
      <Link
        href={`/journal/${post.slug}`}
        className="group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-elevated shadow-soft transition-colors duration-300 hover:border-accent/50"
      >
        <div
          className={cn(
            "relative overflow-hidden",
            featured ? "aspect-[16/8]" : "aspect-[16/9]"
          )}
        >
          {post.cover_image_url ? (
            <Image
              src={post.cover_image_url}
              alt=""
              fill
              sizes={featured ? "(min-width: 1024px) 66vw, 100vw" : "(min-width: 768px) 33vw, 100vw"}
              priority={priority}
              className="object-cover transition-transform duration-700 ease-[var(--ease-editorial)] group-hover:scale-[1.03]"
            />
          ) : (
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{ background: "linear-gradient(135deg, var(--canvas-top), var(--canvas-bottom))" }}
            />
          )}
          <span
            className={cn(
              "absolute left-4 top-4 rounded-full px-3 py-1 text-[0.625rem] font-medium uppercase tracking-[0.18em]",
              CATEGORY_TINTS[post.category] ?? CATEGORY_TINTS.Notes
            )}
          >
            {post.category}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-6 md:p-7">
          <div className="flex items-baseline justify-between gap-4">
            <h3
              className={cn(
                "font-display tracking-tight text-ink",
                featured ? "text-2xl md:text-3xl" : "text-xl"
              )}
            >
              {post.title}
            </h3>
            <ArrowUpRight
              className="size-4 shrink-0 text-ink-faint transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
              strokeWidth={1.5}
            />
          </div>

          {post.subtitle ? (
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              {post.subtitle}
            </p>
          ) : null}

          <div className="mt-auto flex items-center gap-2 pt-6 text-xs text-ink-faint">
            <span>{post.author_name}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={post.published_at ?? undefined}>
              {formatDate(post.published_at)}
            </time>
            <span aria-hidden="true">·</span>
            <span>{post.reading_time} min</span>
          </div>
        </div>
      </Link>
    </TiltCard>
  );
}
