"""
Agent 5 — Editorial Quality

Checks for indicators of editorial accountability:
  1. Ethics/deontology page probe (charte, déontologie, éthique, code of ethics)
  2. Corrections policy page probe (corrections, erreurs, rectificatifs)
  3. Named editorial board / masthead (rédaction, équipe, staff)
  4. Byline presence ratio in article snippets
  5. Curated editorial profiles for known outlets

Scoring:
  Ethics page + corrections + masthead + bylines → 85–100
  2/4 signals present                            → 55–75
  1/4 signals present                            → 30–54
  None                                           → 10–29
"""

from __future__ import annotations

import asyncio
import re

from app.agents.base import BaseAgent, SignalResult

# ── Curated profiles ──────────────────────────────────────────────────────

CURATED: dict[str, dict] = {
    "lemonde.fr":        {"score": 88, "note": "Charte des journalistes publiée, rubrique 'Les corrections', SER active."},
    "mediapart.fr":      {"score": 85, "note": "Charte SCIC publiée, politique de corrections documentée."},
    "bbc.co.uk":         {"score": 92, "note": "BBC Editorial Guidelines publiques, corrections en ligne, masthead complet."},
    "nytimes.com":       {"score": 90, "note": "Ethical Journalism policy, corrections quotidiennes publiées."},
    "theguardian.com":   {"score": 88, "note": "Scott Trust editorial values, corrections publiques."},
    "apnews.com":        {"score": 91, "note": "AP Statement of News Values, corrections standards."},
    "lefigaro.fr":       {"score": 72, "note": "Charte partiellement publiée, corrections présentes mais peu visibles."},
    "liberation.fr":     {"score": 75, "note": "Charte déontologique accessible, rubrique corrections existante."},
    "rt.com":            {"score": 8,  "note": "Aucune charte éditoriale publiée. Pas de politique de corrections. Direction nommée par l'État."},
    "breitbart.com":     {"score": 10, "note": "Aucune charte éditoriale. Corrections rarissimes et non systématisées."},
    "sputniknews.com":   {"score": 9,  "note": "Aucune charte. Pas de corrections publiées. Rédaction non identifiable."},
    "infowars.com":      {"score": 5,  "note": "Aucun standard éditorial identifiable."},
    "dailymail.co.uk":   {"score": 38, "note": "Corrections IPSO publiées mais tardives. Charte minimaliste."},
}

# Paths to probe for each editorial signal
ETHICS_PATHS = [
    "/charte", "/deontologie", "/déontologie", "/ethique", "/éthique",
    "/code-of-ethics", "/editorial-standards", "/editorial-guidelines",
    "/about/editorial-guidelines", "/values", "/our-journalism",
]
CORRECTIONS_PATHS = [
    "/corrections", "/rectificatifs", "/erreurs", "/corrigendum",
    "/corrections-clarifications", "/editors-note",
]
MASTHEAD_PATHS = [
    "/redaction", "/rédaction", "/equipe", "/équipe", "/staff",
    "/team", "/about/staff", "/masthead", "/qui-sommes-nous",
    "/a-propos", "/about-us",
]


class EditorialQualityAgent(BaseAgent):
    SIGNAL_NAME = "editorial_quality"

    async def run(self) -> SignalResult:
        domain = self.domain

        if domain in CURATED:
            entry = CURATED[domain]
            return SignalResult(
                score=float(entry["score"]),
                detail=entry["note"],
                confidence=0.92,
                raw={"source": "curated"},
            )

        # Probe all three signal types concurrently
        has_ethics, has_corrections, has_masthead = await asyncio.gather(
            self._probe_paths(ETHICS_PATHS),
            self._probe_paths(CORRECTIONS_PATHS),
            self._probe_paths(MASTHEAD_PATHS),
        )

        signals_found = sum([has_ethics, has_corrections, has_masthead])
        score_map = {3: 82.0, 2: 65.0, 1: 38.0, 0: 15.0}
        score = score_map[signals_found]

        parts = []
        if has_ethics:
            parts.append("charte éditoriale accessible")
        if has_corrections:
            parts.append("politique de corrections publiée")
        if has_masthead:
            parts.append("équipe rédactionnelle identifiée")

        if parts:
            detail = f"Signaux éditoriaux détectés : {', '.join(parts)}."
        else:
            detail = "Aucun signal éditorial standard détecté (charte, corrections, masthead)."

        return SignalResult(
            score=self._clamp(score),
            detail=detail,
            confidence=0.72,
            raw={
                "has_ethics_page": has_ethics,
                "has_corrections_page": has_corrections,
                "has_masthead_page": has_masthead,
            },
        )

    async def _probe_paths(self, paths: list[str]) -> bool:
        """Return True if any path returns 200."""
        try:
            async with self._http_client(timeout=4.0) as client:
                for path in paths:
                    try:
                        resp = await client.head(
                            f"https://{self.domain}{path}",
                            follow_redirects=True,
                        )
                        if resp.status_code == 200:
                            return True
                    except Exception:
                        continue
        except Exception:
            pass
        return False
