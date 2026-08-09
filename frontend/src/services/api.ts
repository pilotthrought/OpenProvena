/**
 * Service API pour OpenProvena
 * Gère les appels vers le backend FastAPI
 */

import type { TrustAnalysis, TrustSignal, RelatedDomain, HistoricalScore } from '@/types';

// URL de l'API backend.
// En production (navigateur), on utilise un chemin relatif /api/v1 qui transite
// par nginx (reverse proxy) vers le backend. NEXT_PUBLIC_API_URL ne doit pas
// pointer vers une adresse Docker interne (ex: http://backend:8000) car le
// navigateur de l'utilisateur ne peut pas la résoudre.
const API_BASE_URL = '/api/v1';

/**
 * Convertit une chaîne snake_case en camelCase
 */
function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
}

/**
 * Mappe la réponse du backend (snake_case) vers le type frontend (camelCase)
 */
function mapAnalysisResponse(raw: Record<string, unknown>): TrustAnalysis {
  const mapped: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    mapped[toCamelCase(key)] = value;
  }

  const signals: TrustSignal[] = (mapped.signals as TrustSignal[]) || [];
  const relatedDomains: RelatedDomain[] = (mapped.relatedDomains as RelatedDomain[]) || [];
  const historicalScores: HistoricalScore[] = (mapped.historicalScores as HistoricalScore[]) || [];

  return {
    id: (mapped.id as string) || '',
    url: (mapped.url as string) || '',
    domain: (mapped.domain as string) || '',
    score: (mapped.score as number) || 0,
    trustLevel: (mapped.trustLevel as TrustAnalysis['trustLevel']) || 'unknown',
    category: (mapped.category as TrustAnalysis['category']) || 'other',
    domainAge: (mapped.domainAge as number) || 0,
    registrationDate: (mapped.registrationDate as string) || 'Inconnue',
    lastUpdated: (mapped.lastUpdated as string) || '',
    owner: (mapped.owner as string) || 'Inconnu',
    aiGeneratedProbability: (mapped.aiGeneratedProbability as number) || 0,
    contentQuality: (mapped.contentQuality as number) || 0,
    factCheckOverlap: (mapped.factCheckOverlap as number) || 0,
    citationQuality: (mapped.citationQuality as number) || 0,
    signals,
    relatedDomains,
    historicalScores,
    analyzedAt: (mapped.analyzedAt as string) || '',
    confidence: (mapped.confidence as number) || 0,
    explanation: (mapped.explanation as string) || '',
    recommendations: (mapped.recommendations as string[]) || [],
  };
}

/**
 * Appelle l'API d'analyse de confiance
 */
export async function analyzeUrl(url: string): Promise<TrustAnalysis> {
  try {
    const response = await fetch(`${API_BASE_URL}/analyze?url=${encodeURIComponent(url)}`);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return mapAnalysisResponse(data);
  } catch (error) {
    console.error('Analysis failed:', error);
    throw error;
  }
}

/**
 * Récupère une analyse par son ID
 */
export async function getAnalysis(analysisId: string): Promise<TrustAnalysis | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/analyses/${analysisId}`);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return mapAnalysisResponse(data);
  } catch (error) {
    console.error('Failed to fetch analysis:', error);
    return null;
  }
}

/**
 * Récupère l'historique d'un domaine
 */
export async function getDomainHistory(domain: string, days: number = 30): Promise<any[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/analyses/history/${domain}?days=${days}`);

    if (!response.ok) {
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch domain history:', error);
    return [];
  }
}

/**
 * Vérifie si l'API est disponible
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch('/health');
    return response.ok;
  } catch {
    return false;
  }
}
