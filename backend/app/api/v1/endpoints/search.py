"""Search endpoint — /v1/search"""
from fastapi import APIRouter, Query, Depends
from app.schemas import SearchResponse, SearchResult, PaginationMeta
from app.core.security import get_optional_user
import time

router = APIRouter()

@router.get("", response_model=SearchResponse)
async def search(
    q: str = Query(..., min_length=2, description="Search query"),
    tier: str = Query(None, description="Filter by tier: HIGH, MEDIUM, LOW, CRITICAL"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    user=Depends(get_optional_user),
):
    """
    Full-text search across the domain index.
    Backed by Elasticsearch — returns domains matching query with their trust scores.
    """
    start = time.perf_counter()
    # Stub: real implementation queries Elasticsearch
    mock_results = [
        SearchResult(domain="lemonde.fr",  trust_score=78.0, tier="HIGH",     snippet="Journal de référence français…", score=0.95),
        SearchResult(domain="lefigaro.fr", trust_score=71.0, tier="HIGH",     snippet="Quotidien national conservateur…", score=0.88),
        SearchResult(domain="mediapart.fr",trust_score=69.0, tier="MEDIUM",   snippet="Média d'investigation indépendant…", score=0.82),
    ]
    if tier:
        mock_results = [r for r in mock_results if r.tier == tier.upper()]
    took = (time.perf_counter() - start) * 1000
    return SearchResponse(
        results=mock_results,
        meta=PaginationMeta(total=len(mock_results), page=page, per_page=per_page, pages=1),
        took_ms=round(took, 2),
    )
