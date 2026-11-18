import type { Metadata } from "next";
import { getNotices } from "@/lib/notices";
import { GazetteBoard } from "@/components/gazette/gazette-board";
import { SectionHeading } from "@/components/ui/section-heading";
import { openGraphFor, twitterFor } from "@/lib/site";

const PAGE_TITLE = "The Plate — every notice filed";
const PAGE_DESCRIPTION =
  "The complete Gazette plate: every government job opening filed so far, newest first. Every entry links to the official portal.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/gazette" },
  openGraph: openGraphFor({
    path: "/gazette",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  }),
  twitter: twitterFor({ title: PAGE_TITLE, description: PAGE_DESCRIPTION }),
};

// Editorial freshness: the plate revalidates at most every minute.
export const revalidate = 60;

export default async function GazettePage() {
  const notices = await getNotices();

  return (
    <div className="mx-auto max-w-6xl px-6 pb-32 pt-20 md:px-10 md:pt-28">
      <SectionHeading
        eyebrow="The Plate"
        title="Every notice on record"
        lede="The complete index — every opening filed since the Gazette began, newest first. No filters: read it top to bottom like the paper it is."
      />
      <div className="mt-14">
        <GazetteBoard initialNotices={notices} />
      </div>
    </div>
  );
}
