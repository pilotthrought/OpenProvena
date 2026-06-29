"""
/v1/trust — Trust Score endpoints.
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.db.session import get_db
from app.schemas import TrustScoreRequest, TrustScoreResponse
from app.models import Domain
from app.services.trust_orchestrator import TrustOrchestrator
from app.core.security import get_optional_user

router = APIRouter()


@router.get(
    "",
    response_model=TrustScoreResponse,
    summary="Analyze a domain's trustworthiness",
    description="""
Computes a Trust Score (0–100) for a given domain by running 10 independent
signal agents concurrently. Results are cached for 1 hour.

**Tiers:**
- `HIGH` ≥ 70 — Reliable source
- `MEDIUM` 45–70 — Mixed signals
- `LOW` 25–45 — Significant concerns
- `CRITICAL` < 25 — High-risk source
    """,
)
async def get_trust_score(
    domain: str = Query(..., description="Domain to analyze (e.g. lemonde.fr)", examples=["lemonde.fr"]),
    signals: str = Query("all", description="Comma-separated signal names, or 'all'"),
    explain: bool = Query(True, description="Include per-signal breakdown"),
    force_refresh: bool = Query(False, description="Bypass cache"),
    db: AsyncSession = Depends(get_db),
    user: Optional[dict] = Depends(get_optional_user),
):
    # Validate + clean domain
    import re
    domain = re.sub(r"^https?://", "", domain.strip().lower()).split("/")[0]
    if not re.match(r"^[a-z0-9][a-z0-9\-\.]{1,253}[a-z0-9]$", domain):
        raise HTTPException(status_code=422, detail="Invalid domain format.")

    orchestrator = TrustOrchestrator(db)
    return await orchestrator.analyze(
        domain=domain,
        signal_filter=signals,
        explain=explain,
        force_refresh=force_refresh,
    )


@router.post("", response_model=TrustScoreResponse, summary="Analyze (POST body)")
async def post_trust_score(
    request: TrustScoreRequest,
    db: AsyncSession = Depends(get_db),
    user: Optional[dict] = Depends(get_optional_user),
):
    orchestrator = TrustOrchestrator(db)
    return await orchestrator.analyze(
        domain=request.domain,
        signal_filter=request.signals,
        explain=request.explain,
        force_refresh=request.force_refresh,
    )


@router.get("/batch", summary="Batch analyze multiple domains")
async def batch_trust_score(
    domains: str = Query(..., description="Comma-separated list of domains (max 20)"),
    explain: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_optional_user),
):
    domain_list = [d.strip() for d in domains.split(",")][:20]
    if not domain_list:
        raise HTTPException(status_code=422, detail="No domains provided.")

    orchestrator = TrustOrchestrator(db)
    import asyncio
    results = await asyncio.gather(
        *[orchestrator.analyze(d, explain=explain) for d in domain_list],
        return_exceptions=True,
    )

    return {
        "results": [
            r if not isinstance(r, Exception) else {"domain": d, "error": str(r)}
            for d, r in zip(domain_list, results)
        ],
        "count": len(domain_list),
    }


@router.get("/history/{domain}", summary="Historical scores for a domain")
async def get_history(
    domain: str,
    limit: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Domain).where(Domain.id == domain).limit(1)
    )
    domain_obj = result.scalar_one_or_none()
    if not domain_obj:
        raise HTTPException(status_code=404, detail=f"Domain {domain!r} not found in index.")

    return {
        "domain": domain,
        "current_score": domain_obj.trust_score,
        "tier": domain_obj.tier,
        "last_analyzed": domain_obj.last_analyzed,
        "note": "Full historical time-series available in ClickHouse (enterprise tier).",
    }
