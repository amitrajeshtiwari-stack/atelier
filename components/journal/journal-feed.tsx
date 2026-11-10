"use client";

import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Sparkles } from "lucide-react";
import type { PostPublic } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import { useRealtimeChannel, type PgChange } from "@/lib/use-realtime";
import { Reveal } from "@/components/motion/reveal";
import { PostCard } from "./post-card";

const CATEGORIES = ["All", "Design", "Engineering", "Culture", "Notes"] as const;
type Category = (typeof CATEGORIES)[number];

/**
 * The Journal surface: featured tilt card + filterable grid. Subscribes to
 * `posts` changes via Supabase Realtime — a fresh entry appears as a "new
 * entry" pill that, when opened, refetches and prepends the post with a
 * settle-in animation. The journal stays a room, not a stock ticker.
 */
export function JournalFeed({ initialPosts }: { initialPosts: PostPublic[] }) {
  const [posts, setPosts] = useState<PostPublic[]>(initialPosts);
  const [pendingSlugs, setPendingSlugs] = useState<string[]>([]);
  const [category, setCategory] = useState<Category>("All");
  const reduced = useReducedMotion();

  // Stable config for the channel hook.
  const onChanges = useCallback(
    (changes: PgChange[]) => {
      const slugs = changes
        .filter((change) => change.eventType === "INSERT")
        .map((change) => change.new as { slug?: string; status?: string } | null)
        .filter((row) => row?.slug && row.status === "published")
        .map((row) => row!.slug as string);
      if (slugs.length === 0) return;
      setPendingSlugs((prev) => {
        const known = new Set([...prev, ...posts.map((p) => p.slug)]);
        return [...prev, ...slugs.filter((s) => !known.has(s))];
      });
    },
    [posts]
  );

  const status = useRealtimeChannel({
    channelName: "journal",
    subscribe: { event: "*", table: "posts" },
    onChanges,
  });

  const refresh = useCallback(async () => {
    const res = await fetch("/api/posts", { cache: "no-store" });
    if (!res.ok) return;
    const { posts: fresh } = (await res.json()) as { posts: PostPublic[] };
    setPosts(fresh);
    setPendingSlugs([]);
  }, []);

  const filtered = useMemo(
    () => (category === "All" ? posts : posts.filter((p) => p.category === category)),
    [posts, category]
  );
  const [featured, ...rest] = filtered;

  const live =
    status === "live" ? "Live" : status === "connecting" ? "Connecting…" : status === "error" ? "Offline" : "Demo";

  return (
    <div>
      {/* ── Live indicator + new-entry pill ───────────────────────────── */}
      <div className="flex min-h-12 flex-wrap items-center justify-between gap-4">
        <p className="flex items-center gap-2 text-xs text-ink-faint">
          <span
            className={cn(
              "size-1.5 rounded-full",
              status === "live" && "animate-pulse bg-accent",
              status !== "live" && "bg-ink-faint/40"
            )}
          />
          {live}
        </p>

        <AnimatePresence>
          {pendingSlugs.length > 0 ? (
            <motion.button
              type="button"
              onClick={refresh}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              whileHover={reduced ? undefined : { y: -2 }}
              className="group inline-flex min-h-10 items-center gap-2.5 rounded-full border border-accent/60 bg-accent-soft px-5 text-sm text-accent-strong shadow-soft"
            >
              <Sparkles className="size-4" strokeWidth={1.5} />
              {pendingSlugs.length === 1
                ? "1 new entry"
                : `${pendingSlugs.length} new entries`}
              <ArrowUpRight
                className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                strokeWidth={1.5}
              />
            </motion.button>
          ) : null}
        </AnimatePresence>
      </div>

      {/* ── Category filter ───────────────────────────────────────────── */}
      <div className="mt-8 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            aria-pressed={category === c}
            className={cn(
              "min-h-9 rounded-full border px-5 text-sm transition-colors duration-300",
              category === c
                ? "border-ink bg-ink text-paper"
                : "border-line text-ink-soft hover:border-accent hover:text-ink"
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {/* ── Featured card ─────────────────────────────────────────────── */}
      {featured ? (
        <Reveal className="mt-10">
          <PostCard post={featured} featured priority />
        </Reveal>
      ) : null}

      {/* ── Grid ──────────────────────────────────────────────────────── */}
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {rest.map((post, i) => (
          <Reveal key={post.slug} delay={Math.min(i * 0.06, 0.3)} className="h-full">
            <PostCard post={post} />
          </Reveal>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-16 text-center text-ink-faint">
          Nothing filed under {category} yet.
        </p>
      ) : null}
    </div>
  );
}
