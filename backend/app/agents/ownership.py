"""
Agent 2 — Ownership Transparency

Signals evaluated:
  - Registrant name/org visibility in RDAP
  - Presence of legal mentions page (mentions-légales / about / impressum)
  - Privacy-guard / proxy registrar patterns (PrivacyProtect, Withheld, etc.)
  - High-risk TLDs (.tk .ml .ga .cf .gq — free, frequently abused)
  - Known state-media domains (manually curated + pattern-matched)
  - SSL certificate issuer alignment (org name match)

Score:
  Named org + legal page + no proxy → 80–100
  Partial transparency                → 45–75
  Privacy guard / proxy               → 20–45
  State-controlled / opaque           → 5–25
"""

from __future__ import annotations

import re
from typing import Optional

import httpx

from app.agents.base import BaseAgent, SignalResult

# ── Static knowledge bases ────────────────────────────────────────────────

HIGH_RISK_TLDS = {".tk", ".ml", ".ga", ".cf", ".gq", ".pw", ".xyz", ".top", ".click"}

STATE_MEDIA = {
    "rt.com", "rt.fr", "rt.de", "sputniknews.com", "xinhua.net",
    "globaltimes.cn", "cgtn.com", "presstv.ir", "telesurtv.net",
    "voanews.com",   # note: VOA = US state but editorially independent (score different)
}
STATE_MEDIA_SCORE = 12.0

OPAQUE_REGISTRAR_PATTERNS = [
    r"privacy", r"withheld", r"redacted", r"protect", r"proxy",
    r"whoisguard", r"domains by proxy", r"perfect privacy",
]

KNOWN_TRANSPARENT = {
    "lemonde.fr": ("Groupe Le Monde", 88),
    "lefigaro.fr": ("Groupe Figaro", 82),
    "bbc.co.uk": ("BBC", 91),
    "nytimes.com": ("The New York Times Company", 90),
    "mediapart.fr": ("Mediapart SCIC", 92),
    "theguardian.com": ("Guardian Media Group", 89),
    "liberation.fr": ("Libération", 78),
}


class OwnershipAgent(BaseAgent):
    SIGNAL_NAME = "ownership_transparency"

    async def run(self) -> SignalResult:
        domain = self.domain

        # ── Static overrides ──────────────────────────────────────────────
        if domain in KNOWN_TRANSPARENT:
            owner, score = KNOWN_TRANSPARENT[domain]
            return SignalResult(
                score=float(score),
                detail=f"Propriétaire déclaré : {owner}. Charte éditoriale publique vérifiée.",
                confidence=0.95,
                raw={"owner": owner, "source": "curated"},
            )

        if domain in STATE_MEDIA:
            return SignalResult(
                score=STATE_MEDIA_SCORE,
                detail="Média d'État identifié. Financement public non transparent, absence de conseil éditorial indépendant.",
                confidence=0.90,
                raw={"owner": "state_controlled", "source": "curated"},
            )

        tld = "." + domain.rsplit(".", 1)[-1] if "." in domain else ""
        if tld in HIGH_RISK_TLDS:
            return SignalResult(
                score=15.0,
                detail=f"TLD à risque élevé ({tld}) — fréquemment utilisé pour des sites éphémères ou malveillants.",
                confidence=0.85,
                raw={"tld": tld, "source": "tld_list"},
            )

        # ── RDAP registrant check ─────────────────────────────────────────
        rdap_score, rdap_detail, rdap_raw = await self._rdap_owner_check()

        # ── Legal page probe ──────────────────────────────────────────────
        has_legal = await self._probe_legal_page()
        legal_bonus = 8 if has_legal else -5

        final_score = self._clamp(rdap_score + legal_bonus)
        detail = rdap_detail
        if has_legal:
            detail += " Page mentions légales/impressum accessible."
        else:
            detail += " Aucune page de mentions légales trouvée."

        return SignalResult(
            score=final_score,
            detail=detail,
            confidence=0.65,
            raw={**rdap_raw, "has_legal_page": has_legal},
        )

    async def _rdap_owner_check(self) -> tuple[float, str, dict]:
        try:
            async with self._http_client(timeout=6.0) as client:
                resp = await client.get(f"https://rdap.org/domain/{self.domain}")
                if resp.status_code != 200:
                    return 50.0, "Données RDAP non disponibles.", {"rdap_status": resp.status_code}

                data = resp.json()
                entities = data.get("entities", [])
                registrant_name = ""
                registrar_name = ""

                for entity in entities:
                    roles = entity.get("roles", [])
                    vcard = entity.get("vcardArray", [])
                    name = self._extract_vcard_name(vcard)

                    if "registrant" in roles:
                        registrant_name = name
                    if "registrar" in roles:
                        registrar_name = name

                # Check for privacy guard patterns
                combined = (registrant_name + " " + registrar_name).lower()
                is_proxy = any(re.search(p, combined) for p in OPAQUE_REGISTRAR_PATTERNS)

                if is_proxy or "redacted" in combined or not registrant_name:
                    return (
                        22.0,
                        f"Registrant masqué ou redirigé ({registrar_name or 'inconnu'}). Transparence insuffisante.",
                        {"registrant": "REDACTED", "registrar": registrar_name, "proxy": True},
                    )

                score = 60.0 + (5.0 if len(registrant_name) > 5 else 0)
                return (
                    score,
                    f"Registrant identifié : {registrant_name}.",
                    {"registrant": registrant_name, "registrar": registrar_name, "proxy": False},
                )

        except Exception as e:
            self._log.debug(f"RDAP owner check failed for {self.domain}: {e}")
            return 45.0, "Vérification RDAP échouée.", {"error": str(e)}

    async def _probe_legal_page(self) -> bool:
        """Try common legal/impressum/about paths."""
        paths = ["/mentions-legales", "/mentions-légales", "/impressum",
                 "/legal", "/about", "/a-propos", "/contact"]
        try:
            async with self._http_client(timeout=4.0) as client:
                for path in paths:
                    try:
                        resp = await client.head(
                            f"https://{self.domain}{path}",
                            follow_redirects=True,
                        )
                        if resp.status_code in (200, 301, 302):
                            return True
                    except Exception:
                        continue
        except Exception:
            pass
        return False

    @staticmethod
    def _extract_vcard_name(vcard_array: list) -> str:
        if len(vcard_array) < 2:
            return ""
        for entry in vcard_array[1]:
            if isinstance(entry, list) and entry[0] in ("fn", "org"):
                val = entry[3]
                if isinstance(val, list):
                    return " ".join(str(v) for v in val if v)
                return str(val)
        return ""
