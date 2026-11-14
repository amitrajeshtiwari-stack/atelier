import type { Metadata } from "next";
import { getNotices } from "@/lib/notices";
import { GazetteBoard } from "@/components/gazette/gazette-board";
import { SectionHeading } from "@/components/ui/section-heading";

export const metadata: Metadata = {
  title: "The Gazette — Atelier",
  description:
    "Government job openings across India, filed daily as notices. Every entry links to the official portal — read the plate, then apply at the source.",
};

// Editorial freshness: the plate revalidates at most every minute.
export const revalidate = 60;

export default async function GazettePage() {
  const notices = await getNotices();

  return (
    <div className="mx-auto max-w-6xl px-6 pb-32 pt-20 md:px-10 md:pt-28">
      <SectionHeading
        eyebrow="The Gazette"
        title="Openings, in the order they were announced"
        lede="A daily plate of government job notifications — departments, vacancies, last dates, at a glance. No filters, no forms: open a notice for its brief, then join through the official government website."
      />
      <div className="mt-14">
        <GazetteBoard initialNotices={notices} />
      </div>
    </div>
  );
}
