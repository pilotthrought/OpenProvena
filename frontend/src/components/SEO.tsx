// Composant SEO pour OpenProvena
// Gère les meta tags et le schema.org

import React from 'react';
import Head from 'next/head';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Locale } from '@/types';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  canonical?: string;
  locale?: Locale;
}

/**
 * Schéma Organization pour le Rich Snippet
 */
const ORGANIZATION_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'OpenProvena',
  url: 'https://openprovena.org',
  logo: 'https://openprovena.org/logo.png',
  description: 'Open standard for assessing information credibility',
  sameAs: [
    'https://github.com/openprovena/openprovena',
    'https://twitter.com/openprovena',
    'https://linkedin.com/company/openprovena',
  ],
};

/**
 * Schéma WebApplication
 */
const WEBAPP_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'OpenProvena',
  description: 'Open source platform for information credibility analysis',
  url: 'https://openprovena.org',
  applicationCategory: 'UtilityApplication',
  operatingSystem: 'Web Browser',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
};

/**
 * Composant SEO
 */
export default function SEO({
  title,
  description,
  keywords,
  ogImage = '/og-image.png',
  ogType = 'website',
  canonical,
  locale,
}: SEOProps) {
  const { t, locale: activeLocale } = useLanguage();
  const effectiveLocale = locale ?? activeLocale ?? 'fr';

  // Construit le titre complet
  const pageTitle = title 
    ? `${title} | OpenProvena`
    : t.meta.title;

  // Utilise les meta descriptions du contexte ou celles passées en props
  const metaDescription = description || t.meta.description;
  const metaKeywords = keywords || t.meta.keywords;

  // URL canonique complète
  const canonicalUrl = canonical 
    ? `https://openprovena.org${canonical}`
    : 'https://openprovena.org';

  return (
    <Head>
      {/* Meta tags de base */}
      <title>{pageTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={metaKeywords} />
      <meta name="author" content="OpenProvena" />
      <meta name="robots" content="index, follow" />
      <meta name="language" content={effectiveLocale.toUpperCase()} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Open Graph */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content="OpenProvena" />
      <meta property="og:image" content={ogImage} />
      <meta property="og:locale" content={effectiveLocale === 'fr' ? 'fr_FR' : 'en_US'} />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@openprovena" />
      <meta name="twitter:creator" content="@openprovena" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* Favicon et icônes */}
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <link rel="icon" href="/icon.svg" type="image/svg+xml" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      
      {/* Theme color pour mobile */}
      <meta name="theme-color" content="#2563eb" />
      <meta name="msapplication-TileColor" content="#2563eb" />
      
      {/* Geo tags */}
      <meta name="geo.region" content="FR" />
      <meta name="geo.placename" content="OpenProvena" />
      
      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(ORGANIZATION_SCHEMA),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(WEBAPP_SCHEMA),
        }}
      />
      
      {/* Schema BreadcrumbList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: 'https://openprovena.org',
              },
              ...(canonical && canonical !== '/'
                ? [
                    {
                      '@type': 'ListItem',
                      position: 2,
                      name: pageTitle,
                      item: canonicalUrl,
                    },
                  ]
                : []),
            ],
          }),
        }}
      />
    </Head>
  );
}
