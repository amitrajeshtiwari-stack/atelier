# BIG CONTEXT PROMPT — 3D Elegant Blog with Backend & Realtime Updates

Copy everything below this line as your prompt.

---

You are a senior full-stack + creative-web engineer. Build a production-ready, elegant 3D blog platform. Read the ENTIRE specification before writing code. Work incrementally: scaffold → theme/3D shell → data layer → realtime API → pages → polish. After every major step, verify the app runs and typing passes.

## 0. Tech Stack (locked)

- **Framework:** Next.js 15+ (App Router, Server Components, TypeScript strict mode)
- **3D:** Three.js via `@react-three/fiber` + `@react-three/drei` + `@react-three/postprocessing`
- **Styling:** Tailwind CSS v4 + shadcn/ui components; `framer-motion` for micro-interactions; `lenis` for smooth scrolling
- **Fonts:** A display serif (e.g. "Fraunces" or "Cormorant Garamond") for headings + a clean sans (Inter / Geist) for body — loaded with `next/font`
- **Database & Auth:** Supabase (Postgres + Row Level Security + Supabase Auth)
- **Realtime:** Supabase Realtime channels (postgres_changes for posts, broadcast for presence + live comments)
- **Validation:** Zod schemas shared between client and server
- **Lint/Type safety:** ESLint + `tsc --noEmit` must pass before you declare anything done

If any piece of the stack is unavailable in my environment, STOP and tell me before substituting.

## 1. Product Vision

An editorial, gallery-like blog that feels like walking through a spatial magazine:

- **Mood:** Elegant, calm, premium. Think Awwwards-grade typography, generous whitespace, warm off-white/ink palette with one metallic accent (soft gold or champagne), NOT neon sci-fi.
- **Dark & light mode** with tasteful 3D material changes per theme (e.g., frosted glass in light, subtle mirror/obsidian in dark).
- The 3D is **accent, not gimmick**: it frames content, never prevents reading. Every 3D scene must be lazy-loaded, respect `prefers-reduced-motion`, pause when off-screen, and fall back to a static gradient for low-power devices.

## 2. Site Structure & Pages

1. **Home / Hero:** Full-viewport 3D scene — an elegant abstract object (e.g., a slowly rotating glass/plaster monolith cluster or draped cloth over floating volumes) reacting subtly to pointer parallax. Headline in huge serif, fade-in with staggered letter animation. Scroll indicator.
2. **Blog index ("Journal"):** Scroll-driven 3D gallery — featured post as a large 3D-tilted card, then a refined list/grid where cards have depth-tilt on hover (`transform-style: preserve-3d`). Category filter as elegant pills with an animated active indicator.
3. **Post page ("Entry"):** Long-form reading experience. Max-width ~68ch, beautiful pull quotes, drop caps, figure with caption. Ambient 3D: a fixed, low-opacity background scene whose lighting matches scroll progress (hero → subtle → dark footer). Floating reading-progress indicator. Auto-generated table of contents that highlights the active heading (IntersectionObserver).
4. **About + Archive pages**, minimal, typographic.
5. **Newsletter/modal:** non-intrusive, slide-in after 50% scroll, saved to `subscribers` table.

## 3. 3D Requirements (concrete)

- All scenes in `components/three/`, each dynamically imported with `next/dynamic` + `ssr: false`, wrapped in `<Suspense>` with a styled skeleton.
- **Scene 1 — HeroCanvas:** 5–8 primitive volumes (rounded boxes, spheres, torus) with `MeshPhysicalMaterial` (transmission 0.6–0.9, roughness ~0.25, IOR ~1.45), 3-point lighting, soft `ContactShadows`, `Environment preset="studio"`, gentle `Float` motion, pointer-parallax via lerp. Postprocessing: `Bloom` (low intensity), `Noise` (subtle), optional `Vignette`.
- **Scene 2 — CardTilt:** reusable; post's cover image textured onto a thin rounded plane inside the canvas OR CSS 3D tilt (choose CSS tilt for perf on list cards; WebGL only for the featured card).
- **Scene 3 — AmbientCanvas (post page):** fixed behind content, `opacity < 0.35`, `pointer-events: none`, animated light color by scroll, particle field using instanced meshes (not raw points-in-loop), capped at ~2000 particles.
- Perf budget: LCP canvas ≤ 1.5MB GPU-friendly geometry, `dpr={[1, 1.75]}`, `frameloop="demand"` where possible, dispose geometries/materials on unmount, and a `<Perf>`-checked 60fps target on M1-class hardware.
- Accessibility: full keyboard navigation, all content readable without WebGL (`Canvas` wrapped in a component that renders a static fallback if `WebGLRenderingContext` is unavailable or `prefers-reduced-motion: reduce`).

