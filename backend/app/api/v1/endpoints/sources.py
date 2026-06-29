"""Source intelligence endpoint — /v1/sources"""
from fastapi import APIRouter, HTTPException
from app.schemas import SourceIntelligenceResponse
from datetime import datetime, timezone

router = APIRouter()

KNOWN = {
    "lemonde.fr": SourceIntelligenceResponse(domain="lemonde.fr",owner="Groupe Le Monde",registrant_country="FR",registered_at=datetime(1995,6,1,tzinfo=timezone.utc),domain_age_days=10958,ssl_valid=True,related_domains=["lemondediplomatique.fr","telerama.fr","courrier international.com"],editorial_notes="Charte de Munich signée. Société des rédacteurs active.",funding_transparency="Actionnariat public — rapport annuel disponible.",fact_check_references=["AFP Factuel","Les Décodeurs"]),
    "rt.com": SourceIntelligenceResponse(domain="rt.com",owner="ANO TV-Novosti (Gouvernement russe)",registrant_country="RU",registered_at=datetime(2005,12,10,tzinfo=timezone.utc),domain_age_days=7057,ssl_valid=True,related_domains=["ruptly.tv","rt.fr","rt.de"],editorial_notes="Aucune charte éditoriale publiée. Direction nommée par décret présidentiel.",funding_transparency="Budget d'État russe — montants non publiés.",fact_check_references=["EUvsDisinfo","Bellingcat","AFP Factuel"]),
}

@router.get("/{domain}", response_model=SourceIntelligenceResponse)
async def get_source_intelligence(domain: str):
    """Return ownership, editorial, and relationship data for a domain."""
    if domain in KNOWN:
        return KNOWN[domain]
    return SourceIntelligenceResponse(
        domain=domain,
        owner=None,
        registrant_country=None,
        registered_at=None,
        domain_age_days=None,
        ssl_valid=None,
        editorial_notes="Données non disponibles dans l'index actuel.",
        funding_transparency=None,
        fact_check_references=[],
    )
