import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";
import { CONTACT_EMAIL, POLICIES_UPDATED, SITE_NAME, pageMeta } from "@/lib/site";

export const metadata: Metadata = pageMeta({
  path: "/editorial",
  title: "Editorial policy",
  description:
    "How Gazette decides what to publish: official links only, no paid placements, a stated corrections process, and notices closed when their window passes.",
});

const INDEX = [
  { id: "what-we-publish", label: "What we publish" },
  { id: "how-a-notice-arrives", label: "How a notice arrives" },
  { id: "official-link-rule", label: "The official-link rule" },
  { id: "what-is-ours", label: "What is ours, and what is theirs" },
  { id: "no-paid-placement", label: "No paid placement" },
  { id: "corrections", label: "Corrections" },
  { id: "removals", label: "Removals" },
  { id: "closing", label: "Closing a notice" },
  { id: "complaints", label: "Complaints" },
];

export default function EditorialPage() {
  return (
    <LegalPage
      eyebrow="Editorial policy"
      title="What gets filed, and why"
      lede="A noticeboard is only useful if you can trust what is on it. These are the rules the plate is held to — the ones a reader, a department or a reviewer can check us against."
      updated={POLICIES_UPDATED}
      index={INDEX}
    >
      <h2 id="what-we-publish">What we publish</h2>
      <p>
        {SITE_NAME} publishes public recruitment announcements from Indian
        government bodies: new vacancies, results, admit cards, answer keys and
        admission notices. Each entry records the department, the post or
        examination, the number of vacancies where stated, the application fee,
        the age limit, the last date, and the official address where the
        announcement lives.
      </p>
      <p>
        We publish nothing else. There are no opinion pieces, no coaching
        promotions, no affiliate offers and no paid listings on the plate.
      </p>

      <h2 id="how-a-notice-arrives">How a notice arrives</h2>
      <p>
        Public recruitment announcements are monitored daily. When an
        announcement is found, it is checked against the recruiting body&rsquo;s
        own website, then written up as a short brief with the facts a candidate
        needs to decide whether to open the notification.
      </p>
      <p>
        We would rather publish nothing than publish a guess. If a detail cannot
        be confirmed, it is left out of the brief rather than estimated.
      </p>

      <h2 id="official-link-rule">The official-link rule</h2>
      <div className="legal-note">
        <p>
          A notice is filed only when there is a genuine government address to
          point to — a <strong>.gov.in</strong> or <strong>.nic.in</strong> page
          on the recruiting body&rsquo;s own site. If no such link can be
          verified, the entry is skipped, however promising the announcement
          looks.
        </p>
      </div>
      <p>
        This is why the Join now button always leads off-site. We do not host
        application forms, take payments or collect documents, so there is no
        reason for a notice to route through us.
      </p>

      <h2 id="what-is-ours">What is ours, and what is theirs</h2>
      <p>
        The selection of notices, the briefs, the facts plates and the design of
        this site are our own work. The underlying notifications, logos,
        emblems and official documents belong to the departments that issued
        them and are linked to at source.
      </p>
      <p>
        Where an announcement is summarised, it is condensed and rewritten for
        clarity. It is never a substitute for the notification itself, and we say
        so on every notice page.
      </p>

      <h2 id="no-paid-placement">No paid placement</h2>
      <p>
        No department, coaching institute, agent or advertiser can pay to have a
        notice filed, moved up the plate, kept open past its last date or worded
        favourably. Order is chronological: newest announcement first. Advertising
        space, when it exists, is clearly separate from the notices and has no
        influence on what is published.
      </p>

      <h2 id="corrections">Corrections</h2>
      <p>
        When a confirmed error is reported — a wrong date, a wrong vacancy count,
        a mistyped department — the notice is corrected and the change is noted
        at the foot of the page with the date. Where the official notification
        itself is amended, the summary follows the amendment.
      </p>
      <p>
        Send corrections to{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> with the page
        address and, ideally, the official page that settles the point.
      </p>

      <h2 id="removals">Removals</h2>
      <p>
        If a department, board or rights holder asks us to remove or amend an
        entry, we do so where the request is well founded — for example a
        withdrawn notification, a notice issued in error, or a genuine rights
        claim. Removal requests should identify the page and the reason.
      </p>

      <h2 id="closing">Closing a notice</h2>
      <p>
        A notice stays on the plate while applications are open. Once the last
        date has passed it is marked closed, and it moves to the archive so the
        record of what was announced survives without cluttering the current
        plate. Closed notices are never deleted to make the archive look fresher
        than it is.
      </p>

      <h2 id="complaints">Complaints</h2>
      <p>
        If you think something here is misleading, unsafe or wrongly sourced,
        write to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. We would
        rather correct a notice than defend it.
      </p>
    </LegalPage>
  );
}
