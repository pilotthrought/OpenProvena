"""Narratives endpoint — /v1/narratives"""
from fastapi import APIRouter, Query, Depends
from app.schemas import NarrativeListResponse, NarrativeResponse, PaginationMeta
from app.core.security import get_optional_user
from datetime import datetime, timezone

router = APIRouter()

MOCK_NARRATIVES = [
    NarrativeResponse(id="n1", title="Désinformation vaccins COVID booster",description="Cluster de 142 domaines relayant des affirmations non vérifiées sur les rappels vaccinaux.",velocity="fast",trend="rising",source_count=142,domain_cluster=["rt.com","sputniknews.com"],tags=["santé","vaccins","covid"],detected_at=datetime(2025,5,28,tzinfo=timezone.utc),updated_at=datetime(2025,6,1,tzinfo=timezone.utc)),
    NarrativeResponse(id="n2",title="Manipulation résultats élections européennes",description="Narratif remettant en cause le dépouillement électronique dans 4 pays membres.",velocity="moderate",trend="stable",source_count=67,domain_cluster=["breitbart.com"],tags=["élections","europe","démocratie"],detected_at=datetime(2025,5,15,tzinfo=timezone.utc),updated_at=datetime(2025,5,31,tzinfo=timezone.utc)),
    NarrativeResponse(id="n3",title="Climatoscepticisme industriel",description="Résurgence de contenus niant le consensus scientifique sur le réchauffement climatique.",velocity="slow",trend="declining",source_count=89,domain_cluster=[],tags=["climat","environnement"],detected_at=datetime(2025,4,10,tzinfo=timezone.utc),updated_at=datetime(2025,5,20,tzinfo=timezone.utc)),
]

router = APIRouter()

@router.get("", response_model=NarrativeListResponse)
async def list_narratives(
    velocity: str = Query(None, description="Filter: fast, moderate, slow"),
    trend: str = Query(None, description="Filter: rising, stable, declining"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
    user=Depends(get_optional_user),
):
    items = MOCK_NARRATIVES
    if velocity:
        items = [n for n in items if n.velocity == velocity]
    if trend:
        items = [n for n in items if n.trend == trend]
    return NarrativeListResponse(items=items, meta=PaginationMeta(total=len(items),page=page,per_page=per_page,pages=1))

@router.get("/{narrative_id}", response_model=NarrativeResponse)
async def get_narrative(narrative_id: str):
    hit = next((n for n in MOCK_NARRATIVES if n.id == narrative_id), None)
    from fastapi import HTTPException
    if not hit:
        raise HTTPException(status_code=404, detail="Narrative not found.")
    return hit
