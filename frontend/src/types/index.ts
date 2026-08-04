// Types TypeScript pour OpenProvena
// Définit toutes les interfaces et types utilisés dans l'application

// ============================================
// Types de base
// ============================================

/**
 * Niveau de confiance d'une source
 */
export type TrustLevel = 'very_high' | 'high' | 'medium' | 'low' | 'very_low' | 'unknown';

/**
 * Catégorie d'une source
 */
export type SourceCategory = 'news' | 'blog' | 'government' | 'educational' | 'corporate' | 'social' | 'forum' | 'other';

/**
 * Type de nœud dans le graphe de connaissances
 */
export type GraphNodeType = 'domain' | 'author' | 'organization' | 'claim' | 'narrative';

/**
 * Locale supportée
 */
export type Locale = 'fr' | 'en';

// ============================================
// Types pour l'API et les réponses
// ============================================

/**
 * Signal de confiance détecté
 */
export interface TrustSignal {
  id: string;
  name: string;
  description: string;
  value: number;
  weight: number;
  category: string;
  source: string;
  timestamp: string;
}

/**
 * Analyse complète d'une source
 */
export interface TrustAnalysis {
  id: string;
  url: string;
  domain: string;
  score: number;
  trustLevel: TrustLevel;
  category: SourceCategory;
  
  // Métadonnées du domaine
  domainAge: number;
  registrationDate: string;
  lastUpdated: string;
  owner?: string;
  registrar?: string;
  
  // Analyse du contenu
  aiGeneratedProbability: number;
  contentQuality: number;
  factCheckOverlap: number;
  citationQuality: number;
  
  // Signaux détectés
  signals: TrustSignal[];
  
  // Relations
  relatedDomains: RelatedDomain[];
  historicalScores: HistoricalScore[];
  
  // Métadonnées
  analyzedAt: string;
  confidence: number;
  explanation: string;
  recommendations: string[];
}

/**
 * Domaine apparenté
 */
export interface RelatedDomain {
  domain: string;
  score: number;
  relationship: string;
  url?: string;
}

/**
 * Score historique
 */
export interface HistoricalScore {
  date: string;
  score: number;
  change: number;
}

// ============================================
// Types pour le graphe de connaissances
// ============================================

/**
 * Nœud du graphe
 */
export interface GraphNode {
  id: string;
  type: GraphNodeType;
  label: string;
  score?: number;
  properties: Record<string, unknown>;
}

/**
 * Arête du graphe
 */
export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  weight: number;
  properties: Record<string, unknown>;
}

/**
 * Graphe complet
 */
export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: {
    totalNodes: number;
    totalEdges: number;
    lastUpdated: string;
  };
}

// ============================================
// Types pour le suivi des narratifs
// ============================================

/**
 * Narratif détecté
 */
export interface Narrative {
  id: string;
  title: string;
  description: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  spreadScore: number;
  reach: number;
  velocity: number;
  firstSeen: string;
  lastUpdated: string;
  sources: string[];
  relatedClaims: string[];
  visualization: NarrativeVisualization;
}

/**
 * Données de visualisation pour un narratif
 */
export interface NarrativeVisualization {
  timeline: TimelinePoint[];
  geographicSpread: GeoPoint[];
  sourceNetwork: SourceConnection[];
}

/**
 * Point sur la timeline
 */
export interface TimelinePoint {
  date: string;
  mentions: number;
  sentiment: number;
}

/**
 * Point géographique
 */
export interface GeoPoint {
  country: string;
  code: string;
  mentions: number;
}

/**
 * Connexion entre sources
 */
export interface SourceConnection {
  source: string;
  target: string;
  strength: number;
}

// ============================================
// Types pour le dashboard
// ============================================

/**
 * Statistiques globales
 */
export interface DashboardStats {
  totalAnalyses: number;
  avgTrustScore: number;
  sourcesMonitored: number;
  activeUsers: number;
  trends: TrendData;
}

/**
 * Données de tendance
 */
export interface TrendData {
  analysesTrend: number;
  scoreTrend: number;
  sourcesTrend: number;
  usersTrend: number;
}

/**
 * Analyse récente
 */
export interface RecentAnalysis {
  id: string;
  domain: string;
  score: number;
  analyzedAt: string;
  thumbnail?: string;
}

// ============================================
// Types pour l'authentification
// ============================================

/**
 * Utilisateur
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  preferences: UserPreferences;
  createdAt: string;
}

/**
 * Rôle utilisateur
 */
export type UserRole = 'viewer' | 'analyst' | 'admin' | 'moderator';

/**
 * Préférences utilisateur
 */
export interface UserPreferences {
  locale: Locale;
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  dashboardLayout: string;
}

// ============================================
// Types pour les requêtes API
// ============================================

/**
 * Requête d'analyse
 */
export interface AnalyzeRequest {
  url?: string;
  domain?: string;
  keywords?: string;
  includeSignals?: boolean;
  includeGraph?: boolean;
  includeHistory?: boolean;
}

/**
 * Options de recherche
 */
export interface SearchOptions {
  query: string;
  filters?: SearchFilters;
  pagination?: PaginationOptions;
  sort?: SortOptions;
}

/**
 * Filtres de recherche
 */
export interface SearchFilters {
  trustLevel?: TrustLevel[];
  category?: SourceCategory[];
  dateRange?: DateRange;
  aiGenerated?: boolean;
}

/**
 * Options de pagination
 */
export interface PaginationOptions {
  page: number;
  limit: number;
}

/**
 * Options de tri
 */
export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * Plage de dates
 */
export interface DateRange {
  start: string;
  end: string;
}

// ============================================
// Types pour les réponses paginées
// ============================================

/**
 * Réponse paginée
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  meta?: Record<string, unknown>;
}

// ============================================
// Types pour les erreurs
// ============================================

/**
 * Erreur API
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

// ============================================
// Types utilitaires
// ============================================

/**
 * État de chargement
 */
export interface LoadingState {
  isLoading: boolean;
  error: ApiError | null;
  data: unknown | null;
}

/**
 * Options de configuration
 */
export interface ConfigOptions {
  apiUrl: string;
  apiVersion: string;
  timeout: number;
  retries: number;
}
