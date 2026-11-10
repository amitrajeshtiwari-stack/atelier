"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Bookmark, Heart, Lightbulb } from "lucide-react";
import type { ReactionKind } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import { useRealtimeChannel } from "@/lib/use-realtime";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const KINDS: Array<{
  kind: ReactionKind;
  label: string;
  Icon: typeof Heart;
}> = [
  { kind: "like", label: "Like", Icon: Heart },
  { kind: "insight", label: "Insight", Icon: Lightbulb },
  { kind: "bookmark", label: "Save", Icon: Bookmark },
];

type Counts = Record<ReactionKind, number>;

/**
 * Reaction rail: optimistic local toggles, authoritative counts from
 * GET /api/reactions, and live bumps via a Supabase Realtime channel
 * scoped to this post. No session ⇒ a quiet invitation to sign in.
 */
export function ReactionsBar({ postId }: { postId: string }) {
  const [counts, setCounts] = useState<Counts>({ like: 0, insight: 0, bookmark: 0 });
  const [mine, setMine] = useState<Set<ReactionKind>>(new Set());
  const [sessioned, setSessioned] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const reduced = useReducedMotion();

  const load = useCallback(async () => {
    const res = await fetch(`/api/reactions?post_id=${postId}`, { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { counts: Counts; mine: ReactionKind[] };
    setCounts(data.counts);
    setMine(new Set(data.mine));
  }, [postId]);

  useEffect(() => {
    // Fetch through a microtask: the effect body only wires external
    // systems; state updates happen in async callbacks.
    queueMicrotask(() => void load());
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => {
      setSessioned(Boolean(data.session));
    });
  }, [load]);

  // Realtime: any change to this post's reactions ⇒ resync counts.
  const onChanges = useCallback(() => void load(), [load]);
  useRealtimeChannel({
    channelName: `reactions:${postId}`,
    subscribe: { event: "*", table: "reactions", filter: `post_id=eq.${postId}` },
    onChanges,
  });

  async function toggle(kind: ReactionKind) {
    if (!sessioned) {
      setHint("Sign in from the Studio to leave a reaction.");
      setTimeout(() => setHint(null), 3500);
      return;
    }

    const active = mine.has(kind);
    // Optimistic flip.
    setMine((prev) => {
      const next = new Set(prev);
      if (active) next.delete(kind);
      else next.add(kind);
      return next;
    });
    setCounts((prev) => ({ ...prev, [kind]: prev[kind] + (active ? -1 : 1) }));

    try {
      const res = await fetch("/api/reactions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ post_id: postId, kind }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // Roll back on failure.
      setMine((prev) => {
        const next = new Set(prev);
        if (active) next.add(kind);
        else next.delete(kind);
        return next;
      });
      setCounts((prev) => ({ ...prev, [kind]: prev[kind] + (active ? 1 : -1) }));
      setHint("Couldn't reach the atelier — try again.");
      setTimeout(() => setHint(null), 3500);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        {KINDS.map(({ kind, label, Icon }) => {
          const active = mine.has(kind);
          return (
            <button
              key={kind}
              type="button"
              onClick={() => void toggle(kind)}
              aria-pressed={active}
              className={cn(
                "group inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm transition-colors duration-300",
                active
                  ? "border-accent bg-accent-soft text-accent-strong"
                  : "border-line text-ink-soft hover:border-accent hover:text-ink"
              )}
            >
              <Icon
                className={cn(
                  "size-4 transition-transform duration-300 group-active:scale-90",
                  active && "fill-accent-strong/20"
                )}
                strokeWidth={1.5}
              />
              {label}
              <motion.span
                key={counts[kind]}
                initial={reduced ? false : { opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="tabular-nums"
              >
                {counts[kind]}
              </motion.span>
            </button>
          );
        })}
      </div>
      {hint ? (
        <p className="mt-3 text-sm text-ink-faint" role="status">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
