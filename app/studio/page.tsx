import type { Metadata } from "next";
import { StudioApp } from "@/components/studio/studio-app";

export const metadata: Metadata = {
  title: "Studio",
  description: "The atelier's writing desk — drafts, publishing, and covers.",
};

// The Studio is fully client-side (auth via supabase-js + RLS-gated APIs),
// so it stays a static shell.
export default function StudioPage() {
  return <StudioApp />;
}
