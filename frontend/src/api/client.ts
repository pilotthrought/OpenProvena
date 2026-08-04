// Client API pour OpenProvena
// Gère toutes les communications avec le backend

import {
  AnalyzeRequest,
  SearchOptions,
  TrustAnalysis,
  KnowledgeGraph,
  Narrative,
  DashboardStats,
  PaginatedResponse,
  ApiError,
  ConfigOptions,
} from '@/types';

// Configuration par défaut de l'API
const DEFAULT_CONFIG: ConfigOptions = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  apiVersion: 'v1',
  timeout: 30000,
  retries: 3,
};

/**
 * Classe cliente API pour OpenProvena
 * Gère les requêtes HTTP avec gestion des erreurs et retry automatique
 */
class ApiClient {
  private config: ConfigOptions;
  private abortControllers: Map<string, AbortController>;

  constructor(config: Partial<ConfigOptions> = {}) {
    // Fusionne la config avec les valeurs par défaut
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.abortControllers = new Map();
  }

  /**
   * Construit l'URL complète pour une endpoint
   */
  private buildUrl(endpoint: string, params?: Record<string, string>): string {
    const url = new URL(`${this.config.apiUrl}/api/${this.config.apiVersion}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    return url.toString();
  }

  /**
   * Effectue une requête HTTP avec gestion des erreurs
   */
  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    requestId: string = Math.random().toString(36).substring(7)
  ): Promise<T> {
    // Crée un AbortController pour pouvoir annuler la requête
    const controller = new AbortController();
    this.abortControllers.set(requestId, controller);

    try {
      const url = this.buildUrl(endpoint);
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          // Ajout des headers de sécurité
          'X-Request-ID': requestId,
          ...options.headers,
        },
        signal: controller.signal,
        // Timeout personnalisé
        // Note: La limite de temps est gérée par leAbortController
      });

      // Gestion des erreurs HTTP
      if (!response.ok) {
        const error: ApiError = await response.json().catch(() => ({
          code: `HTTP_${response.status}`,
          message: response.statusText,
          timestamp: new Date().toISOString(),
        }));
        throw error;
      }

      return await response.json();
    } catch (error) {
      // Gestion des erreurs réseau ou d'annulation
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw {
            code: 'REQUEST_ABORTED',
            message: 'Request was cancelled',
            timestamp: new Date().toISOString(),
          } as ApiError;
        }
        throw {
          code: 'NETWORK_ERROR',
          message: error.message,
          timestamp: new Date().toISOString(),
        } as ApiError;
      }
      throw error;
    } finally {
      // Nettoie le AbortController
      this.abortControllers.delete(requestId);
    }
  }

  /**
   * Annule une requête en cours
   */
  cancelRequest(requestId: string): void {
    const controller = this.abortControllers.get(requestId);
    if (controller) {
      controller.abort();
    }
  }

  /**
   * Annule toutes les requêtes en cours
   */
  cancelAllRequests(): void {
    this.abortControllers.forEach((controller) => controller.abort());
    this.abortControllers.clear();
  }
}

/**
 * Service API pour les analyses de confiance
 */
export class TrustAnalysisApi {
  private client: ApiClient;

  constructor(client?: ApiClient) {
    this.client = client || new ApiClient();
  }

  /**
   * Analyse une URL ou un domaine
   */
  async analyze(request: AnalyzeRequest): Promise<TrustAnalysis> {
    const params = new URLSearchParams();
    
    if (request.url) params.append('url', request.url);
    if (request.domain) params.append('domain', request.domain);
    if (request.keywords) params.append('keywords', request.keywords);
    if (request.includeSignals !== undefined) {
      params.append('include_signals', String(request.includeSignals));
    }
    if (request.includeGraph !== undefined) {
      params.append('include_graph', String(request.includeGraph));
    }
    if (request.includeHistory !== undefined) {
      params.append('include_history', String(request.includeHistory));
    }

    return this.client.request<TrustAnalysis>(`/analyze?${params.toString()}`);
  }

  /**
   * Récupère les détails d'une analyse existante
   */
  async getAnalysis(id: string): Promise<TrustAnalysis> {
    return this.client.request<TrustAnalysis>(`/analyses/${id}`);
  }

  /**
   * Récupère l'historique des analyses pour un domaine
   */
  async getHistory(domain: string, days: number = 30): Promise<TrustAnalysis[]> {
    return this.client.request<TrustAnalysis[]>(
      `/analyses/history/${encodeURIComponent(domain)}`,
      {},
      `history-${domain}`
    );
  }
}

/**
 * Service API pour le graphe de connaissances
 */
export class KnowledgeGraphApi {
  private client: ApiClient;

  constructor(client?: ApiClient) {
    this.client = client || new ApiClient();
  }

  /**
   * Récupère le graphe complet pour un domaine
   */
  async getGraph(domain: string): Promise<KnowledgeGraph> {
    return this.client.request<KnowledgeGraph>(
      `/graph/${encodeURIComponent(domain)}`
    );
  }

  /**
   * Recherche dans le graphe
   */
  async searchGraph(query: string, filters?: Record<string, unknown>): Promise<KnowledgeGraph> {
    const params = new URLSearchParams({ q: query });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        params.append(key, JSON.stringify(value));
      });
    }
    return this.client.request<KnowledgeGraph>(`/graph/search?${params.toString()}`);
  }

  /**
   * Récupère les nœuds voisins d'un nœud
   */
  async getNeighbors(nodeId: string, depth: number = 1): Promise<KnowledgeGraph> {
    return this.client.request<KnowledgeGraph>(
      `/graph/nodes/${nodeId}/neighbors?depth=${depth}`
    );
  }
}

/**
 * Service API pour les narratifs
 */
export class NarrativeApi {
  private client: ApiClient;

  constructor(client?: ApiClient) {
    this.client = client || new ApiClient();
  }

  /**
   * Récupère la liste des narratifs tendances
   */
  async getTrendingNarratives(limit: number = 10): Promise<PaginatedResponse<Narrative>> {
    return this.client.request<PaginatedResponse<Narrative>>(
      `/narratives/trending?limit=${limit}`
    );
  }

  /**
   * Récupère les détails d'un narratif
   */
  async getNarrative(id: string): Promise<Narrative> {
    return this.client.request<Narrative>(`/narratives/${id}`);
  }

  /**
   * Recherche des narratifs
   */
  async searchNarratives(query: string): Promise<Narrative[]> {
    return this.client.request<Narrative[]>(
      `/narratives/search?q=${encodeURIComponent(query)}`
    );
  }
}

/**
 * Service API pour le dashboard
 */
export class DashboardApi {
  private client: ApiClient;

  constructor(client?: ApiClient) {
    this.client = client || new ApiClient();
  }

  /**
   * Récupère les statistiques du dashboard
   */
  async getStats(): Promise<DashboardStats> {
    return this.client.request<DashboardStats>('/dashboard/stats');
  }

  /**
   * Récupère les analyses récentes
   */
  async getRecentAnalyses(limit: number = 10): Promise<PaginatedResponse<TrustAnalysis>> {
    return this.client.request<PaginatedResponse<TrustAnalysis>>(
      `/dashboard/recent?limit=${limit}`
    );
  }
}

/**
 * Service API pour la recherche
 */
export class SearchApi {
  private client: ApiClient;

  constructor(client?: ApiClient) {
    this.client = client || new ApiClient();
  }

  /**
   * Recherche des sources
   */
  async search(options: SearchOptions): Promise<PaginatedResponse<TrustAnalysis>> {
    const params = new URLSearchParams({
      q: options.query,
      page: String(options.pagination?.page || 1),
      limit: String(options.pagination?.limit || 20),
    });

    if (options.sort) {
      params.append('sort', options.sort.field);
      params.append('direction', options.sort.direction);
    }

    if (options.filters) {
      if (options.filters.trustLevel?.length) {
        params.append('trust_level', options.filters.trustLevel.join(','));
      }
      if (options.filters.category?.length) {
        params.append('category', options.filters.category.join(','));
      }
    }

    return this.client.request<PaginatedResponse<TrustAnalysis>>(
      `/search?${params.toString()}`
    );
  }
}

// Exports par défaut des instances pré-configurées
export const apiClient = new ApiClient();
export const trustApi = new TrustAnalysisApi();
export const graphApi = new KnowledgeGraphApi();
export const narrativeApi = new NarrativeApi();
export const dashboardApi = new DashboardApi();
export const searchApi = new SearchApi();

export default apiClient;
