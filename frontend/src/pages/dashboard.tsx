// Page Dashboard - Tableau de bord
// Affiche les statistiques et analyses récentes

import React from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import TrustScore from '@/components/TrustScore';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Données de démonstration pour le dashboard
 */
const STATS = {
  total_analyses: 1523456,
  avg_trust_score: 67.5,
  sources_monitored: 50000000,
  active_users: 10542,
  trends: {
    analyses_trend: 12.5,
    score_trend: 2.3,
    sources_trend: 8.7,
    users_trend: 15.2,
  },
};

/**
 * Analyses récentes de démonstration
 */
const RECENT_ANALYSES = [
  { id: '1', domain: 'lemonde.fr', score: 85, analyzed_at: '2024-01-15T10:30:00Z', category: 'news' },
  { id: '2', domain: 'wikipedia.org', score: 92, analyzed_at: '2024-01-15T10:25:00Z', category: 'educational' },
  { id: '3', domain: 'example-blog.com', score: 45, analyzed_at: '2024-01-15T10:20:00Z', category: 'blog' },
  { id: '4', domain: 'gov.fr', score: 88, analyzed_at: '2024-01-15T10:15:00Z', category: 'government' },
  { id: '5', domain: 'twitter.com', score: 42, analyzed_at: '2024-01-15T10:10:00Z', category: 'social' },
];

/**
 * Narratifs tendance
 */
const TRENDING_NARRATIVES = [
  { id: '1', title: 'Climate Change Policies', spread_score: 85, sources: 1250 },
  { id: '2', title: 'AI Regulation Debate', spread_score: 78, sources: 890 },
  { id: '3', title: 'Election Security', spread_score: 72, sources: 567 },
  { id: '4', title: 'Economic Recovery', spread_score: 68, sources: 423 },
];

/**
 * Formatte un nombre avec des séparateurs de milliers
 */
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * Formatte une date relative
 */
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  
  return date.toLocaleDateString('fr-FR');
}

/**
 * Page Dashboard
 */
export default function DashboardPage() {
  const { t } = useLanguage();

  return (
    <Layout>
      <SEO 
        title={t.dashboard.title}
        description="Tableau de bord OpenProvena - Statistiques et analyses récentes"
        canonical="/dashboard"
      />
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">
          {t.dashboard.title}
        </h1>
        <p className="text-secondary-600">
          {t.dashboard.overview}
        </p>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Analyses */}
        <div className="card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-secondary-500 mb-1">{t.dashboard.total_analyses}</p>
              <p className="text-3xl font-bold text-secondary-900">
                {formatNumber(STATS.total_analyses)}
              </p>
              <p className="text-sm text-emerald-600 mt-1 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                </svg>
                +{STATS.trends.analyses_trend}%
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Score moyen */}
        <div className="card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-secondary-500 mb-1">{t.dashboard.avg_trust_score}</p>
              <p className="text-3xl font-bold text-secondary-900">
                {STATS.avg_trust_score}%
              </p>
              <p className="text-sm text-emerald-600 mt-1 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                </svg>
                +{STATS.trends.score_trend}%
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Sources suivies */}
        <div className="card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-secondary-500 mb-1">{t.dashboard.sources_monitored}</p>
              <p className="text-3xl font-bold text-secondary-900">
                {formatNumber(STATS.sources_monitored)}
              </p>
              <p className="text-sm text-emerald-600 mt-1 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                </svg>
                +{STATS.trends.sources_trend}%
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
          </div>
        </div>

        {/* Utilisateurs actifs */}
        <div className="card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-secondary-500 mb-1">{t.dashboard.active_users}</p>
              <p className="text-3xl font-bold text-secondary-900">
                {formatNumber(STATS.active_users)}
              </p>
              <p className="text-sm text-emerald-600 mt-1 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                </svg>
                +{STATS.trends.users_trend}%
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Analyses récentes */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="p-6 border-b border-secondary-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-secondary-900">
                  {t.dashboard.recent_analyses}
                </h2>
                <Link 
                  href="/search"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Voir tout
                </Link>
              </div>
            </div>
            <div className="divide-y divide-secondary-200">
              {RECENT_ANALYSES.map((analysis) => (
                <div 
                  key={analysis.id}
                  className="p-4 hover:bg-secondary-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <TrustScore 
                        score={analysis.score} 
                        showLabel={false} 
                        showBadge={false}
                        size="small"
                      />
                      <div>
                        <p className="font-medium text-secondary-900">{analysis.domain}</p>
                        <p className="text-sm text-secondary-500 capitalize">
                          {analysis.category}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-secondary-500">
                        {formatRelativeTime(analysis.analyzed_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Narratifs tendance */}
          <div className="card">
            <div className="p-6 border-b border-secondary-200">
              <h2 className="text-lg font-semibold text-secondary-900">
                {t.dashboard.trending_narratives}
              </h2>
            </div>
            <div className="p-4 space-y-4">
              {TRENDING_NARRATIVES.map((narrative) => (
                <div key={narrative.id} className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-secondary-900">{narrative.title}</p>
                    <p className="text-sm text-secondary-500">{narrative.sources} sources</p>
                  </div>
                  <div className="ml-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      narrative.spread_score >= 80 ? 'bg-emerald-100 text-emerald-700' :
                      narrative.spread_score >= 60 ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {narrative.spread_score}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions rapides */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">
              Actions rapides
            </h2>
            <div className="space-y-3">
              <Link
                href="/search"
                className="flex items-center gap-3 p-3 rounded-lg bg-secondary-50 hover:bg-secondary-100 transition-colors"
              >
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-secondary-900">Nouvelle analyse</p>
                  <p className="text-sm text-secondary-500">Analyser une URL</p>
                </div>
              </Link>
              
              <Link
                href="/explorer"
                className="flex items-center gap-3 p-3 rounded-lg bg-secondary-50 hover:bg-secondary-100 transition-colors"
              >
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-secondary-900">Explorer le graphe</p>
                  <p className="text-sm text-secondary-500">Visualiser les relations</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
