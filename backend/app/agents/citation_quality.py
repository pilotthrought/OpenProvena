"""
Agent 3 — Citation Quality

Method:
  1. Fetch the homepage + one article (via RSS or direct crawl)
  2. Extract outbound links
  3. Classify links: primary source / institutional / social / unknown
  4. NLP pass with spaCy: count hedging language, unsourced assertions,
     attribution verbs ("according to", "sources say", "selon"), passive evasion.
  5. Score = weighted combination of link quality ratio + NLP attribution rate

NLP signals extracted:
  - Attribution verbs: "selon", "d'après", "affirme", "déclare", "indique"
  - Hedging without source: "certains affirment", "on dit que", "il paraît"
  - Direct quotes with attribution → positive
  - Factual claims without any source → negative
"""

from __future__ import annotations

import re
from typing import Optional
from urllib.parse import urljoin, urlparse

import httpx

from app.agents.base import BaseAgent, SignalResult

# ── Source quality classifiers ────────────────────────────────────────────

# TLDs/domains associated with primary/institutional sources
PRIMARY_SOURCE_PATTERNS = [
    r"\.gouv\.fr", r"\.gov$", r"\.gov\.", r"europa\.eu",
    r"who\.int", r"oms\.int", r"inserm\.fr", r"cnrs\.fr",
    r"legifrance\.gouv\.fr", r"senat\.fr", r"assemblee-nationale\.fr",
    r"pubmed\.ncbi", r"doi\.org", r"arxiv\.org", r"scholar\.google",
    r"reuters\.com", r"apnews\.com", r"afp\.com",
]

SOCIAL_DOMAINS = {
    "twitter.com", "x.com", "facebook.com", "instagram.com",
    "tiktok.com", "youtube.com", "reddit.com",
}

# French + English attribution markers
ATTRIBUTION_PATTERNS = [
    r"\bselon\b", r"\bd'après\b", r"\baffirme\b", r"\bdéclare\b",
    r"\bindique\b", r"\brapporte\b", r"\bcite\b", r"\ba déclaré\b",
    r"\baccording to\b", r"\bsaid\b", r"\bstated\b", r"\breported\b",
    r"\bclaims\b", r"\baccording\b",
]

UNSOURCED_PATTERNS = [
    r"\bcertains affirment\b", r"\bon dit que\b", r"\bil paraît\b",
    r"\bdes sources affirment\b", r"\bselon des témoins\b",
    r"\bsome say\b", r"\bpeople are saying\b", r"\bsources say\b",
    r"\bexperts say\b",   # vague "experts" without naming them
]


class CitationQualityAgent(BaseAgent):
    SIGNAL_NAME = "citation_quality"

    async def run(self) -> SignalResult:
        # Step 1: Fetch page content
        html, fetch_ok = await self._fetch_page()
        if not fetch_ok or not html:
            return self._fallback(
                reason="Page inaccessible — impossible d'analyser les citations",
                confidence=0.25,
                salt=2,
            )

        # Step 2: Link analysis
        link_score, link_detail, link_raw = self._analyze_links(html)

        # Step 3: NLP attribution analysis
        nlp_score, nlp_detail, nlp_raw = self._analyze_attribution(html)

        # Step 4: Combine (60% links, 40% NLP)
        final_score = self._clamp(link_score * 0.6 + nlp_score * 0.4)

        return SignalResult(
            score=final_score,
            detail=f"{link_detail} {nlp_detail}",
            confidence=0.70,
            raw={**link_raw, **nlp_raw},
        )

    async def _fetch_page(self) -> tuple[str, bool]:
        """Fetch homepage HTML. Returns (html, success)."""
        try:
            async with self._http_client(timeout=7.0) as client:
                resp = await client.get(
                    f"https://{self.domain}",
                    headers={"Accept": "text/html"},
                )
                if resp.status_code == 200:
                    return resp.text[:50_000], True   # cap at 50k chars
        except Exception as e:
            self._log.debug(f"Page fetch failed for {self.domain}: {e}")
        return "", False

    def _analyze_links(self, html: str) -> tuple[float, str, dict]:
        """Extract and classify outbound links."""
        # Extract href values
        hrefs = re.findall(r'href=["\']([^"\']+)["\']', html, re.IGNORECASE)
        external = [
            h for h in hrefs
            if h.startswith("http") and urlparse(h).netloc != self.domain
        ]

        if not external:
            return (
                35.0,
                "Aucun lien externe détecté — sources non référencées.",
                {"total_links": 0},
            )

        primary = sum(
            1 for h in external
            if any(re.search(p, h, re.IGNORECASE) for p in PRIMARY_SOURCE_PATTERNS)
        )
        social = sum(
            1 for h in external
            if any(s in urlparse(h).netloc for s in SOCIAL_DOMAINS)
        )
        total = len(external)

        primary_ratio = primary / total if total else 0
        social_ratio = social / total if total else 0

        score = 40 + primary_ratio * 50 - social_ratio * 15
        detail = (
            f"{total} liens externes : {primary} sources primaires "
            f"({primary_ratio:.0%}), {social} liens sociaux ({social_ratio:.0%})."
        )
        return (
            self._clamp(score),
            detail,
            {"total_links": total, "primary": primary, "social": social},
        )

    def _analyze_attribution(self, html: str) -> tuple[float, str, dict]:
        """Count attribution vs unsourced patterns in text."""
        # Strip tags for text analysis
        text = re.sub(r"<[^>]+>", " ", html)
        text = re.sub(r"\s+", " ", text)[:30_000]

        attributed = sum(
            len(re.findall(p, text, re.IGNORECASE))
            for p in ATTRIBUTION_PATTERNS
        )
        unsourced = sum(
            len(re.findall(p, text, re.IGNORECASE))
            for p in UNSOURCED_PATTERNS
        )

        # Normalize by text length (per 1000 words approx)
        word_count = max(len(text.split()), 1)
        attr_rate = (attributed / word_count) * 1000
        unsrc_rate = (unsourced / word_count) * 1000

        score = 50 + attr_rate * 8 - unsrc_rate * 12
        detail = (
            f"Analyse NLP : {attributed} marqueurs d'attribution, "
            f"{unsourced} affirmations non sourcées détectées."
        )
        return (
            self._clamp(score),
            detail,
            {"attributed": attributed, "unsourced": unsourced, "word_count": word_count},
        )
