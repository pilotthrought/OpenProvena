"""
Endpoints API principaux pour OpenProvena
Chaque module gère un domaine fonctionnel de l'API
"""

from fastapi import APIRouter, Query, HTTPException
from app.services.analysis import analyzer

# ============================================
# Health Check
# ============================================

health = APIRouter()


@health.get("/health")
async def health_check():
    """Vérification de l'état du service"""
    return {
        "status": "healthy",
        "service": "openprovena-api",
        "version": "1.0.0"
    }


@health.get("/health/ready")
async def readiness_check():
    """Vérification que le service est prêt à recevoir des requêtes"""
    return {
        "ready": True,
        "checks": {
            "database": "ok",
            "cache": "ok",
            "ml_models": "ok"
        }
    }


# ============================================
# Trust Analysis
# ============================================

analyze = APIRouter()


@analyze.get("/analyze")
async def analyze_url(
    url: str | None = Query(None, description="URL à analyser"),
    domain: str | None = Query(None, description="Domaine à analyser"),
):
    """
    Analyse la confiance d'une URL ou d'un domaine
    
    Returns:
        TrustAnalysis: Analyse complète avec score et signaux
    """
    # Valide qu'au moins un paramètre est fourni
    if not url and not domain:
        raise HTTPException(
            status_code=400, 
            detail="Veuillez fournir soit une URL soit un domaine à analyser"
        )
    
    # Utilise l'analyseur de confiance
    target = url or domain
    result = await analyzer.analyze(target)
    
    return result


@analyze.get("/analyses/{analysis_id}")
async def get_analysis(analysis_id: str):
    """Récupère une analyse existante par son ID"""
    return {
        "id": analysis_id,
        "status": "completed",
        "message": "Analysis retrieved successfully"
    }


@analyze.get("/analyses/history/{domain}")
async def get_domain_history(domain: str, days: int = 30):
    """Récupère l'historique des analyses pour un domaine"""
    return []


# ============================================
# Search
# ============================================

search = APIRouter()


@search.get("/search")
async def search_sources(
    q: str,
    page: int = 1,
    limit: int = 20,
    trust_level: str | None = None,
    category: str | None = None,
    sort: str = "score",
    direction: str = "desc"
):
    """
    Recherche des sources par mots-clés
    
    Returns:
        PaginatedResponse: Liste paginée de sources
    """
    # Mock response
    return {
        "data": [
            {
                "id": "1",
                "domain": "lemonde.fr",
                "score": 85,
                "trust_level": "high",
                "category": "news"
            },
            {
                "id": "2",
                "domain": "wikipedia.org",
                "score": 92,
                "trust_level": "very_high",
                "category": "educational"
            }
        ],
        "pagination": {
            "page": page,
            "limit": limit,
            "total": 100,
            "total_pages": 5
        }
    }


# ============================================
# Dashboard
# ============================================

dashboard = APIRouter()


@dashboard.get("/dashboard/stats")
async def get_dashboard_stats():
    """Récupère les statistiques du dashboard"""
    return {
        "total_analyses": 1500000,
        "avg_trust_score": 67.5,
        "sources_monitored": 50000000,
        "active_users": 10500,
        "trends": {
            "analyses_trend": 12.5,
            "score_trend": 2.3,
            "sources_trend": 8.7,
            "users_trend": 15.2
        }
    }


@dashboard.get("/dashboard/recent")
async def get_recent_analyses(limit: int = 10):
    """Récupère les analyses récentes"""
    return {
        "data": [
            {
                "id": "1",
                "domain": "example.com",
                "score": 78,
                "analyzed_at": "2024-01-15T10:00:00Z"
            }
        ],
        "pagination": {
            "page": 1,
            "limit": limit,
            "total": 1,
            "total_pages": 1
        }
    }


# ============================================
# Narratives
# ============================================

narratives = APIRouter()


@narratives.get("/narratives/trending")
async def get_trending_narratives(limit: int = 10):
    """Récupère les narratifs tendances"""
    return {
        "data": [
            {
                "id": "1",
                "title": "Climate Change Awareness",
                "description": "Growing discussion about climate policies",
                "sentiment": "neutral",
                "spread_score": 85,
                "reach": 5000000,
                "velocity": 2.5
            }
        ],
        "pagination": {
            "page": 1,
            "limit": limit,
            "total": 1,
            "total_pages": 1
        }
    }


@narratives.get("/narratives/{narrative_id}")
async def get_narrative(narrative_id: str):
    """Récupère les détails d'un narratif"""
    return {
        "id": narrative_id,
        "title": "Sample Narrative",
        "description": "Details about this narrative",
        "sentiment": "neutral",
        "spread_score": 75,
        "reach": 1000000,
        "velocity": 1.8,
        "sources": ["source1.com", "source2.com"],
        "related_claims": ["claim1", "claim2"],
        "visualization": {
            "timeline": [],
            "geographic_spread": [],
            "source_network": []
        }
    }


@narratives.get("/narratives/search")
async def search_narratives(q: str):
    """Recherche des narratifs"""
    return []


# ============================================
# Knowledge Graph
# ============================================

graph = APIRouter()


@graph.get("/graph/{domain}")
async def get_domain_graph(domain: str):
    """Récupère le graphe de relations pour un domaine"""
    return {
        "nodes": [
            {
                "id": "1",
                "type": "domain",
                "label": domain,
                "score": 78
            }
        ],
        "edges": [],
        "metadata": {
            "total_nodes": 1,
            "total_edges": 0,
            "last_updated": "2024-01-15T10:00:00Z"
        }
    }


@graph.get("/graph/search")
async def search_graph(q: str, depth: int = 1):
    """Recherche dans le graphe de connaissances"""
    return {
        "nodes": [],
        "edges": [],
        "metadata": {
            "total_nodes": 0,
            "total_edges": 0,
            "last_updated": "2024-01-15T10:00:00Z"
        }
    }


@graph.get("/graph/nodes/{node_id}/neighbors")
async def get_node_neighbors(node_id: str, depth: int = 1):
    """Récupère les voisins d'un nœud dans le graphe"""
    return {
        "nodes": [],
        "edges": [],
        "metadata": {
            "total_nodes": 0,
            "total_edges": 0,
            "last_updated": "2024-01-15T10:00:00Z"
        }
    }
