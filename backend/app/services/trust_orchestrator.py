"""
TrustOrchestrator — coordinates all 10 signal agents, computes weighted score,
caches in Redis, persists to PostgreSQL.
"""

import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Optional

import redis.asyncio as aioredis
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.schemas import TrustScoreResponse, SignalDetail
from app.models import Domain, SignalResult
from app.agents import ALL_AGENTS

logger = logging.getLogger("openprovena")

TIER_THRESHOLDS = {
    "HIGH":     (70, 100),
    "MEDIUM":   (45, 70),
    "LOW":      (25, 45),
    "CRITICAL": (0,  25),
}


def score_to_tier(score: float) -> str:
    for tier, (lo, hi) in TIER_THRESHOLDS.items():
        if lo <= score <= hi:
            return tier
    return "CRITICAL"


class TrustOrchestrator:
    def __init__(self, db: AsyncSession):
        self.db = db
        self._redis: Optional[aioredis.Redis] = None

    async def _get_redis(self) -> aioredis.Redis:
        if not self._redis:
            self._redis = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
        return self._redis

    async def _get_cached(self, domain: str) -> Optional[TrustScoreResponse]:
        try:
            r = await self._get_redis()
            data = await r.get(f"trust:{domain}")
            if data:
                result = TrustScoreResponse(**json.loads(data))
                result.cached = True
                return result
        except Exception as e:
            logger.warning(f"Redis cache read failed: {e}")
        return None

    async def _set_cache(self, domain: str, result: TrustScoreResponse):
        try:
            r = await self._get_redis()
            await r.setex(
                f"trust:{domain}",
                settings.CACHE_TTL_TRUST_SCORE,
                result.model_dump_json(),
            )
        except Exception as e:
            logger.warning(f"Redis cache write failed: {e}")

    async def analyze(
        self,
        domain: str,
        signal_filter: str = "all",
        explain: bool = True,
        force_refresh: bool = False,
    ) -> TrustScoreResponse:
        if not force_refresh:
            cached = await self._get_cached(domain)
            if cached:
                logger.debug(f"Cache hit: {domain}")
                return cached

        logger.info(f"Analyzing: {domain}")

        weights = settings.SIGNAL_WEIGHTS

        # Run all agents concurrently — fail-open on individual errors
        tasks = [agent(domain).run() for agent in ALL_AGENTS]
        raw_results = await asyncio.gather(*tasks, return_exceptions=True)

        signal_details = []
        total_weighted = 0.0
        total_weight = 0.0
        confidence_sum = 0.0

        for agent_class, result in zip(ALL_AGENTS, raw_results):
            signal_name = agent_class.SIGNAL_NAME
            weight = weights.get(signal_name, 0.0)

            if isinstance(result, Exception):
                logger.error(f"Agent {signal_name} raised: {result}")
                norm_score, detail, confidence = 50.0, "Signal indisponible — fallback neutre.", 0.3
            else:
                norm_score = float(result.get("score", 50.0))
                detail = result.get("detail", "")
                confidence = float(result.get("confidence", 0.7))

            if signal_filter != "all" and signal_name not in signal_filter.split(","):
                continue

            weighted = norm_score * weight
            total_weighted += weighted
            total_weight += weight
            confidence_sum += confidence * weight

            if explain:
                signal_details.append(SignalDetail(
                    signal_name=signal_name,
                    normalized_score=round(norm_score, 1),
                    weight=weight,
                    weighted_score=round(weighted, 2),
                    detail=detail,
                    confidence=round(confidence, 3),
                ))

        trust_score = round(
            min(max((total_weighted / total_weight) if total_weight > 0 else 50.0, 0), 100), 1
        )
        avg_confidence = round(
            (confidence_sum / total_weight) if total_weight > 0 else 0.5, 3
        )
        tier = score_to_tier(trust_score)
        now = datetime.now(timezone.utc)

        response = TrustScoreResponse(
            domain=domain,
            trust_score=trust_score,
            confidence=avg_confidence,
            tier=tier,
            signals=signal_details,
            summary=_generate_summary(domain, trust_score, tier, signal_details),
            last_analyzed=now,
            cached=False,
        )

        await _persist(self.db, domain, response, signal_details)
        await self._set_cache(domain, response)
        return response


def _generate_summary(domain: str, score: float, tier: str, signals: list) -> str:
    top_neg = sorted([s for s in signals if s.normalized_score < 50], key=lambda x: x.normalized_score)
    top_pos = sorted([s for s in signals if s.normalized_score >= 70], key=lambda x: -x.normalized_score)

    if tier == "HIGH":
        base = f"{domain} présente des indicateurs de fiabilité élevés (score {score}/100)"
    elif tier == "MEDIUM":
        base = f"{domain} présente une fiabilité modérée (score {score}/100)"
    elif tier == "LOW":
        base = f"{domain} présente des signaux préoccupants (score {score}/100)"
    else:
        base = f"{domain} présente de multiples alertes critiques (score {score}/100)"

    if top_neg:
        names = ", ".join(s.signal_name.replace("_", " ") for s in top_neg[:2])
        base += f". Points faibles : {names}."
    if top_pos:
        names = ", ".join(s.signal_name.replace("_", " ") for s in top_pos[:2])
        base += f" Points forts : {names}."
    return base


async def _persist(db: AsyncSession, domain: str, response: TrustScoreResponse, signals: list):
    try:
        existing = await db.get(Domain, domain)
        if existing:
            existing.trust_score = response.trust_score
            existing.confidence = response.confidence
            existing.tier = response.tier
            existing.last_analyzed = response.last_analyzed
        else:
            db.add(Domain(
                id=domain,
                name=domain,
                trust_score=response.trust_score,
                confidence=response.confidence,
                tier=response.tier,
                last_analyzed=response.last_analyzed,
            ))

        for s in signals:
            db.add(SignalResult(
                domain_id=domain,
                signal_name=s.signal_name,
                normalized_score=s.normalized_score,
                weight=s.weight,
                weighted_score=s.weighted_score,
                detail=s.detail,
                confidence=s.confidence,
            ))

        await db.commit()
    except Exception as e:
        logger.error(f"Persistence failed for {domain}: {e}")
        await db.rollback()
