"""
Schémas Pydantic pour la validation des données API
Définit les modèles de requête et de réponse
"""

from datetime import datetime
from typing import List, Optional, Any
from enum import Enum

from pydantic import BaseModel, Field, HttpUrl, field_validator


# ============================================
# Énumérations
# ============================================

class TrustLevel(str, Enum):
    """Niveaux de confiance"""
    VERY_HIGH = "very_high"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    VERY_LOW = "very_low"
    UNKNOWN = "unknown"


class SourceCategory(str, Enum):
    """Catégories de sources"""
    NEWS = "news"
    BLOG = "blog"
    GOVERNMENT = "government"
    EDUCATIONAL = "educational"
    CORPORATE = "corporate"
    SOCIAL = "social"
    FORUM = "forum"
    OTHER = "other"


class SentimentType(str, Enum):
    """Types de sentiment"""
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"


# ============================================
# Schémas de requête
# ============================================

class AnalyzeRequest(BaseModel):
    """Requête d'analyse d'une URL ou domaine"""
    url: Optional[str] = Field(None, description="URL à analyser")
    domain: Optional[str] = Field(None, description="Domaine à analyser")
    keywords: Optional[str] = Field(None, description="Mots-clés de recherche")
    include_signals: bool = Field(True, description="Inclure les signaux détaillés")
    include_graph: bool = Field(False, description="Inclure le graphe de relations")
    include_history: bool = Field(False, description="Inclure l'historique")
    
    @field_validator('url', 'domain')
    @classmethod
    def validate_input(cls, v):
        """Valide que au moins un champ est rempli"""
        if v is not None:
            v = v.strip().lower()
            if len(v) > 2000:
                raise ValueError("Input too long (max 2000 characters)")
        return v


class SearchRequest(BaseModel):
    """Requête de recherche"""
    query: str = Field(..., min_length=1, max_length=500, description="Query de recherche")
    page: int = Field(1, ge=1, description="Numéro de page")
    limit: int = Field(20, ge=1, le=100, description="Résultats par page")
    trust_level: Optional[List[TrustLevel]] = Field(None, description="Filtrer par niveau")
    category: Optional[List[SourceCategory]] = Field(None, description="Filtrer par catégorie")
    sort: str = Field("score", description="Champ de tri")
    direction: str = Field("desc", pattern="^(asc|desc)$")


class GraphSearchRequest(BaseModel):
    """Requête de recherche dans le graphe"""
    query: str = Field(..., min_length=1, max_length=200)
    node_types: Optional[List[str]] = None
    depth: int = Field(1, ge=1, le=3)


# ============================================
# Schémas de réponse - Signaux
# ============================================

class TrustSignal(BaseModel):
    """Signal de confiance individuel"""
    id: str
    name: str
    description: str
    value: float = Field(..., ge=0, le=100)
    weight: float = Field(..., ge=0, le=1)
    category: str
    source: str
    timestamp: datetime


# ============================================
# Schémas de réponse - Analyse
# ============================================

class RelatedDomain(BaseModel):
    """Domaine apparenté"""
    domain: str
    score: int = Field(..., ge=0, le=100)
    relationship: str
    url: Optional[str] = None


class HistoricalScore(BaseModel):
    """Score historique"""
    date: str
    score: float = Field(..., ge=0, le=100)
    change: float


class TrustAnalysis(BaseModel):
    """Analyse complète de confiance"""
    id: str
    url: str
    domain: str
    score: float = Field(..., ge=0, le=100)
    trust_level: TrustLevel
    category: SourceCategory
    
    # Métadonnées du domaine
    domain_age: int = Field(..., description="Âge du domaine en jours")
    registration_date: Optional[str] = None
    last_updated: Optional[str] = None
    owner: Optional[str] = None
    registrar: Optional[str] = None
    
    # Analyse du contenu
    ai_generated_probability: float = Field(0, ge=0, le=100)
    content_quality: float = Field(0, ge=0, le=100)
    fact_check_overlap: float = Field(0, ge=0, le=100)
    citation_quality: float = Field(0, ge=0, le=100)
    
    # Signaux détectés
    signals: List[TrustSignal] = []
    
    # Relations
    related_domains: List[RelatedDomain] = []
    historical_scores: List[HistoricalScore] = []
    
    # Métadonnées
    analyzed_at: datetime
    confidence: float = Field(0, ge=0, le=100)
    explanation: str
    recommendations: List[str] = []
    
    class Config:
        from_attributes = True


# ============================================
# Schémas de réponse - Narratifs
# ============================================

class NarrativeVisualization(BaseModel):
    """Données de visualisation pour un narratif"""
    timeline: List[dict] = []
    geographic_spread: List[dict] = []
    source_network: List[dict] = []


class Narrative(BaseModel):
    """Narratif détecté"""
    id: str
    title: str
    description: str
    sentiment: SentimentType
    spread_score: float = Field(0, ge=0, le=100)
    reach: int
    velocity: float
    first_seen: datetime
    last_updated: datetime
    sources: List[str] = []
    related_claims: List[str] = []
    visualization: NarrativeVisualization


# ============================================
# Schémas de réponse - Dashboard
# ============================================

class TrendData(BaseModel):
    """Données de tendance"""
    analyses_trend: float
    score_trend: float
    sources_trend: float
    users_trend: float


class DashboardStats(BaseModel):
    """Statistiques du dashboard"""
    total_analyses: int
    avg_trust_score: float = Field(0, ge=0, le=100)
    sources_monitored: int
    active_users: int
    trends: TrendData


class RecentAnalysis(BaseModel):
    """Analyse récente"""
    id: str
    domain: str
    score: float
    analyzed_at: datetime
    thumbnail: Optional[str] = None


# ============================================
# Schémas de réponse - Pagination
# ============================================

class PaginationInfo(BaseModel):
    """Information de pagination"""
    page: int
    limit: int
    total: int
    total_pages: int


class PaginatedResponse(BaseModel):
    """Réponse paginée générique"""
    data: List[Any]
    pagination: PaginationInfo
    meta: Optional[dict] = None


# ============================================
# Schémas de réponse - Erreurs
# ============================================

class ApiError(BaseModel):
    """Erreur API standard"""
    code: str
    message: str
    details: Optional[dict] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ErrorResponse(BaseModel):
    """Réponse d'erreur"""
    error: ApiError