## 4. Data Model (Supabase / Postgres)

```sql
-- profiles (extends auth.users): id uuid PK, username unique, avatar_url, bio
-- posts: id uuid PK, author_id FK profiles, slug unique, title, subtitle,
--   excerpt, content_md text, cover_image_url, category, tags text[],
--   status enum('draft','published'), reading_time int,
--   published_at timestamptz, created_at, updated_at
-- comments: id uuid PK, post_id FK, author_id FK, parent_id FK self (threaded),
--   body text, created_at
-- reactions: post_id, user_id, kind enum('like','insight','bookmark'), PK (post_id,user_id,kind)
-- subscribers: id uuid PK, email unique, created_at
-- realtime_events: id uuid, type, payload jsonb, created_at -- audit/log (optional)
```

- Enable RLS on every table: anyone can read `status='published'`; only the author can write their own posts/drafts; comments readable by anyone on published posts, writable by authenticated users; reactions upsert-able only by their owner.
- Seed script with 6 realistic, well-written sample posts (real paragraphs, varied categories: Design, Engineering, Culture, Notes) and cover images (use picsum placeholders I can replace).

## 5. API & Realtime Behavior

- Server Components fetch initial posts by slug via Supabase with `revalidate`; mutations go through Next.js Route Handlers in `app/api/*` using Zod validation + session check.
- **Realtime must work for these flows:**
  1. **Live post feed:** on the Journal page, subscribe to `postgres_changes` on `posts`; a newly published post animates into the grid with a soft 3D reveal (no page reload). Show a "1 new entry" pill if it arrives while scrolled.
  2. **Live comments:** comments stream into the post page with a spring entrance; optimistic UI on submit; presence avatars ("N readers here") in the sidebar via Supabase Presence.
  3. **Live reactions:** heart/insight counts update instantly across all connected clients with a small 3D flourish (the featured card pulses light once).
- Clean subscription management: a `useRealtime` hook wrapper handling auto-reconnect, channel teardown on unmount, and throttled UI updates (max 1 render per 250ms per channel).

## 6. Author Panel

- `/studio` (auth-gated): write posts in a styled Markdown editor with live preview (side-by-side on desktop), autosave draft every 5s with "Saved" indicator over realtime, slug auto-generation, cover upload to Supabase Storage, publish/unpublish toggle. Publishing triggers the live feed update — demonstrate this by opening a second tab.

## 7. Design System Rules

- Spacing scale 4/8/12/24/48/96; radius: 2px small / 12px cards / full on pills; shadows extremely soft (`0 20px 60px -30px rgb(0 0 0 / 0.25)`).
- Motion: durations 300–700ms, easing `cubic-bezier(0.22, 1, 0.36, 1)`; never exceed two simultaneous animations per viewport.
- Implement a reusable `<TiltCard>`, `<Reveal>`, `<Magnetic button>`, and `<SectionHeading>` with eyebrow label (small caps, letterspaced).
- Fully responsive: hero canvas hides heavy geometry under 640px (simplify scene, keep pointer parallax off). Everything touch-friendly (44px min targets).

## 8. Deliverables & Definition of Done

- Full project in this directory, runnable with `npm install && npm run dev`, plus `.env.example` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`), README with setup steps including the SQL to run and how to seed.
- `npm run build` and `tsc --noEmit` pass with zero errors.
- Lighthouse mobile targets: Performance ≥ 80, Accessibility ≥ 95, Best Practices ≥ 95.
- After scaffolding, pause and show me the file tree + screenshots of the hero before continuing. Then proceed through: data layer → realtime → pages → author panel → polish.
- Commit sensible, isolated increments and narrate key decisions briefly.

Now begin with Step 1: scaffold the project and the design tokens + fonts + hero canvas shell.
