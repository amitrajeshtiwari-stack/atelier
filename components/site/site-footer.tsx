import Link from "next/link";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";

const FOOTER_LINKS = [
  { href: "/gazette", label: "The Plate" },
  { href: "/guides", label: "Guides" },
  { href: "/archive", label: "Archive" },
  { href: "/about", label: "About" },
];

const LEGAL_LINKS = [
  { href: "/editorial", label: "Editorial policy" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/disclaimer", label: "Disclaimer" },
  { href: "/contact", label: "Contact" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <div className="flex flex-col items-start justify-between gap-6 py-12 sm:flex-row sm:items-center">
          <div>
            <p className="font-display text-lg">
              {SITE_NAME}
              <span className="text-accent">.</span>
            </p>
            <p className="eyebrow mt-2 text-[0.625rem]">
              Government job openings · Filed daily
            </p>
          </div>
          <nav aria-label="Footer" className="flex items-center gap-6">
            {FOOTER_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="eyebrow text-[0.625rem] transition-colors duration-300 hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Standing notices: who we are not, and where to write. */}
        <div className="flex flex-col gap-5 border-t border-line py-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-[52ch] text-xs leading-relaxed text-ink-faint">
            {SITE_NAME} is an independent publication. It is not a government
            website and is not affiliated with any department or recruitment
            portal. Always verify details on the official notice.
          </p>
          <nav aria-label="Policies" className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {LEGAL_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-xs text-ink-soft transition-colors duration-300 hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-xs text-ink-soft transition-colors duration-300 hover:text-ink"
            >
              {CONTACT_EMAIL}
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
