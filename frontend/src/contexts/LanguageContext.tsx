// Context provider pour la gestion de la langue
// Permet de basculer entre FR et EN dans toute l'application

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { Locale } from '@/types';
import frTranslations from '@/locales/fr.json';
import enTranslations from '@/locales/en.json';

// Type pour les traductions
type Translations = typeof frTranslations;

// Contenu des traductions par locale
const translations: Record<Locale, Translations> = {
  fr: frTranslations,
  en: enTranslations,
};

// Interface du contexte
interface LanguageContextType {
  locale: Locale;
  t: Translations;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

// Création du contexte
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Clés des drapeaux par locale
const FLAGS: Record<Locale, string> = {
  fr: '🇫🇷',
  en: '🇬🇧',
};

// Props du provider
interface LanguageProviderProps {
  children: ReactNode;
  initialLocale?: Locale;
}

/**
 * Provider de langue pour OpenProvena
 * Gère la locale active et les traductions
 */
export function LanguageProvider({ children, initialLocale = 'fr' }: LanguageProviderProps) {
  // État de la locale active.
  // La locale initiale vient du routing i18n de Next.js (préfixe d'URL),
  // ce qui garantit la cohérence entre l'URL et le contenu affiché.
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  /**
   * Change la locale et met à jour l'attribut HTML
   */
  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    // Met à jour l'attribut lang du document pour l'accessibilité
    document.documentElement.lang = newLocale;
    // Stocke la préférence en localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('openprovena-locale', newLocale);
    }
  }, []);

  /**
   * Bascule entre FR et EN
   */
  const toggleLocale = useCallback(() => {
    const newLocale = locale === 'fr' ? 'en' : 'fr';
    setLocale(newLocale);
  }, [locale, setLocale]);

  // Valeur du contexte
  const contextValue: LanguageContextType = {
    locale,
    t: translations[locale],
    setLocale,
    toggleLocale,
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * Hook pour utiliser le contexte de langue
 */
export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

/**
 * Hook pour les traductions - version simplifiée
 * @param key - Chemin de la clé (ex: 'nav.home')
 */
export function useTranslation() {
  const { t, locale } = useLanguage();

  /**
   * Obtient une traduction par clé
   */
  const getTranslation = useCallback(
    (key: string): string => {
      const keys = key.split('.');
      // @ts-expect-error - Navigation dynamique dans l'objet
      let value: unknown = keys.reduce((obj, k) => obj?.[k], t);
      // Retourne la clé elle-même si non trouvée
      return typeof value === 'string' ? value : key;
    },
    [t]
  );

  return {
    t: getTranslation,
    locale,
    translations: t,
    isRTL: false, // Français et anglais sont LTR
    flags: FLAGS,
  };
}

export { FLAGS };
