"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { Magnetic } from "@/components/ui/magnetic";

const STORAGE_KEY = "atelier:newsletter";

/**
 * Slide-in invitation, shown once the reader is halfway through any page
 * — once per browser, forever after dismissible. Never appears on the
 * Studio (writers already belong), and honors reduced motion.
 */
export function NewsletterModal() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.pathname.startsWith("/studio")) return;
    if (window.localStorage.getItem(STORAGE_KEY)) return;

    let armed = false;
    const timer = setTimeout(() => { armed = true; }, 8000); // never ambush a landing visitor

    function onScroll() {
      if (!armed) return;
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      const ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
      if (ratio >= 0.5) {
        setOpen(true);
        window.removeEventListener("scroll", onScroll);
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Move focus into the dialog when it opens.
  useEffect(() => {
    if (open) dialogRef.current?.focus();
  }, [open]);

  const dismiss = useCallback(() => {
    setOpen(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    } catch {
      /* private browsing — session-only then */
    }
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.status === 400) {
        setState("error");
        setMessage("That address doesn't look right.");
        return;
      }
      if (!res.ok) throw new Error();
      setState("done");
      setMessage("Filed. The next issue finds you.");
      setTimeout(dismiss, 2200);
    } catch {
      setState("error");
      setMessage("The press is offline — try again shortly.");
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-x-4 bottom-4 z-[70] sm:left-auto sm:right-6 sm:w-[26rem]"
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 48, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: 32, scale: 0.98 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          role="dialog"
          aria-modal="false"
          aria-label="Newsletter invitation"
        >
          <div
            ref={dialogRef}
            tabIndex={-1}
            className="grain relative overflow-hidden rounded-[var(--radius-card)] border border-line bg-elevated p-6 shadow-lift outline-none"
          >
            <button
              type="button"
              onClick={dismiss}
              aria-label="Dismiss newsletter invitation"
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-accent-soft hover:text-ink"
            >
              <X className="size-4" strokeWidth={1.5} />
            </button>

            <p className="eyebrow">The Letterpress</p>
            <h2 className="mt-3 font-display text-xl tracking-tight text-ink">
              One letter a month, nothing more.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              New essays, margin notes, and what the atelier is reading —
              no growth hacks, ever.
            </p>

            {state === "done" ? (
              <p className="mt-5 text-sm font-medium text-accent-strong" role="status">
                {message}
              </p>
            ) : (
              <form onSubmit={submit} className="mt-5 flex gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  aria-label="Email address"
                  className="min-h-11 min-w-0 flex-1 rounded-full border border-line bg-paper px-4 text-sm text-ink placeholder:text-ink-faint/60 focus:border-accent focus:outline-none"
                />
                <Magnetic>
                  <button
                    type="submit"
                    disabled={state === "sending"}
                    className="inline-flex h-11 items-center rounded-full bg-ink px-5 text-sm text-paper transition-colors duration-300 hover:bg-accent-strong disabled:opacity-50"
                  >
                    {state === "sending" ? "…" : "Subscribe"}
                  </button>
                </Magnetic>
              </form>
            )}
            {state === "error" ? (
              <p className="mt-2 text-sm text-ink-faint" role="alert">
                {message}
              </p>
            ) : null}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
