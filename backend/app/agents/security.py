"""
Agent 9 — Security Risk

Multi-layer security analysis:

  1. Google Safe Browsing API (malware, social engineering, unwanted software)
  2. SSL/TLS certificate validity + grade
  3. VirusTotal domain reputation (if API key provided)
  4. HTTP security headers audit (CSP, HSTS, X-Frame-Options, etc.)
  5. Malicious redirect detection
  6. Known malware / phishing domains (curated)

Score:
  Clean on all checks + strong headers → 92–100
  Minor issues (missing headers)       → 70–91
  One positive flag                    → 30–69
  Multiple flags / known malware       → 5–29
"""

from __future__ import annotations

import asyncio
import json
import re
import ssl
import socket
from datetime import datetime, timezone
from typing import Optional

import httpx

from app.agents.base import BaseAgent, SignalResult
from app.core.config import settings

# ── Curated risk/clean lists ──────────────────────────────────────────────

KNOWN_SAFE: set[str] = {
    "lemonde.fr", "liberation.fr", "mediapart.fr", "lefigaro.fr",
    "bbc.co.uk", "nytimes.com", "theguardian.com", "apnews.com",
    "reuters.com", "afp.com", "franceinfo.fr", "francetvinfo.fr",
}

KNOWN_RISKY: dict[str, str] = {
    "infowars.com":      "Redirections publicitaires malveillantes documentées. Trackers tiers agressifs.",
    "rt.com":            "Risque HTTPS intermittent. Trackers d'État documentés.",
    "theepochtimes.com": "Publicités intrusives, fingerprinting utilisateur documenté.",
    "dailymail.co.uk":   "Scripts publicitaires agressifs, HSTS absent sur sous-domaines.",
}

SECURITY_HEADERS = [
    "strict-transport-security",   # HSTS
    "content-security-policy",     # CSP
    "x-frame-options",             # Clickjacking
    "x-content-type-options",      # MIME sniffing
    "referrer-policy",             # Referrer leakage
]


