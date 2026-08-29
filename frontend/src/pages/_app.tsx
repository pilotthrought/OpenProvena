// _app.tsx - Point d'entrée de l'application Next.js
// Configure le provider de langue et le layout global

import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { LanguageProvider } from '@/contexts/LanguageContext';
import type { Locale } from '@/types';
import '@/styles/globals.css';

/**
 * Composant App principal
 * Enveloppe l'application avec les providers globaux
 */
export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  // La locale active provient du routing i18n de Next.js (préfixe d'URL)
  const locale = (router.locale as Locale) || pageProps.locale || 'fr';

  return (
    <LanguageProvider initialLocale={locale}>
      <Component {...pageProps} />
    </LanguageProvider>
  );
}
