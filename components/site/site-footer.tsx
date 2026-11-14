import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/journal", label: "Journal" },
  { href: "/gazette", label: "Gazette" },
  { href: "/archive", label: "Archive" },
  { href: "/about", label: "About" },
  { href: "/studio", label: "Studio" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 py-12 sm:flex-row sm:items-center md:px-10">
        <div>
          <p className="font-display text-lg">
            Atelier<span className="text-accent">.</span>
          </p>
          <p className="eyebrow mt-2 text-[0.625rem]">
            A spatial journal · Est. MMXXVI
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
    </footer>
  );
}
