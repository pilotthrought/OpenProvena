// _app.tsx - Point d'entrée de l'application Next.js
// Configure le provider de langue et le layout global

import type { AppProps } from 'next/app';
import { LanguageProvider } from '@/contexts/LanguageContext';
import '@/styles/globals.css';

/**
 * Composant App principal
 * Enveloppe l'application avec les providers globaux
 */
export default function App({ Component, pageProps }: AppProps) {
  return (
    <LanguageProvider initialLocale={pageProps.locale || 'fr'}>
      <Component {...pageProps} />
    </LanguageProvider>
  );
}
