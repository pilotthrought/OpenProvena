// Composant Header pour OpenProvena
// Barre de navigation avec sélecteur de langue

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useLanguage, FLAGS } from '@/contexts/LanguageContext';
import frTranslations from '@/locales/fr.json';
import type { Locale } from '@/types';

/**
 * Résout une clé de traduction (ex: 'nav.home') dans l'objet de traductions
 */
function resolveLabel(t: typeof frTranslations, key: string): string {
  // @ts-expect-error - Navigation dynamique dans l'objet
  const value = key.split('.').reduce((obj, k) => obj?.[k], t);
  return typeof value === 'string' ? value : key;
}

/**
 * Données de navigation
 */
const NAV_ITEMS = [
  { key: 'nav.home', href: '/' },
  { key: 'nav.search', href: '/search' },
  { key: 'nav.explorer', href: '/explorer' },
  { key: 'nav.dashboard', href: '/dashboard' },
  { key: 'nav.about', href: '/about' },
];

/**
 * Composant Header principal
 * Inclut navigation, logo et sélecteur de langue
 */
export default function Header() {
  const router = useRouter();
  const { locale, setLocale, t } = useLanguage();
  
  // État pour le menu mobile et le dropdown de langue
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  
  // Ref pour le dropdown de langue (détection clic extérieur)
  const langDropdownRef = useRef<HTMLDivElement>(null);

  // Ferme le dropdown quand on clique à l'extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangDropdownOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Gestion du changement de langue
   */
  const handleLanguageChange = (newLocale: Locale) => {
    setLocale(newLocale);
    setIsLangDropdownOpen(false);
    // Met à jour l'URL avec la nouvelle locale pour garantir la cohérence
    // entre le contenu affiché et le préfixe de route i18n.
    router.push({ pathname: router.pathname, query: router.query }, undefined, {
      locale: newLocale,
    });
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-secondary-200">
      {/* Navigation principale */}
      <nav className="container-main" role="navigation" aria-label="Main navigation">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo et titre */}
          <Link href="/" className="flex items-center gap-3 group">
            {/* Icône logo (bouclier) */}
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-md">
              <svg 
                className="w-6 h-6 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" 
                />
              </svg>
            </div>
            {/* Texte du logo */}
            <div className="flex flex-col">
              <span className="text-xl font-bold text-secondary-900 tracking-tight">
                OpenProvena
              </span>
              <span className="text-xs text-secondary-500 hidden lg:block">
                {t.meta.title.split('-')[1]?.trim() || 'Trust Infrastructure'}
              </span>
            </div>
          </Link>

          {/* Navigation desktop */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className="nav-link"
              >
                {resolveLabel(t, item.key)}
              </Link>
            ))}
          </div>

          {/* Actions droite (langue + GitHub) */}
          <div className="flex items-center gap-2">
            
            {/* Sélecteur de langue */}
            <div 
              ref={langDropdownRef}
              className="relative"
            >
              <button
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary-100 transition-colors duration-150"
                aria-label={t.accessibility.language_selector}
                aria-expanded={isLangDropdownOpen}
                aria-haspopup="listbox"
              >
                <span className="text-xl" aria-hidden="true">{FLAGS[locale]}</span>
                <span className="text-sm font-medium text-secondary-700 uppercase">
                  {locale}
                </span>
                <svg 
                  className={`w-4 h-4 text-secondary-500 transition-transform duration-200 ${isLangDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown de langue */}
              {isLangDropdownOpen && (
                <div 
                  className="lang-dropdown animate-fade-in"
                  role="listbox"
                  aria-label="Select language"
                >
                  <button
                    onClick={() => handleLanguageChange('fr')}
                    className={`lang-option ${locale === 'fr' ? 'bg-primary-50 text-primary-700' : ''}`}
                    role="option"
                    aria-selected={locale === 'fr'}
                  >
                    <span className="text-xl">🇫🇷</span>
                    <span>Français</span>
                    {locale === 'fr' && (
                      <svg className="w-4 h-4 ml-auto text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                  
                  <button
                    onClick={() => handleLanguageChange('en')}
                    className={`lang-option ${locale === 'en' ? 'bg-primary-50 text-primary-700' : ''}`}
                    role="option"
                    aria-selected={locale === 'en'}
                  >
                    <span className="text-xl">🇬🇧</span>
                    <span>English</span>
                    {locale === 'en' && (
                      <svg className="w-4 h-4 ml-auto text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Lien GitHub */}
            <a
              href="https://github.com/openprovena/openprovena"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary-100 transition-colors duration-150"
              aria-label={t.nav.github}
            >
              <svg className="w-5 h-5 text-secondary-700" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </a>

            {/* Bouton menu mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-secondary-100 transition-colors duration-150"
              aria-label={t.accessibility.menu_toggle}
              aria-expanded={isMobileMenuOpen}
            >
              <svg className="w-6 h-6 text-secondary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Menu mobile */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-secondary-200 animate-slide-up">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className="block py-3 px-4 text-secondary-700 hover:bg-secondary-50 hover:text-secondary-900 transition-colors duration-150"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {resolveLabel(t, item.key)}
              </Link>
            ))}
          </div>
        )}
      </nav>
    </header>
  );
}
