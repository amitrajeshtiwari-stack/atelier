import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";
import { CONTACT_EMAIL, POLICIES_UPDATED, SITE_NAME, pageMeta } from "@/lib/site";

export const metadata: Metadata = pageMeta({
  path: "/disclaimer",
  title: "Disclaimer",
  description:
    "Gazette is an independent publication, not a government website. Verify every detail on the official portal, and never pay anyone who claims to act for us.",
});

const INDEX = [
  { id: "not-government", label: "Not a government site" },
  { id: "information-only", label: "Information, not advice" },
  { id: "verify", label: "Verify at the source" },
  { id: "fraud", label: "Fraud warning" },
  { id: "no-guarantee", label: "No guarantee of outcome" },
  { id: "summaries", label: "Summaries are condensed" },
  { id: "marks", label: "Names and marks" },
  { id: "contact", label: "Report a problem" },
];

export default function DisclaimerPage() {
  return (
    <LegalPage
      eyebrow="Disclaimer"
      title="Not the government. Just the notices."
      lede="This page exists so there is no doubt about what Gazette is and is not. Read it once — it is the shortest way to stay safe while job hunting."
      updated={POLICIES_UPDATED}
      index={INDEX}
    >
      <h2 id="not-government">Not a government site</h2>
      <p>
        {SITE_NAME} is an independent publication. It is not owned, operated,
        funded or endorsed by the Government of India, any state government, any
        ministry, department, board, commission, public sector undertaking or
        recruitment portal. No government body has approved or reviewed this
        site.
      </p>
      <p>
        A notice appearing here does not mean the recruiting body knows about
        this site, endorses it, or will accept anything you send to us. We accept
        nothing on their behalf.
      </p>

      <h2 id="information-only">Information, not advice</h2>
      <p>
        Everything on this site is published for general information. It is not
        legal, career, financial or recruitment advice, and it does not create any
        relationship between you and {SITE_NAME}. If a decision matters, confirm
        it with the recruiting body directly.
      </p>

      <h2 id="verify">Verify at the source</h2>
      <p>
        Every notice links to an official government address — a{" "}
        <strong>.gov.in</strong> or <strong>.nic.in</strong> page — shown beneath
        the Join now button. Before you apply, pay a fee, download a form or
        travel to a centre, open that official page and check:
      </p>
      <ul>
        <li>The last date, including any extension or corrigendum;</li>
        <li>The number of vacancies and the post names;</li>
        <li>Eligibility, age limit and reservation rules;</li>
        <li>The exact fee and the payment method the department accepts.</li>
      </ul>
      <p>
        If a detail here differs from the official notification, the official
        notification is correct and this site is wrong. Tell us and we will fix
        it.
      </p>

      <h2 id="fraud">Fraud warning</h2>
      <div className="legal-note">
        <p>
          Nobody from {SITE_NAME} will ever call, message or email you asking for
          money, documents, bank details, a password, or an OTP. We do not
          arrange jobs, we cannot influence a selection, and we do not charge for
          anything.
        </p>
      </div>
      <p>
        Government recruitment fraud is common. Treat any &ldquo;agent&rdquo;,
        &ldquo;contact person&rdquo; or &ldquo;backdoor entry&rdquo; offer as a
        scam, especially if it uses our name, a lookalike domain, or a screenshot
        of this site. Report it to us at{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and to the
        authorities.
      </p>

      <h2 id="no-guarantee">No guarantee of outcome</h2>
      <p>
        We do not guarantee that a notice is current, complete, error-free, or
        that the linked portal will be available. Departments revise and withdraw
        notifications without telling us. We are not responsible for a missed
        deadline, a rejected application, a cancelled examination or any other
        loss connected with a recruitment.
      </p>

      <h2 id="summaries">Summaries are condensed</h2>
      <p>
        Each entry is a short, plain-language brief: department, post, vacancies,
        fees, age limit, last date. It is deliberately shorter than the official
        notification and cannot replace it. Where we quote figures, they are
        taken from the announcement at the time of filing.
      </p>

      <h2 id="marks">Names and marks</h2>
      <p>
        Department names, examination names, acronyms and official emblems
        belong to their respective owners and are used here only to identify the
        notice being described. Their use does not imply any association with,
        sponsorship of, or approval by {SITE_NAME}.
      </p>

      <h2 id="contact">Report a problem</h2>
      <p>
        Spotted something wrong, or something that should not be published? Write
        to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> with the page
        address. Corrections and removals are handled under our{" "}
        <a href="/editorial">editorial policy</a>, and the{" "}
        <a href="/contact">contact page</a> lists every other way to reach us.
      </p>
    </LegalPage>
  );
}
