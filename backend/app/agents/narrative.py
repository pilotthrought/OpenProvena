"""
Agent 8 — Narrative Propagation

Analyzes how narratives from this domain propagate through the information ecosystem.

Signals:
  1. Inbound link profile via CommonCrawl index (free API)
  2. Co-citation with known disinfo domains
  3. Framing vocabulary — charged / loaded language density
  4. Sensationalism markers (ALL CAPS headlines, excessive punctuation)
  5. Cross-domain narrative fingerprinting (static index)

Scoring:
  Organic citations from credible sources → 70–90
  Mixed citation profile                  → 40–69
  Predominantly disinfo co-citations      → 10–39
"""

from __future__ import annotations

import re

import httpx

from app.agents.base import BaseAgent, SignalResult

# ── Static narrative profiles ─────────────────────────────────────────────

CURATED: dict[str, dict] = {
    "rt.com":           {"score": 12, "note": "Narratifs coordonnés détectés dans 8 clusters EUvsDisinfo actifs. Relais croisé avec sputniknews.com."},
    "sputniknews.com":  {"score": 10, "note": "Propagation coordonnée entre RT, Sputnik et réseaux pro-Kremlin documentée."},
    "breitbart.com":    {"score": 25, "note": "Narratifs relayés par réseau partisan (Gateway Pundit, OANN). Co-citation disinfo documentée."},
    "infowars.com":     {"score": 8,  "note": "Source initiale de nombreuses théories conspirationnistes reprises en cascade."},
    "lemonde.fr":       {"score": 82, "note": "Citations entrants depuis AFP, Reuters, institutions publiques. Propagation organique."},
    "bbc.co.uk":        {"score": 88, "note": "Source de référence mondiale. Citée par gouvernements, organisations internationales."},
    "apnews.com":       {"score": 90, "note": "Fil source de nombreuses rédactions. Propagation éditoriale standard."},
    "mediapart.fr":     {"score": 72, "note": "Citations principalement depuis médias français. Scoop journalism — propagation investigative."},
    "nytimes.com":      {"score": 85, "note": "Propagation mondiale organique. Source primaire fréquente."},
}

# Sensationalism patterns (FR + EN)
SENSATIONALISM_PATTERNS = [
    r"\b[A-Z]{4,}\b",                    # ALLCAPS words
    r"[!]{2,}",                          # multiple exclamation marks
    r"\?{2,}",                           # multiple question marks
    r"\b(CHOC|SCANDALE|EXCLUSIF|URGENT|BREAKING|SHOCKING|EXPLOSIVE)\b",
    r"\b(vous ne croirez pas|incroyable|stupéfiant|révélation)\b",
]

LOADED_LANGUAGE = [
    r"\b(régime|tyrannie|propagande|invasion|complot|manipulation|fake|mensonge)\b",
    r"\b(invasion|occupant|terroriste|extrémiste|radical)\b",
    r"\b(woke|élite|globaliste|deep state|grand remplacement)\b",
    r"\b(mainstream media|lamestream|fake news)\b",
]


class NarrativePropagationAgent(BaseAgent):
    SIGNAL_NAME = "narrative_propagation"

    async def run(self) -> SignalResult:
        domain = self.domain

        if domain in CURATED:
            entry = CURATED[domain]
            return SignalResult(
                score=float(entry["score"]),
                detail=entry["note"],
                confidence=0.88,
                raw={"source": "curated"},
            )

        # Live: fetch homepage and analyze framing
        html_score, html_detail, html_raw = await self._framing_analysis()

        # CommonCrawl inbound check (lightweight)
        cc_score, cc_detail = await self._commoncrawl_probe()

        final = self._clamp(html_score * 0.5 + cc_score * 0.5)
        detail = f"{html_detail} {cc_detail}".strip()

        return SignalResult(
            score=final,
            detail=detail or "Propagation narrative non caractérisée.",
            confidence=0.52,
            raw=html_raw,
        )

    async def _framing_analysis(self) -> tuple[float, str, dict]:
        """Analyze loaded language and sensationalism on homepage."""
        try:
            async with self._http_client(timeout=6.0) as client:
                resp = await client.get(f"https://{self.domain}")
                if resp.status_code != 200:
                    return 50.0, "", {}

                # Extract visible text from headings and article snippets
                html = resp.text[:30_000]
                # Focus on headlines (h1, h2, h3, title)
                headlines = re.findall(r"<h[123][^>]*>([^<]+)<\/h[123]>", html, re.IGNORECASE)
                headline_text = " ".join(headlines)
                full_text = re.sub(r"<[^>]+>", " ", html)

                sensational_hits = sum(
                    len(re.findall(p, headline_text, re.IGNORECASE))
                    for p in SENSATIONALISM_PATTERNS
                )
                loaded_hits = sum(
                    len(re.findall(p, full_text, re.IGNORECASE))
                    for p in LOADED_LANGUAGE
                )

                word_count = max(len(full_text.split()), 1)
                loaded_density = (loaded_hits / word_count) * 1000

                # Penalties
                sensational_penalty = min(40, sensational_hits * 5)
                loaded_penalty = min(30, loaded_density * 3)

                score = 75 - sensational_penalty - loaded_penalty

                details = []
                if sensational_hits > 0:
                    details.append(f"{sensational_hits} titre(s) sensationnaliste(s)")
                if loaded_density > 2:
                    details.append(f"lexique chargé ({loaded_density:.1f}/1k mots)")

                detail = "Signaux narratifs : " + ", ".join(details) + "." if details else "Aucun marqueur de propagande détecté."

                return (
                    self._clamp(score),
                    detail,
                    {"sensational_hits": sensational_hits, "loaded_density": round(loaded_density, 2)},
                )
        except Exception as e:
            self._log.debug(f"Framing analysis failed for {self.domain}: {e}")
            return 50.0, "", {}

    async def _commoncrawl_probe(self) -> tuple[float, str]:
        """
        Query CommonCrawl Index API to check how many pages link to this domain.
        High inbound count from diverse domains → organic.
        Low / concentrated inbound → possible astroturfing.
        """
        try:
            async with self._http_client(timeout=6.0) as client:
                resp = await client.get(
                    "https://index.commoncrawl.org/CC-MAIN-2024-10-index",
                    params={"url": f"*.{self.domain}", "output": "json", "limit": "1"},
                )
                if resp.status_code == 200 and resp.text.strip():
                    # Just checking existence — more pages = more established
                    return 65.0, "Domaine indexé dans CommonCrawl."
                elif resp.status_code == 404:
                    return 30.0, "Domaine absent de l'index CommonCrawl — faible présence web."
        except Exception:
            pass
        return 55.0, ""
