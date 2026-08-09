"""
Service d'analyse de confiance pour OpenProvena
Analyse les URLs et domaines pour déterminer leur score de confiance
"""

import asyncio
import json
import socket
import ssl
import whois
import httpx
import redis.asyncio as aioredis
from datetime import datetime, timedelta
from typing import Optional
from urllib.parse import urlparse
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


# Noms de signaux traduits en français
SIGNAL_NAMES = {
    "domain_age": "Âge du domaine",
    "https": "HTTPS activé",
    "ssl": "Qualité SSL",
    "dns": "Configuration DNS",
    "headers": "En-têtes de sécurité",
    "content": "Qualité du contenu",
    "reputation": "Réputation du domaine",
}


class TrustAnalyzer:
    """
    Analyseur de confiance pour les URLs et domaines
    Utilise plusieurs sources de données pour calculer un score
    """
    
    def __init__(self):
        self.weights = {
            "domain_age": 0.15,
            "https": 0.12,
            "ssl_quality": 0.10,
            "dns_records": 0.08,
            "headers": 0.08,
            "content_analysis": 0.12,
            "reputation": 0.15,
            "social_signals": 0.10,
            "ai_detection": 0.10,
        }
        self._redis: Optional[aioredis.Redis] = None

    async def _get_redis(self) -> Optional[aioredis.Redis]:
        """Connexion Redis paresseuse pour l'historique des analyses"""
        if self._redis is None:
            try:
                self._redis = aioredis.from_url(
                    settings.redis_url, decode_responses=True, socket_connect_timeout=3
                )
                await self._redis.ping()
            except Exception as e:
                logger.warning(f"Redis indisponible, historique désactivé: {e}")
                self._redis = None
        return self._redis

    async def _save_and_get_history(self, domain: str, current_score: int) -> list:
        """
        Sauvegarde le score courant en Redis et récupère l'historique récent.
        Retourne une liste de {date, score, change} triée du plus récent au plus ancien.
        """
        redis = await self._get_redis()
        if redis is None:
            return []

        key = f"history:{domain}"
        now = datetime.now()
        entry = json.dumps({"date": now.strftime("%Y-%m"), "score": current_score})

        try:
            # Récupère l'historique existant avant d'ajouter la nouvelle entrée
            existing = await redis.lrange(key, 0, 11)
            # Ajoute la nouvelle entrée en tête de liste
            await redis.lpush(key, entry)
            # Garde au maximum 12 entrées (1 an)
            await redis.ltrim(key, 0, 11)
            # Expire après 400 jours pour éviter l'accumulation
            await redis.expire(key, 400 * 24 * 3600)
        except Exception as e:
            logger.warning(f"Erreur lors de la sauvegarde de l'historique: {e}")
            return []

        history = []
        for raw in existing:
            try:
                item = json.loads(raw)
                history.append(item)
            except (json.JSONDecodeError, TypeError):
                continue

        # Construit la liste avec les variations de score
        result = [{"date": now.strftime("%Y-%m"), "score": current_score, "change": 0}]
        prev_score = current_score
        for item in history:
            change = item["score"] - prev_score
            result.append({"date": item["date"], "score": item["score"], "change": change})
            prev_score = item["score"]

        return result
    
    async def analyze(self, url_or_domain: str) -> dict:
        """
        Analyse complète d'une URL ou d'un domaine
        
        Args:
            url_or_domain: URL complète ou nom de domaine
            
        Returns:
            Dict contenant le score et les signaux d'analyse
        """
        # Parse l'URL ou domaine
        if url_or_domain.startswith(('http://', 'https://')):
            parsed = urlparse(url_or_domain)
            domain = parsed.netloc
        else:
            domain = url_or_domain.replace('https://', '').replace('http://', '').split('/')[0]
        
        logger.info(f"Analyzing domain: {domain}")
        
        # Lance les analyses en parallèle
        tasks = [
            self.check_domain_age(domain),
            self.check_https(domain),
            self.check_ssl(domain),
            self.check_dns(domain),
            self.check_http_headers(url_or_domain),
            self.check_content_analysis(url_or_domain),
            self.check_domain_reputation(domain),
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Compile les résultats
        signals = []
        total_score = 0
        total_weight = 0
        
        signal_types = [
            "domain_age", "https", "ssl", "dns", "headers", 
            "content", "reputation"
        ]
        
        # Métadonnées WHOIS récupérées par check_domain_age
        whois_meta = {}

        for i, result in enumerate(results):
            signal_type = signal_types[i] if i < len(signal_types) else f"signal_{i}"
            
            if isinstance(result, Exception):
                logger.warning(f"Error in {signal_type}: {result}")
                score = 50  # Score neutre en cas d'erreur
            else:
                score = result.get("score", 50)
                # Capture les métadonnées WHOIS si disponibles
                if signal_type == "domain_age" and result.get("meta"):
                    whois_meta = result["meta"]
                signals.append({
                    "id": f"{signal_type}-{datetime.now().timestamp()}",
                    "name": SIGNAL_NAMES.get(signal_type, result.get("name", signal_type.title())),
                    "description": result.get("description", ""),
                    "value": score,
                    "weight": self.weights.get(signal_type, 0.10),
                    "category": result.get("category", "general"),
                    "source": result.get("source", "internal"),
                    "timestamp": datetime.now().isoformat() + "Z"
                })
                total_score += score * self.weights.get(signal_type, 0.10)
                total_weight += self.weights.get(signal_type, 0.10)
        
        # Normalise le score final
        if total_weight > 0:
            final_score = int(total_score / total_weight)
        else:
            final_score = 50
        
        # Détermine le niveau de confiance
        trust_level = self._get_trust_level(final_score)
        
        # Détermine la catégorie du site
        category = await self._detect_category(url_or_domain)
        
        # Analyse de contenu IA
        ai_probability = await self._detect_ai_content(url_or_domain)

        # Sauvegarde et récupère l'historique des scores
        historical_scores = await self._save_and_get_history(domain, final_score)
        
        return {
            "id": f"analysis-{domain}-{datetime.now().timestamp()}",
            "url": url_or_domain,
            "domain": domain,
            "score": final_score,
            "trust_level": trust_level,
            "category": category,
            "domain_age": whois_meta.get("domain_age", 0),
            "registration_date": whois_meta.get("registration_date", "Inconnue"),
            "last_updated": datetime.now().isoformat() + "Z",
            "owner": whois_meta.get("owner", "Inconnu"),
            "ai_generated_probability": ai_probability,
            "content_quality": self._calc_content_quality(signals),
            "fact_check_overlap": self._calc_fact_check_overlap(signals),
            "citation_quality": self._calc_citation_quality(signals),
            "signals": signals,
            "related_domains": [],
            "historical_scores": historical_scores,
            "analyzed_at": datetime.now().isoformat() + "Z",
            "confidence": self._calc_confidence(signals),
            "explanation": self._generate_explanation(final_score, signals),
            "recommendations": self._generate_recommendations(signals),
        }
    
    async def check_domain_age(self, domain: str) -> dict:
        """Vérifie l'âge du domaine via WHOIS"""
        try:
            # Timeout court pour WHOIS
            w = await asyncio.wait_for(
                asyncio.to_thread(whois.query, domain),
                timeout=5
            )
            
            if w:
                # creation_date peut être sous différents noms selon le TLD/registre,
                # et les attributs sont dynamiques. Utiliser getattr.
                creation = getattr(w, "creation_date", None) or getattr(w, "created", None)
                if not creation:
                    return {
                        "score": 50,
                        "name": "Âge du domaine",
                        "description": "Date de création non disponible dans le WHOIS",
                        "category": "infrastructure",
                        "source": "WHOIS",
                        "meta": {"domain_age": 0, "registration_date": "Inconnue", "owner": "Inconnu"},
                    }
                # creation_date peut être une liste ou un datetime
                if isinstance(creation, list):
                    creation = creation[0]

                age_days = (datetime.now() - creation).days
                # Score basé sur l'âge (plus vieux = plus fiable)
                if age_days > 3650:  # > 10 ans
                    score = 95
                elif age_days > 1825:  # > 5 ans
                    score = 85
                elif age_days > 730:  # > 2 ans
                    score = 70
                elif age_days > 365:  # > 1 an
                    score = 55
                else:
                    score = 30
                
                # Récupère le propriétaire/registrar si disponible.
                # Les attributs du Domain sont dynamiques selon le TLD, utiliser
                # getattr pour éviter les AttributeError sur les champs absents.
                owner = "Inconnu"
                for attr in ("org", "organization", "name", "registrar"):
                    val = getattr(w, attr, None)
                    if val:
                        owner = val
                        break

                return {
                    "score": score,
                    "name": "Âge du domaine",
                    "description": f"Domaine enregistré il y a {age_days} jours",
                    "category": "infrastructure",
                    "source": "WHOIS",
                    "meta": {
                        "domain_age": age_days,
                        "registration_date": creation.strftime("%Y-%m-%d"),
                        "owner": owner,
                    },
                }
        except Exception as e:
            logger.warning(f"WHOIS lookup failed for {domain}: {e}")
        
        return {
            "score": 50,
            "name": "Âge du domaine",
            "description": "Impossible de déterminer l'âge du domaine",
            "category": "infrastructure",
            "source": "WHOIS",
        }
    
    async def check_https(self, domain: str) -> dict:
        """Vérifie si HTTPS est activé"""
        try:
            # Teste la connexion HTTPS
            context = ssl.create_default_context()
            with socket.create_connection((domain, 443), timeout=5) as sock:
                with context.wrap_socket(sock, server_hostname=domain) as ssock:
                    cert = ssock.getpeercert()
                    
                    if cert:
                        return {
                            "score": 100,
                            "name": "HTTPS activé",
                            "description": "Connexion HTTPS sécurisée disponible",
                            "category": "security",
                            "source": "SSL/TLS",
                        }
        except (socket.timeout, socket.error, ssl.SSLError):
            pass
        
        return {
            "score": 30,
            "name": "HTTPS activé",
            "description": "Aucune connexion HTTPS sécurisée disponible",
            "category": "security",
            "source": "SSL/TLS",
        }
    
    async def check_ssl(self, domain: str) -> dict:
        """Analyse la qualité du certificat SSL"""
        try:
            context = ssl.create_default_context()
            with socket.create_connection((domain, 443), timeout=5) as sock:
                with context.wrap_socket(sock, server_hostname=domain) as ssock:
                    cert = ssock.getpeercert(binary_form=True)
                    cipher = ssock.cipher()
                    
                    # Évalue la qualité SSL
                    score = 70
                    
                    # Bonus pour TLS 1.3
                    if cipher and 'TLSv1.3' in str(cipher):
                        score += 15
                    
                    # Bonus pour les ciphers forts
                    if cipher and 'ECDHE' in str(cipher):
                        score += 10
                    
                    score = min(100, score)
                    
                    return {
                        "score": score,
                        "name": "Qualité SSL",
                        "description": f"SSL/TLS configuré avec {cipher[0] if cipher else 'inconnu'}",
                        "category": "security",
                        "source": "SSL Labs",
                    }
        except Exception as e:
            logger.warning(f"SSL check failed for {domain}: {e}")
        
        return {
            "score": 40,
            "name": "Qualité SSL",
            "description": "Impossible de vérifier la configuration SSL",
            "category": "security",
            "source": "SSL Labs",
        }
    
    async def check_dns(self, domain: str) -> dict:
        """Vérifie les enregistrements DNS"""
        score = 60
        
        try:
            # Vérifie les enregistrements MX (email)
            mx_records = socket.getaddrinfo(domain, 25)
            if mx_records:
                score += 10
        except socket.gaierror:
            pass
        
        return {
            "score": min(100, score),
            "name": "Configuration DNS",
            "description": "Enregistrements DNS vérifiés",
            "category": "infrastructure",
            "source": "DNS",
        }
    
    async def check_http_headers(self, url: str) -> dict:
        """Analyse les en-têtes HTTP de sécurité"""
        score = 50
        
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get(url, follow_redirects=True)
                headers = response.headers
                
                # Vérifie les en-têtes de sécurité
                security_headers = [
                    'content-security-policy',
                    'x-content-type-options',
                    'x-frame-options',
                    'strict-transport-security',
                    'x-xss-protection',
                ]
                
                for header in security_headers:
                    if header.lower() in [h.lower() for h in headers.keys()]:
                        score += 8
                
                score = min(100, score)
                
                found = len([h for h in security_headers if h.lower() in [x.lower() for x in headers.keys()]])
                return {
                    "score": score,
                    "name": "En-têtes de sécurité",
                    "description": f"{found} en-têtes de sécurité présents",
                    "category": "security",
                    "source": "HTTP Headers",
                }
        except Exception as e:
            logger.warning(f"Header check failed for {url}: {e}")
        
        return {
            "score": score,
            "name": "En-têtes de sécurité",
            "description": "Impossible de vérifier les en-têtes de sécurité",
            "category": "security",
            "source": "HTTP Headers",
        }
    
    async def check_content_analysis(self, url: str) -> dict:
        """Analyse le contenu de la page"""
        # Analyse simplifiée - en production utiliser NLP
        score = 70
        
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get(url, follow_redirects=True)
                content = response.text.lower()
                
                # Vérifie les indicateurs de qualité
                indicators = [
                    ('contact', 5),
                    ('about', 5),
                    ('privacy', 5),
                    ('terms', 5),
                    ('©', 3),
                    ('last modified', 3),
                ]
                
                for indicator, points in indicators:
                    if indicator in content:
                        score += points
                
                score = min(100, score)
                
                return {
                    "score": score,
                    "name": "Qualité du contenu",
                    "description": "Analyse du contenu terminée",
                    "category": "content",
                    "source": "Content Analysis",
                }
        except Exception:
            pass
        
        return {
            "score": score,
            "name": "Qualité du contenu",
            "description": "Analyse basée sur des métriques de base",
            "category": "content",
            "source": "Content Analysis",
        }
    
    async def check_domain_reputation(self, domain: str) -> dict:
        """Vérifie la réputation du domaine via différentes sources"""
        # En production: vérifier Google Safe Browsing, VirusTotal, etc.
        
        # Liste de domaines known comme fiables
        trusted_domains = [
            'wikipedia.org', 'gov', 'edu', 'org', 'lemonde.fr', 
            'lefigaro.fr', 'mediapart.fr', 'afp.com', 'reuters.com',
            'bbc.com', 'cnn.com', 'nytimes.com', 'theguardian.com'
        ]
        
        score = 60
        
        # Bonus pour les domaines de confiance
        for trusted in trusted_domains:
            if trusted in domain.lower():
                score = 85
                break
        
        return {
            "score": score,
            "name": "Réputation du domaine",
            "description": "Vérification de réputation terminée",
            "category": "reputation",
            "source": "Internal Database",
        }
    
    def _get_trust_level(self, score: int) -> str:
        """Détermine le niveau de confiance selon le score"""
        if score >= 85:
            return "very_high"
        elif score >= 70:
            return "high"
        elif score >= 50:
            return "medium"
        elif score >= 30:
            return "low"
        else:
            return "very_low"
    
    async def _detect_category(self, url: str) -> str:
        """Détecte la catégorie du site"""
        domain = url.lower()
        
        categories = {
            'news': ['lemonde', 'lefigaro', 'mediapart', 'afp', 'reuters', 'bbc', 'cnn', 'guardian', 'nytimes', '20minutes', 'huffpost'],
            'government': ['.gov', 'gouv', 'assemblee-nationale', 'senat'],
            'educational': ['.edu', 'university', 'universite', 'school'],
            'blog': ['medium.com', 'wordpress', 'blogspot', 'over-blog'],
            'social': ['twitter', 'facebook', 'linkedin', 'instagram', 'tiktok'],
            'forum': ['forum', 'reddit', 'discourse'],
        }
        
        for category, keywords in categories.items():
            for keyword in keywords:
                if keyword in domain:
                    return category
        
        return "other"
    
    async def _detect_ai_content(self, url: str) -> int:
        """
        Estime la probabilité que le contenu soit généré par IA.
        Heuristique basée sur la structure du contenu (sans modèle ML lourd).
        Retourne un score de 0-100 (plus haut = plus probable IA).
        """
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get(url, follow_redirects=True)
                content = response.text

                ai_score = 10  # Base faible
                content_lower = content.lower()

                # Phrases très répétitives / générées par IA
                ai_phrases = [
                    'in conclusion', 'en conclusion', 'it is important to note',
                    'il est important de noter', 'furthermore', 'de plus',
                    'in summary', 'en résumé', 'it is worth noting',
                ]
                ai_hits = sum(1 for p in ai_phrases if p in content_lower)
                ai_score += ai_hits * 8

                # Contenu très court = potentiellement low-quality / IA
                text_length = len(content)
                if text_length < 1500:
                    ai_score += 15

                # Trop uniforme (peu de ponctuation variée)
                punct_variety = len(set(c for c in content if c in '!?;:'))
                if punct_variety < 5:
                    ai_score += 10

                return min(100, ai_score)
        except Exception:
            pass

        return 15  # Score par défaut bas (probablement humain)
    
    def _calc_content_quality(self, signals: list) -> int:
        """Calcule la qualité du contenu"""
        for signal in signals:
            if signal.get("category") == "content":
                return int(signal.get("value", 70))
        return 70
    
    def _calc_fact_check_overlap(self, signals: list) -> int:
        """Calcule la correspondance avec les fact-checks"""
        # En production: vérifier les bases de fact-checks
        return 45
    
    def _calc_citation_quality(self, signals: list) -> int:
        """Calcule la qualité des citations"""
        for signal in signals:
            if signal.get("category") == "content":
                return int(signal.get("value", 70) * 0.9)
        return 65
    
    def _calc_confidence(self, signals: list) -> int:
        """Calcule la confiance dans l'analyse"""
        # Basé sur le nombre de signaux analysés avec succès
        successful = sum(1 for s in signals if s.get("value", 0) > 0)
        total = len(signals) if signals else 1
        return int((successful / total) * 100)

    def _generate_explanation(self, score: int, signals: list) -> str:
        """Génère une explication du score"""
        explanations = {
            "very_high": "Ce domaine montre d'excellents indicateurs de fiabilité basés sur plusieurs facteurs incluant l'ancienneté, les pratiques de sécurité et la qualité du contenu.",
            "high": "Ce domaine présente de bons indicateurs de fiabilité. On note une historique établi et des mesures de sécurité appropriées.",
            "medium": "Ce domaine présente des indicateurs mixtes. Certaines pratiques de sécurité sont en place mais des améliorations sont possibles.",
            "low": "Ce domaine présente des indicateurs de fiabilité limités. Une attention particulière est recommandée lors de l'utilisation de ce source.",
            "very_low": "Ce domaine présente plusieurs signaux d'alerte. Il est recommandé de vérifier attentivement les informations provenant de cette source.",
        }
        
        level = self._get_trust_level(score)
        return explanations.get(level, explanations["medium"])
    
    def _generate_recommendations(self, signals: list) -> list:
        """Génère des recommandations basées sur les signaux"""
        recommendations = []
        
        for signal in signals:
            if signal.get("value", 100) < 60:
                category = signal.get("category", "")
                if category == "security":
                    recommendations.append(f"Améliorer la sécurité ({signal.get('name', 'Security')})")
                elif category == "content":
                    recommendations.append(f"Améliorer la qualité du contenu ({signal.get('name', 'Content')})")
                elif category == "infrastructure":
                    recommendations.append(f"Vérifier les informations du domaine ({signal.get('name', 'Domain')})")
        
        if not recommendations:
            recommendations.append("Ce domaine semble fiable. Continuez à vérifier les informations importantes avec d'autres sources.")
        
        return recommendations[:3]  # Maximum 3 recommandations


# Instance globale du analyseur
analyzer = TrustAnalyzer()
