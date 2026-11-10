"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/** Max one flush per channel per this interval — realtime feels like a
 * room, not a stock ticker (design-system rule, not performance hack). */
const THROTTLE_MS = 250;

export type RealtimeStatus = "disabled" | "connecting" | "live" | "error";

export type PgChange = RealtimePostgresChangesPayload<Record<string, unknown>>;

type ChannelConfig = {
  /** Unique per surface, e.g. `posts:journal` or `room:<slug>`. */
  channelName: string;
  /** Postgres changes subscription; omit for presence-only channels. */
  subscribe?: {
    event: "INSERT" | "UPDATE" | "DELETE" | "*";
    table: string;
    filter?: string;
  };
  /** Track presence with this stable key + public metadata. */
  presence?: {
    meta: Record<string, unknown>;
  };
  onChanges?: (changes: PgChange[]) => void;
  onPresence?: (metas: Record<string, unknown>[]) => void;
};

/**
 * One Supabase realtime channel per page surface:
 *  - postgres_changes via `subscribe`, flushed to `onChanges` at most
 *    once per 250ms (batched payloads);
 *  - presence via `presence`, with `onPresence` fired on sync;
 *  - teardown is automatic (unmount ⇒ unsubscribe + untrack);
 *  - reconnection is managed internally by supabase-js v2.
 *
 * Demo mode (no credentials) ⇒ status "disabled", callbacks never fire.
 */
export function useRealtimeChannel({
  channelName,
  subscribe,
  presence,
  onChanges,
  onPresence,
}: ChannelConfig): RealtimeStatus {
  // Demo mode (no credentials) resolves immediately without touching state
  // from inside the effect.
  const [status, setStatus] = useState<RealtimeStatus>(() =>
    process.env.NEXT_PUBLIC_SUPABASE_URL ? "connecting" : "disabled"
  );

  const changeBuffer = useRef<PgChange[]>([]);
  const latestChanges = useRef(onChanges);

  useEffect(() => {
    latestChanges.current = onChanges;
  });

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return; // demo mode — status already "disabled"

    const channel = supabase.channel(channelName);
    let flushTimer: ReturnType<typeof setInterval> | null = null;

    if (subscribe) {
      const event = subscribe.event;
      channel.on(
        "postgres_changes",
        { event, schema: "public", table: subscribe.table, ...(subscribe.filter ? { filter: subscribe.filter } : {}) },
        (payload) => {
          changeBuffer.current.push(payload as PgChange);
        }
      );
      // The throttle loop exists only when there are change subscribers.
      flushTimer = setInterval(() => {
        if (changeBuffer.current.length > 0) {
          const batch = changeBuffer.current;
          changeBuffer.current = [];
          latestChanges.current?.(batch);
        }
      }, THROTTLE_MS);
    }

    if (presence) {
      channel.on("presence", { event: "sync" }, () => {
        const metas = (channel.presenceState() as Record<string, unknown[]>)
          ? Object.values(channel.presenceState() as Record<string, unknown[]>).flat()
          : [];
        onPresence?.(metas as Record<string, unknown>[]);
      });
    }

    channel.subscribe((state) => {
      if (state === "SUBSCRIBED") {
        setStatus("live");
        if (presence) void channel.track(presence.meta);
      } else if (state === "CHANNEL_ERROR" || state === "TIMED_OUT") {
        setStatus("error");
      } else {
        setStatus("connecting");
      }
    });

    return () => {
      if (flushTimer) clearInterval(flushTimer);
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- call sites pass stable config; presence tracking happens once per subscribe
  }, [channelName, subscribe?.table, subscribe?.event, subscribe?.filter]);

  return status;
}

/** Wraps a handler so rapid realtime bursts collapse into one call. */
export function useThrottledCallback<A extends unknown[]>(
  callback: (...args: A) => void,
  intervalMs = THROTTLE_MS
): (...args: A) => void {
  const pending = useRef<A | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(callback);

  useEffect(() => {
    latest.current = callback;
  });

  return useCallback(
    (...args: A) => {
      pending.current = args;
      if (timer.current) return;
      timer.current = setTimeout(() => {
        timer.current = null;
        const argsNow = pending.current;
        pending.current = null;
        if (argsNow) latest.current(...argsNow);
      }, intervalMs);
    },
    [intervalMs]
  );
}

export function useRealtimeAvailable(): boolean {
  return useMemo(() => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL), []);
}
