"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText, LoaderCircle, LogOut, Plus, Save, Send, UploadCloud,
} from "lucide-react";
import type { UpsertPostInput } from "@/lib/schemas";
import { readingTimeOf, slugify } from "@/lib/schemas";
import { cn, formatDate } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/supabase/database.types";

type StudioPost = Database["public"]["Tables"]["posts"]["Row"];

type DraftState = UpsertPostInput & { id?: string };

const BLANK: DraftState = {
  slug: "",
  title: "",
  subtitle: null,
  excerpt: "",
  content_md: "",
  cover_image_url: null,
  category: "Notes",
  tags: [],
  status: "draft",
  reading_time: 1,
};

const CATEGORIES = ["Design", "Engineering", "Culture", "Notes"] as const;

/**
 * The Studio: auth gate, post list, and the editor. All writes go through
 * the Studio API routes; RLS is the real gate — the UI just shows the door.
 * Autosave keeps drafts honest 2.5s after the last keystroke.
 */
export function StudioApp() {
  const router = useRouter();
  const [authState, setAuthState] = useState<"checking" | "signed-out" | "signed-in">(() =>
    createSupabaseBrowserClient() ? "checking" : "signed-out"
  );
  const [posts, setPosts] = useState<StudioPost[]>([]);
  const [draft, setDraft] = useState<DraftState>(BLANK);
  const [saving, setSaving] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [signingIn, setSigningIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => {
      setAuthState(data.session ? "signed-in" : "signed-out");
    });
  }, [supabase]);

  const loadPosts = useCallback(async () => {
    const res = await fetch("/api/studio/posts", { cache: "no-store" });
    if (res.status === 401) {
      setAuthState("signed-out");
      return;
    }
    if (!res.ok) return;
    const data = (await res.json()) as { posts: StudioPost[] };
    setPosts(data.posts);
  }, []);

  useEffect(() => {
    if (authState !== "signed-in") return;
    queueMicrotask(() => void loadPosts());
  }, [authState, loadPosts]);

  // ── Autosave ─────────────────────────────────────────────────────────
  const draftRef = useRef<DraftState>(draft);
  const persistRef = useRef<() => Promise<boolean>>(async () => false);
  const dirtyRef = useRef(false);

  const persist = useCallback(
    async (d: DraftState): Promise<boolean> => {
      setSaving("saving");
      try {
        const res = d.id
          ? await fetch(`/api/studio/posts?id=${d.id}`, {
              method: "PUT",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(d),
            })
          : await fetch("/api/studio/posts", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(d),
            });
        if (!res.ok) {
          setSaving("error");
          return false;
        }
        const data = (await res.json()) as { post: StudioPost };
        if (!d.id) setDraft((prev) => ({ ...prev, id: data.post.id }));
        setSaving("saved");
        void loadPosts();
        return true;
      } catch {
        setSaving("error");
        return false;
      }
    },
    [loadPosts]
  );

  useEffect(() => {
    draftRef.current = draft;
    persistRef.current = async () => {
      if (!dirtyRef.current) return false;
      dirtyRef.current = false;
      return persist(draftRef.current);
    };
  });

  function update(patch: Partial<DraftState>) {
    dirtyRef.current = true;
    setDraft((prev) => {
      const next = { ...prev, ...patch };
      // Slug and reading time stay derived unless overridden by hand.
      if (patch.title !== undefined && prev.slug === slugify(prev.title)) {
        next.slug = slugify(patch.title);
      }
      if (patch.content_md !== undefined) {
        next.reading_time = readingTimeOf(patch.content_md);
      }
      return next;
    });
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void persistRef.current();
    }, 2500);
  }

  async function saveNow() {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    dirtyRef.current = true;
    await persistRef.current();
  }

  async function publishNow() {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    dirtyRef.current = false; // the explicit call below owns this save
    const target: DraftState = { ...draft, status: "published" };
    if (!target.reading_time) target.reading_time = readingTimeOf(target.content_md);
    await persist(target);
  }

  async function unpublishNow() {
    dirtyRef.current = false;
    setDraft((prev) => ({ ...prev, status: "draft" }));
    await fetch(`/api/studio/posts?id=${draft.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "draft" }),
    });
    void loadPosts();
  }

  async function uploadCover(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !supabase) return;
    setUploadingCover(true);
    try {
      const path = `covers/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error } = await supabase.storage
        .from("covers")
        .upload(path, file, { upsert: false, cacheControl: "3600" });
      if (error) throw error;
      const { data } = supabase.storage.from("covers").getPublicUrl(path);
      update({ cover_image_url: data.publicUrl });
    } catch {
      setSaving("error");
    } finally {
      setUploadingCover(false);
    }
  }

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    setSigningIn(true);
    setLoginError(null);
    const { error } = await supabase!.auth.signInWithPassword({ email, password });
    if (error) {
      setLoginError("That key doesn't fit — check the email and password.");
    } else {
      setAuthState("signed-in");
      router.refresh();
    }
    setSigningIn(false);
  }

  async function signOut() {
    await supabase!.auth.signOut();
    setDraft(BLANK);
    setPosts([]);
    setAuthState("signed-out");
    router.refresh();
  }

  // ── Auth gate ────────────────────────────────────────────────────────
  if (authState === "checking") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoaderCircle className="size-5 animate-spin text-ink-faint" strokeWidth={1.5} />
      </div>
    );
  }

  if (authState === "signed-out" || !supabase) {
    return (
      <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-6">
        <p className="eyebrow">The Studio</p>
        <h1 className="mt-4 font-display text-4xl tracking-tight text-ink">
          Where the entries are written
        </h1>
        <form onSubmit={signIn} className="mt-10 space-y-4">
          <div>
            <label htmlFor="email" className="eyebrow">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              defaultValue="editor@atelier.press"
              className="mt-2 min-h-11 w-full rounded-[var(--radius-card)] border border-line bg-elevated px-4 text-sm text-ink focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="password" className="eyebrow">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="mt-2 min-h-11 w-full rounded-[var(--radius-card)] border border-line bg-elevated px-4 text-sm text-ink focus:border-accent focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={signingIn}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-ink text-sm text-paper transition-colors duration-300 hover:bg-accent-strong disabled:opacity-50"
          >
            {signingIn ? <LoaderCircle className="size-4 animate-spin" strokeWidth={1.5} /> : null}
            Unlock the desk
          </button>
          {loginError ? (
            <p className="text-sm text-ink-faint" role="alert">{loginError}</p>
          ) : null}
          <p className="text-xs leading-relaxed text-ink-faint">
            Demo credentials — editor@atelier.press / atelier-demo-2026
          </p>
        </form>
        <Link href="/" className="mt-10 text-sm text-ink-faint hover:text-ink">
          ← Back to the journal
        </Link>
      </div>
    );
  }

  // ── Desk ─────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-6xl px-6 pb-32 pt-20 md:px-10 md:pt-24">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <p className="eyebrow">The Studio</p>
          <h1 className="mt-3 font-display text-3xl tracking-tight text-ink">
            Writing desk
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setDraft({ ...BLANK })}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-5 text-sm text-ink-soft transition-colors hover:border-accent hover:text-ink"
          >
            <Plus className="size-4" strokeWidth={1.5} />
            New entry
          </button>
          <button
            type="button"
            onClick={signOut}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-5 text-sm text-ink-faint transition-colors hover:text-ink"
          >
            <LogOut className="size-4" strokeWidth={1.5} />
            Sign out
          </button>
        </div>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[16rem_1fr]">
        {/* ── Post list ───────────────────────────────────────────────── */}
        <aside>
          <p className="eyebrow text-[0.5625rem]">Filed entries</p>
          <ul className="mt-4 space-y-1.5">
            {posts.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    setDraft({
                      id: p.id,
                      slug: p.slug,
                      title: p.title,
                      subtitle: p.subtitle,
                      excerpt: p.excerpt,
                      content_md: p.content_md,
                      cover_image_url: p.cover_image_url,
                      category: p.category,
                      tags: p.tags,
                      status: p.status,
                      reading_time: p.reading_time,
                    });
                    dirtyRef.current = false;
                    setSaving("idle");
                  }}
                  className={cn(
                    "block w-full rounded-[var(--radius-card)] border px-4 py-3 text-left transition-colors duration-200",
                    draft.id === p.id
                      ? "border-accent bg-accent-soft"
                      : "border-line bg-elevated hover:border-accent/50"
                  )}
                >
                  <span className="block truncate font-display text-sm text-ink">
                    {p.title || "(untitled)"}
                  </span>
                  <span className="mt-1 flex items-center gap-2 text-[0.625rem] uppercase tracking-[0.16em] text-ink-faint">
                    {p.status === "published" ? (
                      <span className="text-accent-strong">Published</span>
                    ) : (
                      <span>Draft</span>
                    )}
                    <span>{formatDate(p.published_at ?? p.updated_at)}</span>
                  </span>
                </button>
              </li>
            ))}
            {posts.length === 0 ? (
              <li className="rounded-[var(--radius-card)] border border-dashed border-line px-4 py-6 text-center text-xs text-ink-faint">
                The drawer is empty.
              </li>
            ) : null}
          </ul>
        </aside>

        {/* ── Editor ──────────────────────────────────────────────────── */}
        <section className="min-w-0">
          <div className="rounded-[var(--radius-card)] border border-line bg-elevated p-6 shadow-soft md:p-8">
            <label className="eyebrow" htmlFor="s-title">Title</label>
            <input
              id="s-title"
              value={draft.title}
              onChange={(e) => update({ title: e.target.value })}
              placeholder="What did you learn?"
              className="mt-2 w-full bg-transparent font-display text-2xl tracking-tight text-ink placeholder:text-ink-faint/50 focus:outline-none"
            />

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="eyebrow" htmlFor="s-slug">Slug</label>
                <input
                  id="s-slug"
                  value={draft.slug}
                  onChange={(e) => update({ slug: slugify(e.target.value) })}
                  className="mt-2 min-h-10 w-full rounded-[var(--radius-card)] border border-line bg-paper px-3 font-mono text-xs text-ink focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="eyebrow" htmlFor="s-category">Category</label>
                <select
                  id="s-category"
                  value={draft.category}
                  onChange={(e) => update({ category: e.target.value as DraftState["category"] })}
                  className="mt-2 min-h-10 w-full rounded-[var(--radius-card)] border border-line bg-paper px-3 text-sm text-ink focus:border-accent focus:outline-none"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <label className="eyebrow mt-6 block" htmlFor="s-subtitle">Subtitle</label>
            <input
              id="s-subtitle"
              value={draft.subtitle ?? ""}
              onChange={(e) => update({ subtitle: e.target.value || null })}
              placeholder="One line beneath the title"
              className="mt-2 min-h-10 w-full rounded-[var(--radius-card)] border border-line bg-paper px-3 text-sm text-ink placeholder:text-ink-faint/50 focus:border-accent focus:outline-none"
            />

            <label className="eyebrow mt-6 block" htmlFor="s-excerpt">Excerpt</label>
            <textarea
              id="s-excerpt"
              value={draft.excerpt}
              onChange={(e) => update({ excerpt: e.target.value })}
              rows={2}
              maxLength={400}
              className="mt-2 w-full resize-none rounded-[var(--radius-card)] border border-line bg-paper px-3 py-2 text-sm leading-relaxed text-ink placeholder:text-ink-faint/50 focus:border-accent focus:outline-none"
            />

            <label className="eyebrow mt-6 block" htmlFor="s-content">Content (Markdown)</label>
            <textarea
              id="s-content"
              value={draft.content_md}
              onChange={(e) => update({ content_md: e.target.value })}
              rows={14}
              placeholder="Write it the way it happened…"
              className="mt-2 w-full resize-y rounded-[var(--radius-card)] border border-line bg-paper px-4 py-3 font-mono text-[0.8125rem] leading-relaxed text-ink placeholder:text-ink-faint/50 focus:border-accent focus:outline-none"
            />

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-line px-5 text-sm text-ink-soft transition-colors hover:border-accent hover:text-ink">
                <UploadCloud className="size-4" strokeWidth={1.5} />
                {uploadingCover ? "Uploading…" : draft.cover_image_url ? "Replace cover" : "Cover image"}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => void uploadCover(e)}
                />
              </label>
              {draft.cover_image_url ? (
                <span className="text-xs text-ink-faint">Cover attached ✓</span>
              ) : null}
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
              <p className="text-xs text-ink-faint" aria-live="polite">
                {saving === "saving" && "Saving…"}
                {saving === "saved" && `Saved · ${draft.reading_time} min read`}
                {saving === "error" && "Save failed — retry"}
                {saving === "idle" && `${draft.reading_time} min read`}
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => void saveNow()}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-5 text-sm text-ink-soft transition-colors hover:border-accent hover:text-ink"
                >
                  <Save className="size-4" strokeWidth={1.5} />
                  Save draft
                </button>
                <button
                  type="button"
                  disabled={saving === "saving" || !draft.title.trim()}
                  onClick={() => void publishNow()}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-6 text-sm text-paper transition-colors duration-300 hover:bg-accent-strong disabled:opacity-40"
                >
                  <Send className="size-3.5" strokeWidth={1.5} />
                  {draft.status === "published" ? "Republish" : "Publish"}
                </button>
              </div>
            </div>
          </div>

          {draft.id && draft.status === "published" ? (
            <div className="mt-4 flex items-center gap-4 text-sm text-ink-faint">
              <Link
                href={`/journal/${draft.slug}`}
                className="inline-flex items-center gap-2 underline decoration-accent underline-offset-4 hover:text-ink"
              >
                <FileText className="size-4" strokeWidth={1.5} />
                View in the journal
              </Link>
              <button
                type="button"
                onClick={() => void unpublishNow()}
                className="transition-colors hover:text-ink"
              >
                Unpublish
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
