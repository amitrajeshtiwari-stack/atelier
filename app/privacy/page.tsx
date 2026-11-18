import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";
import {
  CONTACT_EMAIL,
  POLICIES_UPDATED,
  SITE_NAME,
  pageMeta,
} from "@/lib/site";

export const metadata: Metadata = pageMeta({
  path: "/privacy",
  title: "Privacy policy",
  description:
    "What Gazette collects, what it does not collect, how cookies and advertising work on this site, and how to exercise your privacy rights.",
});

const INDEX = [
  { id: "who-we-are", label: "Who we are" },
  { id: "what-we-collect", label: "What we collect" },
  { id: "cookies", label: "Cookies and local storage" },
  { id: "advertising", label: "Advertising and Google" },
  { id: "measurement", label: "Traffic measurement" },
  { id: "how-we-use", label: "How we use information" },
  { id: "sharing", label: "Who we share it with" },
  { id: "retention", label: "How long we keep it" },
  { id: "your-rights", label: "Your rights" },
  { id: "children", label: "Children" },
  { id: "security", label: "Security" },
  { id: "transfers", label: "Processing outside India" },
  { id: "changes", label: "Changes to this policy" },
  { id: "contact", label: "Contact" },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacy policy"
      title="What this page knows about you"
      lede="Gazette is a noticeboard, not an account system. You can read every notice without signing up, and we never ask for an application, a document or a fee. This page explains the small amount of information that does pass through the site."
      updated={POLICIES_UPDATED}
      index={INDEX}
    >
      <h2 id="who-we-are">Who we are</h2>
      <p>
        Gazette is an independent publication that indexes publicly announced
        government job openings in India. In this policy, &ldquo;Gazette&rdquo;,
        &ldquo;we&rdquo; and &ldquo;us&rdquo; mean this publication. We are not a
        government body, and we are not affiliated with, endorsed by or acting
        on behalf of any department, board, commission or recruitment portal.
      </p>
      <p>
        This policy applies to this website only. When you follow a{" "}
        <strong>Join now</strong> link, you leave Gazette and the privacy policy
        of the relevant government portal applies.
      </p>

      <h2 id="what-we-collect">What we collect</h2>
      <p>
        We do not create accounts, we do not run forms, and we do not accept job
        applications. There is nothing to sign up for and no profile to fill in.
      </p>
      <p>What our web server necessarily receives when you load a page:</p>
      <ul>
        <li>
          The requested address, the time of the request, and the response
          status;
        </li>
        <li>
          Standard technical headers sent by your browser: IP address, browser
          and platform family, and the referring page;
        </li>
        <li>
          A truncated version of the above in short-lived operational logs used
          to diagnose faults and abuse.
        </li>
      </ul>
      <p>
        We do not ask for your name, email address, phone number, date of birth,
        identity documents, photographs or payment details. If anyone claiming
        to represent Gazette asks you for any of these, they are not us — see the{" "}
        <a href="/disclaimer">disclaimer</a>.
      </p>

      <h2 id="cookies">Cookies and local storage</h2>
      <p>
        Gazette itself sets no tracking cookies. We store one preference in your
        browser&rsquo;s local storage: your light or dark theme choice. It stays
        on your device, is never transmitted to us, and you can clear it at any
        time through your browser settings.
      </p>
      <p>
        Cookies may also be set by third parties whose technology appears on the
        page — for example an advertising partner, if advertising is enabled.
      </p>

      <h2 id="advertising">Advertising and Google</h2>
      <p>
        Gazette may display advertising served by Google and other third-party
        vendors in order to keep the site free to read. When advertising is
        enabled, the following applies.
      </p>
      <div className="legal-note">
        <p>
          Third-party vendors, including Google, use cookies to serve ads based
          on your prior visits to this and other websites. Google&rsquo;s use of
          advertising cookies enables it and its partners to serve ads to you
          based on your visits to this site and/or other sites on the internet.
        </p>
      </div>
      <p>
        You can opt out of personalised advertising by visiting{" "}
        <a
          href="https://www.google.com/settings/ads"
          rel="noopener noreferrer nofollow"
          target="_blank"
        >
          Google Ads Settings
        </a>
        , or opt out of third-party vendor cookies more broadly at{" "}
        <a
          href="https://www.aboutads.info/choices/"
          rel="noopener noreferrer nofollow"
          target="_blank"
        >
          aboutads.info
        </a>
        . You can also review{" "}
        <a
          href="https://policies.google.com/technologies/partner-sites"
          rel="noopener noreferrer nofollow"
          target="_blank"
        >
          how Google uses information from sites that use its services
        </a>
        .
      </p>
      <p>
        Visitors in the European Economic Area, the United Kingdom and
        Switzerland are shown a consent message before any such cookie is set,
        and can change or withdraw that choice at any time from the same
        controls.
      </p>

      <h2 id="measurement">Traffic measurement</h2>
      <p>
        We currently run no third-party analytics and build no profiles of
        readers. If aggregate traffic measurement is added later, this page will
        name the provider and describe what it records before it goes live.
      </p>

      <h2 id="how-we-use">How we use information</h2>
      <p>The limited information described above is used to:</p>
      <ul>
        <li>Deliver the pages you ask for and keep the site available;</li>
        <li>Detect and stop abuse, scraping and automated attacks;</li>
        <li>Understand, in aggregate, which notices readers find useful;</li>
        <li>Meet legal obligations and respond to lawful requests.</li>
      </ul>
      <p>
        We do not sell personal information, and we do not share it for
        cross-context behavioural advertising beyond the advertising described
        above.
      </p>

      <h2 id="sharing">Who we share it with</h2>
      <p>
        Technical information is handled by the service providers that host this
        site and its database, under their own contractual and security
        obligations. We may also disclose information where required by law, by
        a competent authority, or to establish or defend a legal claim.
      </p>
      <p>We do not sell, rent or trade reader information to anyone.</p>

      <h2 id="retention">How long we keep it</h2>
      <p>
        Operational server logs are kept for a short period — normally no longer
        than thirty days — and then discarded or aggregated. Published notices
        remain on the site after their last date passes, because the record of
        what was announced is the point of the archive.
      </p>

      <h2 id="your-rights">Your rights</h2>
      <p>
        Under India&rsquo;s Digital Personal Data Protection Act, 2023, you may
        ask for a summary of the personal data we hold about you, request its
        correction or erasure, and nominate someone to exercise your rights on
        your behalf. Where you are in the European Economic Area or the United
        Kingdom, you also have the right to access, rectify, erase or restrict
        processing, to object to processing, to data portability, and to lodge a
        complaint with your local supervisory authority.
      </p>
      <p>
        Because we hold almost nothing about readers, most requests resolve to a
        short explanation of what exists in server logs. Write to{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and we will
        respond within thirty days.
      </p>

      <h2 id="children">Children</h2>
      <p>
        Gazette is a publication about public recruitment and is not directed at
        children. We do not knowingly collect information from anyone under 18,
        and we do not create accounts or profiles at all.
      </p>

      <h2 id="security">Security</h2>
      <p>
        The site is served over HTTPS, and access to its infrastructure is
        restricted to those who need it. No system is perfectly secure, but we
        keep the amount of information we hold deliberately small so that a
        breach would have very little to expose.
      </p>

      <h2 id="transfers">Processing outside India</h2>
      <p>
        Our hosting and database providers may process technical data on servers
        located outside India. Where that happens, the transfer is limited to
        the operational information described in this policy.
      </p>

      <h2 id="changes">Changes to this policy</h2>
      <p>
        If this policy changes materially — for example when advertising or
        measurement is introduced — the revised version will be published here
        with a new date at the top of the page. Continuing to use the site after
        a change means you accept the updated policy.
      </p>

      <h2 id="contact">Contact</h2>
      <p>
        Questions about this policy, or a request under the rights above, can be
        sent to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. This is
        also the address for copyright and removal requests concerning a notice.
        More ways to reach us are listed on the{" "}
        <a href="/contact">contact page</a>.
      </p>
      <p>
        {SITE_NAME} publishes notices for information only. Corrections are
        always welcome and are handled under our{" "}
        <a href="/editorial">editorial policy</a>.
      </p>
    </LegalPage>
  );
}