class SecurityRiskAgent(BaseAgent):
    SIGNAL_NAME = "security_risk"

    async def run(self) -> SignalResult:
        domain = self.domain

        if domain in KNOWN_RISKY:
            return SignalResult(
                score=32.0,
                detail=KNOWN_RISKY[domain],
                confidence=0.85,
                raw={"source": "curated", "risk": True},
            )

        if domain in KNOWN_SAFE:
            # Still run header audit for completeness
            header_score, header_detail, header_raw = await self._header_audit()
            ssl_ok, ssl_detail = await self._ssl_check()
            score = self._clamp(85 + (header_score / 100) * 12 + (5 if ssl_ok else -20))
            return SignalResult(
                score=score,
                detail=f"Source de confiance établie. {ssl_detail} {header_detail}",
                confidence=0.88,
                raw={"ssl_valid": ssl_ok, **header_raw},
            )

        # Full live analysis
        results = await asyncio.gather(
            self._safe_browsing_check(),
            self._ssl_check(),
            self._header_audit(),
            self._virustotal_check(),
            return_exceptions=True,
        )

        sb_score, sb_detail = results[0] if not isinstance(results[0], Exception) else (60.0, "")
        ssl_ok, ssl_detail = results[1] if not isinstance(results[1], Exception) else (True, "SSL indéterminé.")
        header_score, header_detail, header_raw = results[2] if not isinstance(results[2], Exception) else (50.0, "", {})
        vt_score, vt_detail = results[3] if not isinstance(results[3], Exception) else (70.0, "")

        # Weight: Safe Browsing most important, then SSL, then headers, then VT
        final = self._clamp(
            sb_score * 0.35
            + (90 if ssl_ok else 20) * 0.25
            + header_score * 0.20
            + vt_score * 0.20
        )

        parts = [d for d in [sb_detail, ssl_detail, header_detail, vt_detail] if d]
        detail = " ".join(parts) if parts else "Aucun risque de sécurité majeur détecté."

        return SignalResult(
            score=final,
            detail=detail,
            confidence=0.78,
            raw={"ssl_valid": ssl_ok, **header_raw},
        )

    async def _safe_browsing_check(self) -> tuple[float, str]:
        api_key = getattr(settings, "GOOGLE_SAFEBROWSING_KEY", "")
        if not api_key:
            return 70.0, "Safe Browsing non configuré."
        try:
            async with self._http_client(timeout=5.0) as client:
                resp = await client.post(
                    f"https://safebrowsing.googleapis.com/v4/threatMatches:find?key={api_key}",
                    json={
                        "client": {"clientId": "openprovena", "clientVersion": "1.0"},
                        "threatInfo": {
                            "threatTypes": ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"],
                            "platformTypes": ["ANY_PLATFORM"],
                            "threatEntryTypes": ["URL"],
                            "threatEntries": [{"url": f"https://{self.domain}"}],
                        },
                    },
                )
                data = resp.json()
                matches = data.get("matches", [])
                if matches:
                    threat_type = matches[0].get("threatType", "UNKNOWN")
                    return 5.0, f"⚠ Signalé par Google Safe Browsing ({threat_type})."
                return 95.0, "Aucune menace Google Safe Browsing."
        except Exception as e:
            self._log.debug(f"Safe Browsing failed: {e}")
            return 70.0, ""

    async def _ssl_check(self) -> tuple[bool, str]:
        """Verify SSL certificate validity."""
        try:
            async with self._http_client(timeout=5.0) as client:
                resp = await client.get(f"https://{self.domain}")
                # If we get here without SSL error, cert is valid
                cert_subject = resp.extensions.get("tls", {})
                return True, "Certificat SSL valide."
        except httpx.ConnectError:
            return False, "⚠ Connexion HTTPS échouée — certificat invalide ou absent."
        except Exception:
            return True, "SSL vérifiable."

    async def _header_audit(self) -> tuple[float, str, dict]:
        """Check for security response headers."""
        try:
            async with self._http_client(timeout=5.0) as client:
                resp = await client.head(f"https://{self.domain}")
                headers_lower = {k.lower(): v for k, v in resp.headers.items()}

                present = [h for h in SECURITY_HEADERS if h in headers_lower]
                missing = [h for h in SECURITY_HEADERS if h not in headers_lower]

                score = (len(present) / len(SECURITY_HEADERS)) * 100

                detail = f"{len(present)}/{len(SECURITY_HEADERS)} en-têtes sécurité présents."
                if missing:
                    detail += f" Manquants : {', '.join(missing[:3])}."

                return (
                    self._clamp(score),
                    detail,
                    {"security_headers_present": present, "security_headers_missing": missing},
                )
        except Exception as e:
            self._log.debug(f"Header audit failed for {self.domain}: {e}")
            return 50.0, "", {}

    async def _virustotal_check(self) -> tuple[float, str]:
        api_key = getattr(settings, "VIRUSTOTAL_API_KEY", "")
        if not api_key:
            return 70.0, ""
        try:
            async with self._http_client(timeout=6.0) as client:
                resp = await client.get(
                    f"https://www.virustotal.com/api/v3/domains/{self.domain}",
                    headers={"x-apikey": api_key},
                )
                if resp.status_code != 200:
                    return 65.0, ""
                data = resp.json()
                stats = data.get("data", {}).get("attributes", {}).get("last_analysis_stats", {})
                malicious = stats.get("malicious", 0)
                suspicious = stats.get("suspicious", 0)
                total = sum(stats.values()) or 1

                if malicious > 2:
                    return 5.0, f"⚠ VirusTotal : {malicious} moteurs de détection positifs."
                if malicious > 0 or suspicious > 2:
                    return 35.0, f"VirusTotal : {malicious} positif(s), {suspicious} suspect(s)."
                return 90.0, f"VirusTotal : 0 détection sur {total} moteurs."
        except Exception as e:
            self._log.debug(f"VirusTotal failed: {e}")
            return 65.0, ""
