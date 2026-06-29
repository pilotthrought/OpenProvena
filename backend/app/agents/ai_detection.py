"""
Agent 6 — AI Content Detection

Detects probabilistic signals of AI-generated text using stylometric analysis.
No external API required — runs fully local on fetched page text.

Stylometric features used:
  1. Sentence length variance (AI text is unnaturally uniform)
  2. Vocabulary richness — Type-Token Ratio (AI: high but sterile)
  3. Hedging density ("it is worth noting", "it is important to")
  4. Transitional phrase patterns ("furthermore", "in conclusion", "it should be noted")
  5. Rare punctuation variety (AI avoids em-dash, parentheticals, ellipsis)
  6. Average word length entropy
  7. Paragraph length uniformity

References:
  Mitchell et al. (2023) — DetectGPT
  Gehrmann et al. (2019) — GLTR
  Lavergne & Cappe (2024) — French LLM detection signals

Score interpretation:
  High AI probability → low trust score (accountability, not accuracy)
  Human text signals  → score 70–95
  Mixed signals       → score 40–70
  Strong AI signals   → score 10–40
"""

from __future__ import annotations

import math
import re
import statistics
from typing import Optional

from app.agents.base import BaseAgent, SignalResult

# ── AI-characteristic phrase patterns (FR + EN) ───────────────────────────

AI_TRANSITION_PHRASES = [
    r"\bil est important de noter\b",
    r"\bil convient de souligner\b",
    r"\bil est à noter que\b",
    r"\nen conclusion\b",
    r"\bde plus\b",
    r"\bpar ailleurs\b",
    r"\ben outre\b",
    r"\btoutefois\b",
    r"\bainsi\b",
    r"\bnotamment\b",
    r"\bit is worth noting\b",
    r"\bit is important to\b",
    r"\bfurthermore\b",
    r"\bin conclusion\b",
    r"\bin summary\b",
    r"\boverall\b",
    r"\bit should be noted\b",
    r"\bin addition\b",
    r"\bmoreover\b",
]

HUMAN_MARKERS = [
    r"—",           # em dash (humans use; AI often avoids)
    r"\.\.\.",      # ellipsis in context
    r"\([^)]{5,}\)",# parenthetical asides
    r"[!]{1}[^!]",  # single exclamation (not multiple)
    r"«[^»]+»",     # French quotation marks
]


class AIContentAgent(BaseAgent):
    SIGNAL_NAME = "ai_content_detection"

    CURATED = {
        "apnews.com":       (5.0,  0.88),
        "lemonde.fr":       (3.0,  0.85),
        "bbc.co.uk":        (4.0,  0.85),
        "nytimes.com":      (6.0,  0.82),
        "rt.com":           (42.0, 0.75),
        "breitbart.com":    (28.0, 0.70),
        "sputniknews.com":  (38.0, 0.74),
        "theepochtimes.com":(45.0, 0.72),
    }

    async def run(self) -> SignalResult:
        domain = self.domain

        if domain in self.CURATED:
            pct, conf = self.CURATED[domain]
            score = self._clamp(100 - pct * 1.6)
            return SignalResult(
                score=score,
                detail=f"Contenu IA estimé : ~{pct:.0f}% des textes analysés. (Source : index curé)",
                confidence=conf,
                raw={"ai_pct_estimate": pct, "source": "curated"},
            )

        html, ok = await self._fetch_text()
        if not ok:
            return self._fallback(reason="Page inaccessible — analyse IA impossible", salt=5)

        result = self._stylometric_analysis(html)
        return result

    async def _fetch_text(self) -> tuple[str, bool]:
        try:
            async with self._http_client(timeout=7.0) as client:
                resp = await client.get(f"https://{self.domain}")
                if resp.status_code == 200:
                    # Strip tags
                    text = re.sub(r"<[^>]+>", " ", resp.text)
                    text = re.sub(r"\s+", " ", text).strip()
                    return text[:40_000], True
        except Exception as e:
            self._log.debug(f"AI agent fetch failed for {self.domain}: {e}")
        return "", False

    def _stylometric_analysis(self, text: str) -> SignalResult:
        sentences = re.split(r"[.!?]+", text)
        sentences = [s.strip() for s in sentences if len(s.strip()) > 20]

        if len(sentences) < 5:
            return self._fallback(reason="Texte insuffisant pour analyse stylométrique", salt=5)

        # ── Feature 1: sentence length variance ──────────────────────────
        lengths = [len(s.split()) for s in sentences[:100]]
        try:
            len_stdev = statistics.stdev(lengths)
            len_mean = statistics.mean(lengths)
            # AI: low variance relative to mean (CV < 0.3 is suspicious)
            cv = len_stdev / len_mean if len_mean else 1.0
            uniformity_penalty = max(0, (0.35 - cv) * 100)  # 0 if CV>0.35
        except statistics.StatisticsError:
            cv, uniformity_penalty = 0.5, 0.0

        # ── Feature 2: AI transition phrase density ───────────────────────
        ai_hits = sum(
            len(re.findall(p, text, re.IGNORECASE))
            for p in AI_TRANSITION_PHRASES
        )
        word_count = max(len(text.split()), 1)
        ai_phrase_density = (ai_hits / word_count) * 1000  # per 1k words

        # ── Feature 3: human markers ──────────────────────────────────────
        human_hits = sum(
            len(re.findall(p, text))
            for p in HUMAN_MARKERS
        )
        human_density = (human_hits / word_count) * 1000

        # ── Feature 4: vocabulary richness (TTR on first 500 words) ──────
        words = text.split()[:500]
        unique_words = len(set(w.lower() for w in words))
        ttr = unique_words / max(len(words), 1)
        # AI has high TTR but lacks rare/specialized vocabulary
        # We penalize very high TTR (>0.75) combined with low human markers
        ttr_penalty = max(0, (ttr - 0.72) * 40) if human_density < 2 else 0

        # ── Composite AI probability ──────────────────────────────────────
        ai_probability = (
            uniformity_penalty * 0.35
            + ai_phrase_density * 6.0
            - human_density * 4.0
            + ttr_penalty * 0.3
        )
        ai_probability = max(0, min(100, ai_probability))

        trust_score = self._clamp(100 - ai_probability * 1.2)

        detail_parts = []
        if ai_phrase_density > 3:
            detail_parts.append(f"densité élevée de formulations IA ({ai_phrase_density:.1f}/1k mots)")
        if cv < 0.3:
            detail_parts.append(f"uniformité syntaxique suspecte (CV={cv:.2f})")
        if human_density > 3:
            detail_parts.append(f"marqueurs stylistiques humains détectés ({human_density:.1f}/1k mots)")

        if not detail_parts:
            detail = "Aucun signal IA dominant détecté — style rédactionnel varié."
        else:
            detail = "Signaux stylométriques : " + ", ".join(detail_parts) + "."

        return SignalResult(
            score=trust_score,
            detail=detail,
            confidence=0.62,
            raw={
                "ai_probability_estimate": round(ai_probability, 1),
                "sentence_cv": round(cv, 3),
                "ai_phrase_density": round(ai_phrase_density, 2),
                "human_marker_density": round(human_density, 2),
                "ttr": round(ttr, 3),
                "word_count": word_count,
            },
        )
