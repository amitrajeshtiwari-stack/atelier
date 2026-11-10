"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { HTMLAttributes } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

const TAGS = {
  h1: motion.h1,
  h2: motion.h2,
  p: motion.p,
} as const;

type TagName = keyof typeof TAGS;

/**
 * Editorial headline entrance: characters rise with a masked reveal and a
 * staggered delay. Rendered as plain text when the user prefers reduced
 * motion (aria-label preserved either way).
 */
export function StaggeredText({
  text,
  as = "h1",
  className = "",
  delay = 0,
  stagger = 0.024,
}: {
  text: string;
  as?: TagName;
  className?: string;
  delay?: number;
  stagger?: number;
} & Omit<HTMLAttributes<HTMLElement>, "children">) {
  const Tag = TAGS[as];
  const reduced = useReducedMotion();

  if (reduced) {
    const StaticTag = as;
    return (
      <StaticTag className={className} aria-label={text}>
        {text}
      </StaticTag>
    );
  }

  const container: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
  };
  const char: Variants = {
    hidden: { y: "1.05em", opacity: 0 },
    visible: {
      y: "0em",
      opacity: 1,
      transition: { duration: 0.7, ease: EASE },
    },
  };

  // Group characters into words so line breaks never split a word.
  const words = text.split(" ");

  return (
    <Tag
      className={className}
      initial="hidden"
      animate="visible"
      variants={container}
      aria-label={text}
    >
      {words.map((word, wi) => (
        <span
          key={`${word}-${wi}`}
          className="inline-block whitespace-nowrap"
          aria-hidden="true"
        >
          {word.split("").map((character, ci) => (
            <motion.span
              key={`${character}-${ci}`}
              variants={char}
              className="inline-block will-change-transform"
            >
              {character}
            </motion.span>
          ))}
          {wi < words.length - 1 && "\u00A0"}
        </span>
      ))}
    </Tag>
  );
}
