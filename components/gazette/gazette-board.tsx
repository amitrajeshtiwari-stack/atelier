"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BellRing } from "lucide-react";
import type { NoticeRow } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import { useRealtimeChannel, type PgChange } from "@/lib/use-realtime";
import { NoticePlateRow } from "./notice-plate-row";

/**
 * The Gazette board: one dense chronological index, newest first.
 * Subscribes to `notices` via Supabase Realtime — a freshly filed
 * notice appears as an alert pill; opening it refetches and prepends
 * the row. Deliberately filterless — the plate is read top to bottom.
 */
export function GazetteBoard({ initialNotices }: { initialNotices: NoticeRow[] }) {
  const [notices, setNotices] = useState<NoticeRow[]>(initialNotices);
  const [pendingCount, setPendingCount] = useState(0);
  const reduced = useReducedMotion();

  const onChanges = useCallback((changes: PgChange[]) => {
    const inserts = changes.filter(
      (change) =>
        change.eventType === "INSERT" &&
        (change.new as { status?: string } | null)?.status !== "archived"
    );
    if (inserts.length === 0) return;
    setPendingCount((count) => count + inserts.length);
  }, []);

  const status = useRealtimeChannel({
    channelName: "gazette",
    subscribe: { event: "*", table: "notices" },
    onChanges,
  });

  const refresh = useCallback(async () => {
    const res = await fetch("/api/notices", { cache: "no-store" });
    if (!res.ok) return;
    const { notices: fresh } = (await res.json()) as { notices: NoticeRow[] };
    setNotices(fresh);
    setPendingCount(0);
  }, []);

  const live =
    status === "live"
      ? "Live"
      : status === "connecting"
        ? "Connecting…"
        : status === "error"
          ? "Offline"
          : "Demo";

  return (
    <div>
      {/* ── Live indicator + new-notice alert pill ────────────────────── */}
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
          {pendingCount > 0 ? (
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
              <BellRing className="size-4" strokeWidth={1.5} />
              {pendingCount === 1
                ? "1 new notice"
                : `${pendingCount} new notices`}
            </motion.button>
          ) : null}
        </AnimatePresence>
      </div>

      {/* ── The plate ─────────────────────────────────────────────────── */}
      <div className="mt-10 border-b border-line">
        {notices.map((notice, i) => (
          <motion.div
            key={notice.slug}
            initial={reduced || i < initialNotices.length ? { opacity: 1 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: reduced || i >= initialNotices.length ? 0 : Math.min(i * 0.05, 0.25) }}
          >
            <NoticePlateRow notice={notice} />
          </motion.div>
        ))}
      </div>

      {notices.length === 0 ? (
        <p className="mt-16 text-center text-ink-faint">
          No notices filed yet — the next edition is on its way.
        </p>
      ) : (
        <p className="mt-6 font-mono text-[0.625rem] tracking-[0.18em] text-ink-faint uppercase">
          End of current plate · {notices.length} notices on record
        </p>
      )}
    </div>
  );
}
