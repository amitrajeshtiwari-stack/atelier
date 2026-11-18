import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";
import {
  CONTACT_EMAIL,
  POLICIES_UPDATED,
  SITE_NAME,
  pageMeta,
} from "@/lib/site";

export const metadata: Metadata = pageMeta({
  path: "/terms",
  title: "Terms of use",
  description:
    "The terms on which Gazette is offered: what the site is, what it is not, how notices may be used, and the limits of our liability.",
});

const INDEX = [
  { id: "acceptance", label: "Acceptance" },
  { id: "what-gazette-is", label: "What Gazette is" },
  { id: "permitted-use", label: "Permitted use" },
  { id: "no-fees", label: "No fees, ever" },
  { id: "accuracy", label: "Accuracy and the official notice" },
  { id: "third-party", label: "Third-party links" },
  { id: "intellectual-property", label: "Intellectual property" },
  { id: "availability", label: "Availability" },
  { id: "liability", label: "Limitation of liability" },
  { id: "indemnity", label: "Indemnity" },
  { id: "law", label: "Governing law" },
  { id: "changes", label: "Changes to these terms" },
  { id: "contact", label: "Contact" },
];

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Terms of use"
      title="The terms you read us on"
      lede="These terms apply to everyone who uses Gazette. They are short because the site does one thing: it points you to official government notices. Please read them alongside the disclaimer and the privacy policy."
      updated={POLICIES_UPDATED}
      index={INDEX}
    >
      <h2 id="acceptance">Acceptance</h2>
      <p>
        By using this website you agree to these terms. If you do not agree with
        them, please do not use the site. If you use the site on behalf of an
        organisation, you confirm you are authorised to accept these terms for
        it.
      </p>

      <h2 id="what-gazette-is">What Gazette is</h2>
      <p>
        Gazette is an independent, reader-facing index of government job
        openings, results, admit cards and related announcements that have
        already been published in the public domain. We summarise each
        announcement in our own words and link to the official government page
        where it originates.
      </p>
      <div className="legal-note">
        <p>
          Gazette is not a government website. We are not affiliated with,
          endorsed by, or acting for any ministry, department, board,
          commission, public sector undertaking or recruitment portal. We are not
          a recruitment agency, a consultant, or an agent for any employer.
        </p>
      </div>
      <p>
        We do not accept applications, collect documents, conduct examinations or
        influence any selection process. Nothing on this site is an offer of
        employment.
      </p>

      <h2 id="permitted-use">Permitted use</h2>
      <p>You may read, share and link to Gazette pages freely — including in a classroom, a coaching centre or a family WhatsApp group. You may not:</p>
      <ul>
        <li>
          Copy or republish substantial parts of the site as your own
          publication, or present our summaries as original work by someone
          else;
        </li>
        <li>
          Scrape, crawl or harvest the site by automated means beyond ordinary
          search-engine indexing of publicly linked pages;
        </li>
        <li>
          Interfere with the site&rsquo;s operation, attempt to gain
          unauthorised access, or place unreasonable load on it;
        </li>
        <li>
          Use the site in a way that misleads others — for example presenting it
          as an official government portal, or using our name to demand money or
          documents from candidates.
        </li>
      </ul>

      <h2 id="no-fees">No fees, ever</h2>
      <p>
        Gazette is free to read and has never charged, and will never charge, for
        access to a notice or for &ldquo;processing&rdquo; an application. Any
        government application fee is paid only on the official portal named in
        the notice, never to us and never to a third party acting in our name.
      </p>
      <p>
        If someone asks you for money, documents or an OTP while claiming to be
        from Gazette, stop and report it to us at{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Please also see
        the fraud warning in our <a href="/disclaimer">disclaimer</a>.
      </p>

      <h2 id="accuracy">Accuracy and the official notice</h2>
      <p>
        We take care to summarise accurately, but every summary on this site is a
        convenience. Dates change, vacancies are revised, and corrigenda are
        issued. The <strong>official notification</strong> published by the
        recruiting body is the only authoritative version, and it always governs
        — including on eligibility, reservation, fees, age limits and deadlines.
      </p>
      <p>
        Always confirm the details on the official portal before you rely on
        them, pay a fee or travel to an examination centre. If you spot an error,
        please tell us through the <a href="/contact">contact page</a>; we
        correct confirmed errors under our{" "}
        <a href="/editorial">editorial policy</a>.
      </p>

      <h2 id="third-party">Third-party links</h2>
      <p>
        Notices link to websites we do not control. We are not responsible for
        their content, availability, security or privacy practices, and a link is
        not an endorsement of anything beyond the notice it points to.
      </p>

      <h2 id="intellectual-property">Intellectual property</h2>
      <p>
        The design, layout, typography and original text of this site belong to{" "}
        {SITE_NAME}. Summaries and the selection and arrangement of notices are
        our own work. Government notifications, logos and official documents
        referenced here remain the property of the respective departments and
        are linked to at source rather than reproduced wholesale.
      </p>
      <p>
        If you believe material on this site infringes your rights, write to{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> with the page
        address and the basis of your claim. We remove or amend material where a
        claim is well founded.
      </p>

      <h2 id="availability">Availability</h2>
      <p>
        The site is provided as it is and as available. We do not promise
        uninterrupted access, and we may change, suspend or withdraw any part of
        it — including individual notices — at any time without notice.
      </p>

      <h2 id="liability">Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, {SITE_NAME} is not liable for any
        loss arising from your use of, or inability to use, this site — including
        a missed deadline, a rejected application, a wrong detail in a summary, or
        reliance on a third-party website. Your use of the site and of any
        official portal is at your own risk.
      </p>
      <p>
        Nothing in these terms limits liability that cannot lawfully be limited.
      </p>

      <h2 id="indemnity">Indemnity</h2>
      <p>
        You agree to indemnify {SITE_NAME} against claims and costs arising from
        your misuse of the site or your breach of these terms.
      </p>

      <h2 id="law">Governing law</h2>
      <p>
        These terms are governed by the laws of India. Disputes are subject to
        the jurisdiction of the competent courts in India.
      </p>

      <h2 id="changes">Changes to these terms</h2>
      <p>
        We may revise these terms as the site develops. The current version is
        always published here, with the date of revision at the top of the page.
        Continuing to use the site after a revision means you accept the revised
        terms.
      </p>

      <h2 id="contact">Contact</h2>
      <p>
        Questions about these terms can be sent to{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. For everything
        else — corrections, removals, or press — see the{" "}
        <a href="/contact">contact page</a>.
      </p>
    </LegalPage>
  );
}
