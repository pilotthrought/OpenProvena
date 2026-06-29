"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { translations, type Locale } from "@/lib/i18n";

// ── Types ─────────────────────────────────────────────────────────────────

const LOCALES = [
  { code: "fr" as Locale, flag: "🇫🇷", label: "Français" },
  { code: "en" as Locale, flag: "🇬🇧", label: "English"  },
];

const STORAGE_KEY = "openprovena_locale";

// ── Custom event pour synchroniser la locale entre composants ─────────────
// (évite de dépendre du Context qui ne s'hydrate pas dans layout Server)

const LOCALE_EVENT = "openprovena:locale";

function dispatchLocaleChange(locale: Locale) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(LOCALE_EVENT, { detail: locale }));
    document.documentElement.lang = locale;
    try { localStorage.setItem(STORAGE_KEY, locale); } catch {}
  }
}

function readStoredLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "fr" || stored === "en") return stored;
  } catch {}
  return "fr";
}

// ── Hook utilisable par n'importe quel composant client ───────────────────

export function useAppLocale() {
  const [locale, setLocaleState] = useState<Locale>("fr");

  useEffect(() => {
    // Lire la locale stockée au montage
    setLocaleState(readStoredLocale());

    // Écouter les changements depuis le Masthead
    const handler = (e: Event) => {
      setLocaleState((e as CustomEvent<Locale>).detail);
    };
    window.addEventListener(LOCALE_EVENT, handler);
    return () => window.removeEventListener(LOCALE_EVENT, handler);
  }, []);

  const t = useCallback(
    (key: keyof typeof translations.fr) =>
      translations[locale][key] ?? translations.fr[key] ?? key,
    [locale]
  );

  return { locale, t };
}

// ── LanguagePicker ────────────────────────────────────────────────────────

function LanguagePicker() {
  const [locale, setLocaleState] = useState<Locale>("fr");
  const [open, setOpen]          = useState(false);
  const [mounted, setMounted]    = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Hydration : lire localStorage après montage client
  useEffect(() => {
    setLocaleState(readStoredLocale());
    setMounted(true);
  }, []);

  // Fermer au clic extérieur
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Écouter les changements d'autres composants
  useEffect(() => {
    const handler = (e: Event) => {
      setLocaleState((e as CustomEvent<Locale>).detail);
    };
    window.addEventListener(LOCALE_EVENT, handler);
    return () => window.removeEventListener(LOCALE_EVENT, handler);
  }, []);

  function handleSelect(code: Locale) {
    setLocaleState(code);
    dispatchLocaleChange(code);
    setOpen(false);
  }

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  // Rendu stable côté serveur (SSR) → bouton placeholder
  // Le vrai contenu apparaît après hydration client
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={clsx(
          "flex items-center gap-2 border border-ink px-3 py-1.5",
          "font-mono text-[11px] font-medium tracking-wide uppercase",
          "hover:bg-ink hover:text-off-white transition-colors select-none",
          open && "bg-ink text-off-white"
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
        title="Changer la langue / Change language"
        suppressHydrationWarning
      >
        {/* Toujours rendu — flag + code + chevron */}
        <span className="text-[15px] leading-none" suppressHydrationWarning>
          {mounted ? current.flag : "🌐"}
        </span>
        <span suppressHydrationWarning>
          {mounted ? current.code : "FR"}
        </span>
        <svg
          width="8" height="5" viewBox="0 0 8 5" fill="none"
          className={clsx("transition-transform duration-150", open && "rotate-180")}
          aria-hidden
        >
          <path
            d="M1 1l3 3 3-3"
            stroke="currentColor" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Dropdown — uniquement après hydration */}
      {mounted && open && (
        <div
          className="absolute right-0 top-[calc(100%+4px)] z-50 bg-white border border-ink min-w-[140px]"
          style={{ boxShadow: "2px 4px 12px rgba(0,0,0,0.12)" }}
          role="listbox"
        >
          {LOCALES.map((l) => {
            const active = locale === l.code;
            return (
              <button
                key={l.code}
                onClick={() => handleSelect(l.code)}
                className={clsx(
                  "w-full flex items-center gap-2.5 px-3 py-2.5 text-left",
                  "font-mono text-[11px] tracking-wide uppercase transition-colors",
                  active
                    ? "bg-ink text-off-white"
                    : "text-ink hover:bg-[#f0ede6]"
                )}
                role="option"
                aria-selected={active}
              >
                <span className="text-[15px] leading-none">{l.flag}</span>
                <span className="font-medium">{l.code}</span>
                <span
                  className={clsx(
                    "ml-auto text-[10px] normal-case tracking-normal font-sans",
                    active ? "opacity-80" : "opacity-50"
                  )}
                >
                  {l.label}
                </span>
                {active && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden>
                    <path
                      d="M1 4l3 3 5-6"
                      stroke="currentColor" strokeWidth="1.5"
                      strokeLinecap="round" strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Masthead ──────────────────────────────────────────────────────────────

export function Masthead() {
  const pathname = usePathname();
  const { t }    = useAppLocale();

  const NAV = [
    { href: "/",           labelFr: "Trust Search",    labelEn: "Trust Search"   },
    { href: "/dashboard",  labelFr: "Tableau de bord", labelEn: "Dashboard"      },
    { href: "/narratives", labelFr: "Narratives",      labelEn: "Narratives"     },
    { href: "/api-docs",   labelFr: "API",             labelEn: "API"            },
  ] as const;

  return (
    <header className="border-b-2 border-ink px-6">

      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between py-3">
        <span className="font-mono text-[10px] tracking-widest text-muted uppercase">
          {t("masthead.since")}
        </span>

        <Link
          href="/"
          className="font-serif text-[28px] font-semibold tracking-tight text-[#0a0a0a] no-underline"
        >
          OpenProvena
        </Link>

        <div className="flex items-center gap-3">
          {/* ← Bouton de traduction ← */}
          <LanguagePicker />
          <span className="font-mono text-[10px] tracking-widest text-muted uppercase">
            {t("masthead.version")}
          </span>
        </div>
      </div>

      {/* ── Tagline ───────────────────────────────────────────────────── */}
      <div className="border-t border-rule text-center py-1.5 font-mono text-[10px] tracking-[0.12em] text-muted uppercase">
        {t("masthead.tagline")}
      </div>

      {/* ── Nav ───────────────────────────────────────────────────────── */}
      <nav className="flex border-t border-rule">
        {NAV.map(({ href, labelFr, labelEn }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "px-4 py-2.5 text-xs font-medium tracking-wider no-underline transition-colors",
                active
                  ? "border-b-2 border-ink text-ink"
                  : "border-b-2 border-transparent text-muted hover:text-ink"
              )}
            >
              {t("nav.search") === "Trust Search" ? labelFr : labelEn}
            </Link>
          );
        })}
      </nav>

    </header>
  );
}
