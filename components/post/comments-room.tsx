"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MessagesSquare, Send } from "lucide-react";
import type { CommentPublic } from "@/lib/schemas";
import { createCommentSchema } from "@/lib/schemas";
import { cn, formatDate } from "@/lib/utils";
import { useRealtimeChannel } from "@/lib/use-realtime";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * The reading room: live comments for one post.
 *  - existing comments arrive server-rendered; new INSERTs (and DELETEs)
 *    trigger a throttled refetch so authors and avatars stay accurate;
 *  - presence shows how many people are in the room right now;
 *  - submitting is optimistic — your comment appears instantly, and
 *    reconciles with the server response.
 */
export function CommentsRoom({
  postId,
  initialComments,
}: {
  postId: string;
  initialComments: CommentPublic[];
}) {
  const [comments, setComments] = useState<CommentPublic[]>(initialComments);
  const [readers, setReaders] = useState(0);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reduced = useReducedMotion();
  const pendingLoad = useRef(false);

  const load = useCallback(async () => {
    if (pendingLoad.current) return;
    pendingLoad.current = true;
    try {
      const res = await fetch(`/api/comments?post_id=${postId}`, { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as { comments: CommentPublic[] };
        setComments(data.comments);
      }
    } finally {
      pendingLoad.current = false;
    }
  }, [postId]);

  // Realtime: refetch (throttled to one call) when rows change; track
  // presence so the room shows its occupancy.
  const onChanges = useCallback(() => void load(), [load]);
  const onPresence = useCallback(
    (metas: Record<string, unknown>[]) => setReaders(Math.max(0, metas.length)),
    []
  );

  useRealtimeChannel({
    channelName: `room:${postId}`,
    subscribe: { event: "*", table: "comments", filter: `post_id=eq.${postId}` },
    presence: { meta: { role: "reader" } },
    onChanges,
    onPresence,
  });

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => {
      setSignedIn(Boolean(data.session));
    });
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = createCommentSchema.safeParse({ body: draft });
    if (!parsed.success) {
      setError("Write something first — up to 2,000 characters.");
      return;
    }
    setSubmitting(true);
    setError(null);

    // Optimistic placeholder — replaced by the server's mapped row.
    const temp: CommentPublic = {
      id: `temp-${Date.now()}`,
      post_id: postId,
      author_id: "",
      parent_id: null,
      body: parsed.data.body,
      created_at: new Date().toISOString(),
      author_name: "You",
      author_avatar: null,
    };
    setComments((prev) => [...prev, temp]);
    setDraft("");

    try {
      const res = await fetch(`/api/comments?post_id=${postId}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (res.status === 401) {
        setComments((prev) => prev.filter((c) => c.id !== temp.id));
        setError("Sign in from the Studio to join the conversation.");
        return;
      }
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { comment: CommentPublic };
      setComments((prev) =>
        prev.map((c) => (c.id === temp.id ? data.comment : c))
      );
    } catch {
      setComments((prev) => prev.filter((c) => c.id !== temp.id));
      setError("Couldn't post — the room may be offline. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section aria-label="Comments" className="mt-20">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-t border-line pt-10">
        <h2 className="flex items-center gap-3 font-display text-2xl tracking-tight text-ink">
          <MessagesSquare className="size-5 text-accent" strokeWidth={1.5} />
          The reading room
        </h2>
        <p className="flex items-center gap-2 text-xs text-ink-faint">
          <span className="size-1.5 animate-pulse rounded-full bg-accent" />
          {readers === 0
            ? "be the first in the room"
            : readers === 1
              ? "1 person reading now"
              : `${readers} people reading now`}
        </p>
      </div>

      <ol className="mt-8 space-y-6">
        {comments.map((comment) => (
          <motion.li
            key={comment.id}
            initial={reduced || comment.id.startsWith("temp-") ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-[var(--radius-card)] border border-line bg-elevated p-5"
          >
            <div className="flex items-baseline justify-between gap-4">
              <p className="text-sm font-medium text-ink">
                {comment.author_name}
              </p>
              <time
                dateTime={comment.created_at}
                className="text-xs text-ink-faint"
              >
                {formatDate(comment.created_at)}
              </time>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-[0.9375rem] leading-relaxed text-ink-soft">
              {comment.body}
            </p>
          </motion.li>
        ))}
        {comments.length === 0 ? (
          <li className="py-8 text-center text-sm text-ink-faint">
            No letters yet — the room is listening.
          </li>
        ) : null}
      </ol>

      <form onSubmit={submit} className="mt-8">
        <label htmlFor="comment-body" className="eyebrow">
          Leave a letter
        </label>
        <textarea
          id="comment-body"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="What did this stir up?"
          className="mt-3 w-full resize-y rounded-[var(--radius-card)] border border-line bg-elevated px-4 py-3 text-[0.9375rem] leading-relaxed text-ink placeholder:text-ink-faint/60 focus:border-accent focus:outline-none"
        />
        <div className="mt-3 flex items-center justify-between gap-4">
          <p aria-live="polite" className="text-sm text-ink-faint">
            {error ?? (signedIn ? "" : "Signing in is required to post.")}
          </p>
          <button
            type="submit"
            disabled={submitting || draft.trim().length === 0}
            className={cn(
              "inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-6 text-sm text-paper",
              "transition-colors duration-300 hover:bg-accent-strong",
              "disabled:cursor-not-allowed disabled:opacity-40"
            )}
          >
            {submitting ? "Sending…" : "Send"}
            <Send className="size-3.5" strokeWidth={1.5} />
          </button>
        </div>
      </form>
    </section>
  );
}
