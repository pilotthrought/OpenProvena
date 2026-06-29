"""
Agent 1 — Domain Age

Data sources (in priority order):
  1. RDAP (rdap.org) — free, structured JSON
  2. whois-json.com API — fallback
  3. Heuristic seed — last resort

Scoring logic:
  age < 6 months  → 10–25   (very suspicious for news domain)
  6m – 2 years    → 25–55
  2 – 10 years    → 55–80
  10 – 20 years   → 80–92
  > 20 years      → 92–100
"""

from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Optional

import httpx

from app.agents.base import BaseAgent, SignalResult


# Known registration dates for major domains (RDAP sometimes unreliable for ccTLDs)
KNOWN_DATES: dict[str, datetime] = {
    "lemonde.fr":    datetime(1995, 6, 1,  tzinfo=timezone.utc),
    "lefigaro.fr":   datetime(1994, 11, 1, tzinfo=timezone.utc),
    "liberation.fr": datetime(1996, 4, 1,  tzinfo=timezone.utc),
    "mediapart.fr":  datetime(2008, 3, 1,  tzinfo=timezone.utc),
    "rt.com":        datetime(2005, 12, 10, tzinfo=timezone.utc),
    "breitbart.com": datetime(2007, 2, 17,  tzinfo=timezone.utc),
    "bbc.co.uk":     datetime(1996, 8, 1,  tzinfo=timezone.utc),
    "nytimes.com":   datetime(1993, 6, 9,  tzinfo=timezone.utc),
    "theguardian.com": datetime(1999, 5, 28, tzinfo=timezone.utc),
}

RDAP_EVENT_KEYS = {"registration", "registered", "domain registration"}
ISO_DATE_RE = re.compile(
    r"(\d{4}-\d{2}-\d{2})"          # YYYY-MM-DD
    r"(?:T\d{2}:\d{2}:\d{2})?",     # optional time part
    re.IGNORECASE,
)


def _age_to_score(age_days: int) -> tuple[float, str]:
    """Map domain age in days → (score, tier_label)."""
    if age_days < 30:
        return 5.0, "< 1 mois — très suspect"
    if age_days < 180:
        score = 10 + (age_days / 180) * 20
        return score, f"{age_days} jours — très récent"
    if age_days < 730:
        score = 30 + ((age_days - 180) / 550) * 25
        return score, f"{age_days // 30} mois"
    if age_days < 3650:
        score = 55 + ((age_days - 730) / 2920) * 25
        return score, f"{age_days // 365} ans"
    if age_days < 7300:
        score = 80 + ((age_days - 3650) / 3650) * 12
        return score, f"{age_days // 365} ans"
    return 92 + min(8, (age_days - 7300) / 3650 * 8), f"{age_days // 365} ans (ancienneté établie)"


class DomainAgeAgent(BaseAgent):
    SIGNAL_NAME = "domain_age"

    async def run(self) -> SignalResult:
        reg_date = KNOWN_DATES.get(self.domain)
        source = "base de référence"

        if not reg_date:
            reg_date, source = await self._rdap_lookup()

        if not reg_date:
            reg_date, source = await self._whois_fallback()

        if not reg_date:
            return self._fallback(
                score=50,
                reason="Date d'enregistrement introuvable (RDAP + WHOIS en échec)",
                confidence=0.25,
                salt=0,
            )

        age_days = (datetime.now(timezone.utc) - reg_date).days
        score_raw, tier_label = _age_to_score(age_days)
        score = self._clamp(score_raw)

        return SignalResult(
            score=score,
            detail=(
                f"Domaine enregistré depuis {tier_label} "
                f"(source: {source}). "
                f"Les domaines récents présentent un risque plus élevé."
            ),
            confidence=0.90 if source != "heuristique" else 0.40,
            raw={
                "registered_at": reg_date.isoformat(),
                "age_days": age_days,
                "source": source,
            },
        )

    async def _rdap_lookup(self) -> tuple[Optional[datetime], str]:
        """Query rdap.org — free, no key required."""
        try:
            async with self._http_client(timeout=6.0) as client:
                resp = await client.get(f"https://rdap.org/domain/{self.domain}")
                if resp.status_code != 200:
                    return None, ""
                data = resp.json()
                for event in data.get("events", []):
                    action = event.get("eventAction", "").lower()
                    if action in RDAP_EVENT_KEYS:
                        raw_date = event.get("eventDate", "")
                        parsed = self._parse_iso(raw_date)
                        if parsed:
                            return parsed, "RDAP (rdap.org)"
        except Exception as e:
            self._log.debug(f"RDAP lookup failed for {self.domain}: {e}")
        return None, ""

    async def _whois_fallback(self) -> tuple[Optional[datetime], str]:
        """Query whoisjsonapi.com as secondary source."""
        try:
            async with self._http_client(timeout=5.0) as client:
                resp = await client.get(
                    f"https://www.whoisjsonapi.com/v1/{self.domain}",
                    headers={"Accept": "application/json"},
                )
                if resp.status_code != 200:
                    return None, ""
                data = resp.json()
                domain_data = data.get("domain", {})
                created = domain_data.get("created_date") or domain_data.get("creation_date")
                if created:
                    parsed = self._parse_iso(str(created))
                    if parsed:
                        return parsed, "WHOIS"
        except Exception as e:
            self._log.debug(f"WHOIS fallback failed for {self.domain}: {e}")
        return None, ""

    @staticmethod
    def _parse_iso(raw: str) -> Optional[datetime]:
        m = ISO_DATE_RE.search(raw)
        if not m:
            return None
        try:
            dt = datetime.fromisoformat(m.group(1))
            return dt.replace(tzinfo=timezone.utc)
        except ValueError:
            return None
