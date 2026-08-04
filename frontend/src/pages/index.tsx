// Page d'accueil - Home
// Landing page principale d'OpenProvena

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import SearchBar from '@/components/SearchBar';
import FeatureCard, { HOME_FEATURES } from '@/components/FeatureCard';
import TrustScore from '@/components/TrustScore';
import { useLanguage } from '@/contexts/LanguageContext';
import type { TrustAnalysis } from '@/types';

/**
 * Données de démonstration pour le hero
 */
const DEMO_SCORES = [
  { domain: 'lemonde.fr', score: 85, level: 'high' as const },
  { domain: 'wikipedia.org', score: 92, level: 'very_high' as const },
  { domain: 'twitter.com', score: 45, level: 'medium' as const },
];

/**
 * Statistiques de démonstration
 */
const STATS = [
  { value: '50M+', label: 'Sources analysées' },
  { value: '10K+', label: 'Utilisateurs actifs' },
  { value: '99.9%', label: 'Disponibilité' },
  { value: '50+', label: 'Signaux de confiance' },
];

/**
 * Page d'accueil principale
 */
export default function HomePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<TrustAnalysis | null>(null);

  /**
   * Gère la soumission de la recherche
   */
  const handleSearch = useCallback(async (query: string) => {
    setIsSearching(true);
    
    try {
      // Redirige vers la page de résultats avec la query
      router.push({
        pathname: '/search',
        query: { q: query },
      });
    } catch (error) {
      console.error('Search error:', error);
      setIsSearching(false);
    }
  }, [router]);

  return (
    <Layout>
      <SEO />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 via-white to-white">
        {/* Background pattern décoratif */}
        <div className="absolute inset-0 opacity-30">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e5e7eb" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>
        
        <div className="relative container-main py-20 md:py-32">
          {/* Badge d'introduction */}
          <div className="flex justify-center mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-secondary-200 text-sm font-medium text-secondary-700">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              Plateforme Open Source
            </span>
          </div>
          
          {/* Titre principal */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-center text-secondary-900 mb-6 tracking-tight">
            {t.hero.title.split(' ').slice(0, -2).join(' ')}{' '}
            <span className="text-primary-600">l'information</span>
          </h1>
          
          {/* Sous-titre */}
          <p className="text-xl md:text-2xl text-secondary-600 text-center max-w-3xl mx-auto mb-12 leading-relaxed">
            {t.hero.subtitle}
          </p>
          
          {/* Barre de recherche */}
          <div className="max-w-3xl mx-auto mb-16">
            <SearchBar
              onSearch={handleSearch}
              isLoading={isSearching}
              size="large"
            />
          </div>
          
          {/* Scores de démonstration */}
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            {DEMO_SCORES.map((item) => (
              <div key={item.domain} className="flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2 shadow-sm border border-secondary-100">
                <TrustScore score={item.score} trustLevel={item.level} showLabel={false} showBadge={false} size="small" />
                <div>
                  <p className="font-medium text-secondary-900">{item.domain}</p>
                  <p className="text-xs text-secondary-500">Score: {item.score}/100</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Wave décoratif */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container-main">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-4xl md:text-5xl font-bold text-primary-600 mb-2">
                  {stat.value}
                </p>
                <p className="text-secondary-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-secondary-50">
        <div className="container-main">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
              {t.hero.features_title}
            </h2>
            <div className="divider-gradient mx-auto mb-6"></div>
            <p className="text-xl text-secondary-600 max-w-2xl mx-auto">
              Des outils puissants pour analyser et comprendre la crédibilité de l'information
            </p>
          </div>
          
          <div className="grid-cards">
            {HOME_FEATURES.map((feature) => (
              <FeatureCard
                key={feature.id}
                title={feature.title}
                description={feature.description}
                icon={feature.icon}
                link={feature.link}
              />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="container-main">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
              Comment ça marche ?
            </h2>
            <div className="divider-gradient mx-auto"></div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Étape 1 */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-primary-100 rounded-2xl flex items-center justify-center text-primary-600 text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-3">
                Saisissez une URL
              </h3>
              <p className="text-secondary-600">
                Entrez l'adresse du site ou de l'article que vous souhaitez analyser
              </p>
            </div>
            
            {/* Étape 2 */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-primary-100 rounded-2xl flex items-center justify-center text-primary-600 text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-3">
                Analyse automatique
              </h3>
              <p className="text-secondary-600">
                Notre système examine plus de 50 signaux de confiance en temps réel
              </p>
            </div>
            
            {/* Étape 3 */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-primary-100 rounded-2xl flex items-center justify-center text-primary-600 text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-3">
                Résultat transparent
              </h3>
              <p className="text-secondary-600">
                Obtenez un score détaillé avec des explications claires et des sources
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-700">
        <div className="container-main text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Prêt à vérifier vos sources ?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Rejoignez des milliers d'utilisateurs qui font confiance à OpenProvena pour évaluer l'information
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => router.push('/search')}
              className="px-8 py-4 bg-white text-primary-700 font-semibold rounded-xl hover:bg-primary-50 transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              Commencer maintenant
            </button>
            <a
              href="https://github.com/openprovena/openprovena"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-primary-800 text-white font-semibold rounded-xl hover:bg-primary-900 transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              Voir sur GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Open Source Section */}
      <section className="py-20 bg-secondary-900 text-white">
        <div className="container-main">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">
                100% Open Source
              </h2>
              <p className="text-secondary-300 mb-6 leading-relaxed">
                OpenProvena est un projet communautaire maintenu par des chercheurs et développeurs du monde entier. 
                Tout le code est disponible, audité et contribue à l'amélioration de la transparence de l'information.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Code source sous licence MIT</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Algorithmes transparents et documentés</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Contributions communautaires bienvenues</span>
                </li>
              </ul>
            </div>
            <div className="flex justify-center">
              <div className="bg-secondary-800 rounded-2xl p-8 max-w-md">
                <div className="flex items-center gap-3 mb-4">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                  <span className="font-mono text-secondary-300">openprovena</span>
                </div>
                <pre className="bg-secondary-900 rounded-lg p-4 text-sm font-mono text-emerald-400 overflow-x-auto">
{`git clone https://github.com/
  openprovena/openprovena

cd openprovena
docker-compose up`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
