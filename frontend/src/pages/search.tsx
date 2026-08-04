// Page de recherche - Search
// Affiche les résultats d'analyse d'une URL ou d'un domaine

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import SearchBar from '@/components/SearchBar';
import TrustScore, { TrustBar } from '@/components/TrustScore';
import { useLanguage } from '@/contexts/LanguageContext';
import type { TrustAnalysis, TrustSignal } from '@/types';

/**
 * Mock data pour démonstration
 * En production, ces données viendraient de l'API
 */
const MOCK_ANALYSIS: TrustAnalysis = {
  id: '1',
  url: 'https://example.com',
  domain: 'example.com',
  score: 78,
  trustLevel: 'high',
  category: 'educational',
  domainAge: 3650,
  registrationDate: '2015-01-01',
  lastUpdated: '2024-01-15',
  owner: 'Example Organization',
  registrar: 'GoDaddy',
  aiGeneratedProbability: 12,
  contentQuality: 85,
  factCheckOverlap: 45,
  citationQuality: 72,
  signals: [
    { id: '1', name: 'Domain Age', description: 'Old domain', value: 95, weight: 0.15, category: 'infrastructure', source: 'WHOIS', timestamp: '2024-01-15' },
    { id: '2', name: 'HTTPS Enabled', description: 'Secure connection', value: 100, weight: 0.1, category: 'security', source: 'SSL Labs', timestamp: '2024-01-15' },
    { id: '3', name: 'Author Transparency', description: 'Clear authorship', value: 80, weight: 0.12, category: 'content', source: 'Content Analysis', timestamp: '2024-01-15' },
    { id: '4', name: 'Citation Quality', description: 'Well-sourced content', value: 75, weight: 0.1, category: 'content', source: 'NLP Analysis', timestamp: '2024-01-15' },
    { id: '5', name: 'AI Detection', description: 'Likely human-written', value: 88, weight: 0.08, category: 'content', source: 'AI Detector', timestamp: '2024-01-15' },
  ],
  relatedDomains: [
    { domain: 'subdomain.example.com', score: 82, relationship: 'subdomain' },
    { domain: 'related.org', score: 65, relationship: 'sibling' },
  ],
  historicalScores: [
    { date: '2024-01', score: 78, change: 0 },
    { date: '2023-12', score: 76, change: 2 },
    { date: '2023-11', score: 74, change: 2 },
    { date: '2023-10', score: 75, change: -1 },
  ],
  analyzedAt: new Date().toISOString(),
  confidence: 92,
  explanation: 'This domain shows strong indicators of trustworthiness based on multiple factors including domain age, security practices, and content quality.',
  recommendations: [
    'Content appears well-researched with proper citations',
    'Consider verifying specific claims with primary sources',
    'Cross-reference with other trusted sources for sensitive topics',
  ],
};

/**
 * Composant pour afficher un signal individuel
 */
function SignalCard({ signal }: { signal: TrustSignal }) {
  const { t } = useLanguage();
  
  return (
    <div className="bg-secondary-50 rounded-lg p-4 hover:bg-secondary-100 transition-colors duration-150">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-secondary-900">{signal.name}</h4>
        <span className="text-sm font-semibold text-primary-600">{Math.round(signal.value)}%</span>
      </div>
      <p className="text-sm text-secondary-600 mb-2">{signal.description}</p>
      <div className="flex items-center gap-2 text-xs text-secondary-500">
        <span className="px-2 py-1 bg-secondary-200 rounded">{signal.category}</span>
        <span>Source: {signal.source}</span>
      </div>
    </div>
  );
}

/**
 * Page de recherche et résultats
 */
