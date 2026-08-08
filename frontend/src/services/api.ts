/**
 * Service API pour OpenProvena
 * Gère les appels vers le backend FastAPI
 */

import type { TrustAnalysis } from '@/types';

// URL de l'API backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

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
    return data as TrustAnalysis;
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
    
    return await response.json();
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
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
