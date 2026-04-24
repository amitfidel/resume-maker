"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { locales, translate, type Locale } from "./dictionary";

type Ctx = {
  locale: Locale;
  setLocale: (v: Locale) => void;
  t: (key: string) => string;
  dir: "ltr" | "rtl";
};

const I18nContext = createContext<Ctx | null>(null);

const STORAGE_KEY = "resumi.locale.v1";

/**
 * Read the initial locale synchronously from localStorage to avoid a flash of
 * English on reload. In SSR we default to "en"; hydration will reconcile.
 */
function initialLocale(): Locale {
  if (typeof window === "undefined") return "en";
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && (locales as readonly string[]).includes(raw)) return raw as Locale;
  } catch {}
  return "en";
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    setLocaleState(initialLocale());
    setHydrated(true);
  }, []);

  // Apply lang + dir + persist whenever locale changes (post-hydration)
  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    root.lang = locale;
    root.dir = locale === "he" ? "rtl" : "ltr";
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {}
  }, [locale, hydrated]);

  const ctx: Ctx = {
    locale,
    setLocale: (v) => setLocaleState(v),
    t: (key) => translate(locale, key),
    dir: locale === "he" ? "rtl" : "ltr",
  };

  return <I18nContext.Provider value={ctx}>{children}</I18nContext.Provider>;
}

export function useI18n(): Ctx {
  const v = useContext(I18nContext);
  if (!v) throw new Error("useI18n must be used within I18nProvider");
  return v;
}

/** Convenience: just the `t` function. */
export function useT() {
  return useI18n().t;
}