export default function SearchPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<TrustAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'signals' | 'history'>('overview');

  // Récupère la query depuis l'URL au chargement
  useEffect(() => {
    const { q } = router.query;
    if (q && typeof q === 'string') {
      handleSearch(q);
    }
  }, [router.query]);

  /**
   * Gère la recherche
   */
  const handleSearch = useCallback(async (query: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // En production: appel API
      // const result = await trustApi.analyze({ url: query });
      
      // Simulation: attend un peu puis retourne le mock
      await new Promise(resolve => setTimeout(resolve, 1500));
      setAnalysis({ ...MOCK_ANALYSIS, url: query, domain: query.replace(/^https?:\/\//, '').split('/')[0] });
    } catch (err) {
      setError(t.errors.server_error);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  return (
    <Layout>
      <SEO 
        title={t.search.title}
        description={t.search.subtitle}
        canonical="/search"
      />
      
      {/* Header de recherche */}
      <section className="bg-gradient-to-b from-primary-50 to-white py-12">
        <div className="container-main">
          <h1 className="text-3xl font-bold text-secondary-900 text-center mb-2">
            {t.search.title}
          </h1>
          <p className="text-secondary-600 text-center mb-8">
            {t.search.subtitle}
          </p>
          
          <SearchBar
            onSearch={handleSearch}
            isLoading={isLoading}
            autoFocus
          />
        </div>
      </section>

      {/* Contenu principal */}
      <section className="container-main py-12">
        {/* État de chargement */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4"></div>
            <p className="text-secondary-600">{t.search.analyzing}</p>
          </div>
        )}

        {/* État d'erreur */}
        {error && !isLoading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-red-700 font-medium mb-2">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800 underline"
            >
              {t.common.close}
            </button>
          </div>
        )}

        {/* Résultats */}
        {!isLoading && !error && analysis && (
          <div className="animate-fade-in">
            {/* En-tête du résultat */}
            <div className="bg-white rounded-2xl shadow-card p-8 mb-8">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                {/* Score principal */}
                <TrustScore 
                  score={analysis.score} 
                  trustLevel={analysis.trustLevel}
                  size="large"
                />
                
                {/* Info du domaine */}
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-secondary-900 mb-2">
                    {analysis.domain}
                  </h2>
                  <p className="text-secondary-600 mb-4">{analysis.url}</p>
                  
                  {/* Métadonnées */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-secondary-500 block">{t.results.category}</span>
                      <span className="font-medium text-secondary-900 capitalize">
                        {t.categories[analysis.category as keyof typeof t.categories] || analysis.category}
                      </span>
                    </div>
                    <div>
                      <span className="text-secondary-500 block">{t.results.registered_date}</span>
                      <span className="font-medium text-secondary-900">{analysis.registrationDate}</span>
                    </div>
                    <div>
                      <span className="text-secondary-500 block">Domain Age</span>
                      <span className="font-medium text-secondary-900">{Math.round(analysis.domainAge / 365)} ans</span>
                    </div>
                    <div>
                      <span className="text-secondary-500 block">{t.results.ai_generated_probability}</span>
                      <span className="font-medium text-secondary-900">{analysis.aiGeneratedProbability}%</span>
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex gap-2">
                  <button className="btn-secondary flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    {t.results.share_results}
                  </button>
                  <button className="btn-ghost flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {t.results.report_issue}
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs de navigation */}
            <div className="border-b border-secondary-200 mb-8">
              <nav className="flex gap-8">
                {(['overview', 'signals', 'history'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-4 px-2 font-medium transition-colors duration-150 border-b-2 ${
                      activeTab === tab
                        ? 'text-primary-600 border-primary-600'
                        : 'text-secondary-600 border-transparent hover:text-secondary-900'
                    }`}
                  >
                    {tab === 'overview' && 'Vue d\'ensemble'}
                    {tab === 'signals' && t.results.signals}
                    {tab === 'history' && t.results.historical_data}
                  </button>
                ))}
              </nav>
            </div>

            {/* Contenu des tabs */}
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Colonne principale */}
              <div className="lg:col-span-2 space-y-8">
                {/* Vue d'ensemble */}
                {activeTab === 'overview' && (
                  <>
                    {/* Explication */}
                    <div className="card-elevated p-6">
                      <h3 className="font-semibold text-secondary-900 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {t.results.explanation}
                      </h3>
                      <p className="text-secondary-600 leading-relaxed">
                        {analysis.explanation}
                      </p>
                    </div>

                    {/* Indicateurs de qualité */}
                    <div className="card-elevated p-6">
                      <h3 className="font-semibold text-secondary-900 mb-4">Indicateurs clés</h3>
                      <div className="space-y-4">
                        <TrustBar score={analysis.contentQuality} label="Qualité du contenu" />
                        <TrustBar score={analysis.citationQuality} label="Qualité des citations" />
                        <TrustBar score={analysis.factCheckOverlap} label="Correspondance fact-checks" />
                      </div>
                    </div>

                    {/* Recommandations */}
                    <div className="card-elevated p-6">
                      <h3 className="font-semibold text-secondary-900 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {t.results.recommendations}
                      </h3>
                      <ul className="space-y-2">
                        {analysis.recommendations.map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-secondary-600">
                            <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}

                {/* Signaux */}
                {activeTab === 'signals' && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {analysis.signals.map((signal) => (
                      <SignalCard key={signal.id} signal={signal} />
                    ))}
                  </div>
                )}

                {/* Historique */}
                {activeTab === 'history' && (
                  <div className="card-elevated p-6">
                    <h3 className="font-semibold text-secondary-900 mb-4">Évolution du score</h3>
                    <div className="space-y-3">
                      {analysis.historicalScores.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                          <span className="text-secondary-600">{item.date}</span>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-secondary-900">{item.score}/100</span>
                            <span className={`text-sm ${item.change > 0 ? 'text-emerald-600' : item.change < 0 ? 'text-red-600' : 'text-secondary-400'}`}>
                              {item.change > 0 ? '+' : ''}{item.change}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Sources connexes */}
                <div className="card-elevated p-6">
                  <h3 className="font-semibold text-secondary-900 mb-4">{t.results.related_sources}</h3>
                  <div className="space-y-3">
                    {analysis.relatedDomains.map((domain, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg hover:bg-secondary-100 transition-colors cursor-pointer">
                        <div>
                          <p className="font-medium text-secondary-900">{domain.domain}</p>
                          <p className="text-xs text-secondary-500">{domain.relationship}</p>
                        </div>
                        <span className="font-semibold text-primary-600">{domain.score}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Confiance de l'analyse */}
                <div className="card-elevated p-6">
                  <h3 className="font-semibold text-secondary-900 mb-2">Confiance de l'analyse</h3>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="h-2 bg-secondary-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary-500 rounded-full"
                          style={{ width: `${analysis.confidence}%` }}
                        />
                      </div>
                    </div>
                    <span className="font-semibold text-secondary-900">{analysis.confidence}%</span>
                  </div>
                  <p className="text-sm text-secondary-500 mt-2">
                    Ce score reflète la certitude de notre analyse basée sur les données disponibles.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* État initial - pas de recherche */}
        {!isLoading && !error && !analysis && (
          <div className="text-center py-20">
            <svg className="w-24 h-24 text-secondary-300 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-secondary-500 text-lg">
              Entrez une URL ou un domaine ci-dessus pour commencer l'analyse
            </p>
          </div>
        )}
      </section>
    </Layout>
  );
}
