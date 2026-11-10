"use client";

import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "atelier-theme";

const observers = new Set<() => void>();

function subscribe(callback: () => void) {
  observers.add(callback);
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributeFilter: ["class"] });
  return () => {
    observers.delete(callback);
    observer.disconnect();
  };
}

function getSnapshot(): Theme {
  return document.documentElement.classList.contains("dark")
    ? "dark"
    : "light";
}

/** The inline no-flash script resolves before hydration; SSR always renders
 * light-mode markup on field, so the server snapshot matches it. */
export function getServerTheme(): Theme {
  return "light";
}

/** Reads the class-based theme set by the layout's inline script and the
 * toggle. Updates arrive via MutationObserver — no effects, no cascades. */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, getSnapshot, getServerTheme);
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* private mode — theme simply won't persist */
  }
}
