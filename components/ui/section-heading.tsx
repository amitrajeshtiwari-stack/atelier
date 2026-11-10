import { Reveal } from "@/components/motion/reveal";

/**
 * Section heading: letterspaced eyebrow, display heading, optional lede.
 * The single typographic rhythm used above every content section.
 */
export function SectionHeading({
  eyebrow,
  title,
  lede,
  align = "left",
  className = "",
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  align?: "left" | "center";
  className?: string;
}) {
  const centered = align === "center";
  return (
    <Reveal
      className={`${centered ? "mx-auto text-center" : ""} max-w-3xl ${className}`}
    >
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-5 text-4xl leading-[1.05] tracking-tight text-ink md:text-5xl">
        {title}
      </h2>
      {lede ? (
        <p
          className={`mt-5 max-w-[56ch] text-lg leading-relaxed text-ink-soft ${centered ? "mx-auto" : ""}`}
        >
          {lede}
        </p>
      ) : null}
    </Reveal>
  );
}
