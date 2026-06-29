"use client";

/**
 * LocaleProvider — wrapper de compatibilité.
 *
 * La locale est désormais gérée via CustomEvent + localStorage dans Masthead.tsx
 * (useAppLocale). Ce provider reste pour les pages qui importent useLocale(),
 * mais il écoute les mêmes événements pour rester synchronisé.
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { translations, type Locale, type TranslationKey } from "@/lib/i18n";

const STORAGE_KEY  = "openprovena_locale";
const LOCALE_EVENT = "openprovena:locale";

function readLocale(): Locale {
  if (typeof window === "undefined") return "fr";
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s === "fr" || s === "en") return s;
  } catch {}
  return "fr";
}

interface LocaleCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey) => string;
}

const LocaleContext = createContext<LocaleCtx>({
  locale: "fr",
  setLocale: () => {},
  t: (k) => k,
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("fr");

  useEffect(() => {
    // Lire la valeur stockée au montage
    setLocaleState(readLocale());

    // Écouter les changements émis par LanguagePicker
    const handler = (e: Event) => {
      setLocaleState((e as CustomEvent<Locale>).detail);
    };
    window.addEventListener(LOCALE_EVENT, handler);
    return () => window.removeEventListener(LOCALE_EVENT, handler);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch {}
    document.documentElement.lang = l;
    window.dispatchEvent(new CustomEvent(LOCALE_EVENT, { detail: l }));
  }, []);

  const t = useCallback(
    (key: TranslationKey) =>
      translations[locale][key] ?? translations["fr"][key] ?? key,
    [locale]
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
