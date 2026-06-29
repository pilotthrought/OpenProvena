"""
BaseAgent — shared interface and utilities for all signal agents.

Every agent:
  - Receives a domain string on init
  - Implements async run() → SignalResult dict
  - Has a deterministic _seed() fallback for graceful degradation
  - Respects a configurable TIMEOUT
  - Logs errors without raising (fail-open policy)
"""

from __future__ import annotations

import hashlib
import logging
import random
from typing import Any, Optional

import httpx

logger = logging.getLogger("openprovena.agents")


class SignalResult(dict):
    """
    Typed dict returned by every agent.run():
      score       float  0–100   (higher = more trustworthy)
      detail      str            human-readable explanation
      confidence  float  0–1     model confidence in this score
      raw         dict           optional raw data for audit trail
    """
    pass


class BaseAgent:
    SIGNAL_NAME: str = "base"
    TIMEOUT: float = 8.0
    VERSION: str = "1.0"

    def __init__(self, domain: str):
        self.domain = domain.lower().strip()
        self._log = logging.getLogger(f"openprovena.agents.{self.SIGNAL_NAME}")

    async def run(self) -> SignalResult:
        raise NotImplementedError

    # ── Utilities ─────────────────────────────────────────────────────────

    def _clamp(self, v: float, lo: float = 0.0, hi: float = 100.0) -> float:
        return round(min(max(float(v), lo), hi), 2)

    def _seed(self, salt: int = 0) -> int:
        """Deterministic int seed from domain — for reproducible fallback scores."""
        return int(hashlib.md5(f"{self.domain}:{salt}".encode()).hexdigest()[:8], 16)

    def _rng(self, salt: int = 0) -> random.Random:
        return random.Random(self._seed(salt))

    def _fallback(
        self,
        score: Optional[float] = None,
        reason: str = "Données non disponibles",
        confidence: float = 0.3,
        salt: int = 0,
    ) -> SignalResult:
        """Return a neutral fallback when the real signal cannot be computed."""
        if score is None:
            score = self._rng(salt).uniform(35, 65)
        return SignalResult(
            score=self._clamp(score),
            detail=f"{reason} — score estimé heuristiquement.",
            confidence=confidence,
            raw={"fallback": True},
        )

    def _http_client(self, timeout: Optional[float] = None) -> httpx.AsyncClient:
        return httpx.AsyncClient(
            timeout=timeout or self.TIMEOUT,
            follow_redirects=True,
            headers={
                "User-Agent": "OpenProvena-SignalBot/1.0 (https://openprovena.org)",
            },
        )
