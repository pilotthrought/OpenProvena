"""
Celery tasks — async domain analysis pipeline.
"""

import asyncio
from app.worker import celery_app


@celery_app.task(name="app.tasks.analyze_domain", bind=True, max_retries=3)
def analyze_domain(self, domain: str):
    """Re-analyze a domain asynchronously and update the DB."""
    try:
        from app.services.trust_orchestrator import TrustOrchestrator
        from app.db.session import AsyncSessionLocal

        async def _run():
            async with AsyncSessionLocal() as db:
                orch = TrustOrchestrator(db)
                return await orch.analyze(domain, force_refresh=True)

        result = asyncio.run(_run())
        return {"domain": domain, "trust_score": result.trust_score, "tier": result.tier}
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)


@celery_app.task(name="app.tasks.crawl_domain")
def crawl_domain(domain: str):
    """Placeholder for future web crawler task."""
    return {"domain": domain, "status": "queued"}
