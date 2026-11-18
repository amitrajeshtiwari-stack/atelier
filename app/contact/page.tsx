import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { LegalPage } from "@/components/site/legal-page";
import {
  CONTACT_EMAIL,
  POLICIES_UPDATED,
  SITE_NAME,
  pageMeta,
} from "@/lib/site";

export const metadata: Metadata = pageMeta({
  path: "/contact",
  title: "Contact",
  description:
    "How to reach Gazette: corrections to a notice, removal requests, privacy questions, and press. We host no forms and never ask for applications.",
});

const REASONS = [
  {
    title: "A notice is wrong",
    body: "Send the page address and the detail that needs changing. Where the official notification contradicts our summary, we correct it and note the change at the foot of the notice.",
  },
  {
    title: "A notice should come down",
    body: "Departments, boards and rights holders can ask us to remove or amend an entry. Include the page address and the basis of the request.",
  },
  {
    title: "Privacy or data request",
    body: "Ask for a summary of what we hold, or for correction or erasure under the DPDP Act, 2023 or the GDPR. Most requests resolve to an explanation of our server logs.",
  },
  {
    title: "Fraud or impersonation",
    body: "If someone used our name to ask you for money, documents or an OTP, tell us with whatever you can share — a phone number, an account, a screenshot.",
  },
  {
    title: "Press and research",
    body: "Journalists and researchers can ask about the publication, our sourcing rules, or the archive. Say what you are working on and the deadline.",
  },
];

export default function ContactPage() {
  return (
    <LegalPage
      eyebrow="Contact"
      title="Say it once, to the right inbox"
      lede="One address reaches everything at Gazette. There is no contact form because we host no forms at all — no applications, no uploads, no documents. An email is enough."
      updated={POLICIES_UPDATED}
    >
      <div className="legal-note">
        <p>
          Write to{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-lg">
            {CONTACT_EMAIL}
          </a>
          . We read everything and usually reply within two to three working days.
        </p>
      </div>

      <p>
        {SITE_NAME} is a small, independent publication. There is no call centre,
        no WhatsApp number and no office you can visit. Anything claiming
        otherwise — an account, a phone number, a &ldquo;helpline&rdquo; — is not
        us.
      </p>

      <h2 id="what-to-write-about">What to write about</h2>
      <ul>
        {REASONS.map((reason) => (
          <li key={reason.title}>
            <strong>{reason.title}.</strong> {reason.body}
          </li>
        ))}
      </ul>

      <h2 id="what-not-to-send">What not to send</h2>
      <div className="legal-note">
        <p>
          Please do not send applications, CVs, mark sheets, identity documents,
          photographs, payment details or OTPs — not by email, and never in
          response to a message that claims to be from us. Gazette cannot forward
          anything to a department, and we do not accept applications for any
          post.
        </p>
      </div>

      <h2 id="before-you-write">Before you write</h2>
      <p>
        Many questions are answered already: the{" "}
        <Link href="/about">About page</Link> explains how the plate works, the{" "}
        <Link href="/editorial">editorial policy</Link> covers corrections and
        removals, the <Link href="/disclaimer">disclaimer</Link> covers
        non-affiliation and fraud, and the{" "}
        <Link href="/privacy">privacy policy</Link> covers data. For a specific
        opening, the official portal linked in the notice is the only place that
        can answer questions about eligibility, fees or admit cards.
      </p>

      <h2 id="email-etiquette">Getting a useful reply</h2>
      <p>
        Include the full page address of the notice you are writing about, say
        what is wrong or what you need, and—if it is a correction—link the
        official page that settles it. That is usually enough for us to act on the
        same day.
      </p>

      <p className="mt-10">
        <Link
          href="/gazette"
          className="inline-flex min-h-11 items-center gap-3 rounded-full border border-line px-6 text-sm text-ink-soft no-underline transition-colors duration-300 hover:border-accent hover:text-ink"
        >
          Back to the plate
          <ArrowUpRight className="size-4" strokeWidth={1.5} />
        </Link>
      </p>
    </LegalPage>
  );
}
