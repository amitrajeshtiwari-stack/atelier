import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Atelier fetches its content from Supabase in Server Components with
  // classic `revalidate` semantics (per-route freshness for editorial
  // content). That maps to Next's legacy caching model, so the new
  // `cacheComponents` (use-cache) model is explicitly OFF here. Realtime
  // subscriptions and route-handler mutations stay client-side uncached.
  cacheComponents: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      { protocol: "https", hostname: "fyomfuvjsykabjgepgkd.supabase.co" },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
