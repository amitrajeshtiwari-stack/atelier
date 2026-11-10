"use client";

import Link from "next/link";
import { MoonStar, Sun } from "lucide-react";
import { useTheme, applyTheme } from "@/lib/use-theme";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/journal", label: "Journal" },
  { href: "/about", label: "About" },
  { href: "/archive", label: "Archive" },
];

export function SiteHeader() {
  const theme = useTheme();

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 backdrop-blur-md md:h-20 md:px-10" style={{ background: "linear-gradient(to bottom, var(--glass), transparent)" }}>
        <Link
          href="/"
          className="font-display text-lg tracking-tight transition-opacity duration-300 hover:opacity-70"
        >
          Atelier<span className="text-accent">.</span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-8 sm:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="eyebrow text-[0.625rem] transition-colors duration-300 hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle theme={theme} />
        </div>
      </div>
    </header>
  );
}

function ThemeToggle({ theme }: { theme: "light" | "dark" }) {
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => {
        applyTheme(isDark ? "light" : "dark");
      }}
      className={cn(
        "flex h-11 w-11 items-center justify-center rounded-full border border-line",
        "transition-colors duration-300 hover:bg-accent-soft"
      )}
    >
      {isDark ? (
        <Sun className="size-4 text-ink" strokeWidth={1.5} />
      ) : (
        <MoonStar className="size-4 text-ink" strokeWidth={1.5} />
      )}
    </button>
  );
}
