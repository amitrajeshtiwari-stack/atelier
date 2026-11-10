import type { Metadata } from "next";
import { getPublishedPosts } from "@/lib/posts";
import { JournalFeed } from "@/components/journal/journal-feed";
import { SectionHeading } from "@/components/ui/section-heading";

export const metadata: Metadata = {
  title: "Journal — Atelier",
  description:
    "Essays on design, engineering, and the quiet craft of the web — filed as they land.",
};

// Editorial freshness: the grid revalidates at most every minute.
export const revalidate = 60;

export default async function JournalPage() {
  const posts = await getPublishedPosts();

  return (
    <div className="mx-auto max-w-6xl px-6 pb-32 pt-20 md:px-10 md:pt-28">
      <SectionHeading
        eyebrow="The Journal"
        title="Everything, in the order it was thought"
        lede="New entries stream in as they're published — the page stays open to the room. Filter by wing: Design, Engineering, Culture, Notes."
      />
      <div className="mt-14">
        <JournalFeed initialPosts={posts} />
      </div>
    </div>
  );
}
