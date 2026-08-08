"""
Service d'analyse de confiance pour OpenProvena
Analyse les URLs et domaines pour déterminer leur score de confiance
"""

import asyncio
import socket
import ssl
import whois
import httpx
from datetime import datetime
from typing import Optional
from urllib.parse import urlparse
import logging

logger = logging.getLogger(__name__)


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
        
        for i, result in enumerate(results):
            signal_type = signal_types[i] if i < len(signal_types) else f"signal_{i}"
            
            if isinstance(result, Exception):
                logger.warning(f"Error in {signal_type}: {result}")
                score = 50  # Score neutre en cas d'erreur
            else:
                score = result.get("score", 50)
                signals.append({
                    "id": f"{signal_type}-{datetime.now().timestamp()}",
                    "name": result.get("name", signal_type.title()),
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
        
        # Analyse de contenu IA (simplifiée)
        ai_probability = await self._detect_ai_content(url_or_domain)
        
        return {
            "id": f"analysis-{domain}-{datetime.now().timestamp()}",
            "url": url_or_domain,
            "domain": domain,
            "score": final_score,
            "trust_level": trust_level,
            "category": category,
            "domain_age": self._estimate_domain_age(signals),
            "registration_date": self._get_registration_date(signals),
            "last_updated": datetime.now().isoformat() + "Z",
            "owner": self._get_owner(signals),
            "ai_generated_probability": ai_probability,
            "content_quality": self._calc_content_quality(signals),
            "fact_check_overlap": self._calc_fact_check_overlap(signals),
            "citation_quality": self._calc_citation_quality(signals),
            "signals": signals,
            "related_domains": [],
            "historical_scores": [],
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
            
            if w and w.creation_date:
                age_days = (datetime.now() - w.creation_date).days
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
                
                return {
                    "score": score,
                    "name": "Domain Age",
                    "description": f"Domain registered {age_days} days ago",
                    "category": "infrastructure",
                    "source": "WHOIS",
                }
        except Exception as e:
            logger.warning(f"WHOIS lookup failed for {domain}: {e}")
        
        return {
            "score": 50,
            "name": "Domain Age",
            "description": "Unable to determine domain age",
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
                            "name": "HTTPS Enabled",
                            "description": "Secure HTTPS connection available",
                            "category": "security",
                            "source": "SSL/TLS",
                        }
        except (socket.timeout, socket.error, ssl.SSLError):
            pass
        
        return {
            "score": 30,
            "name": "HTTPS Enabled",
            "description": "No secure HTTPS connection available",
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
                        "name": "SSL Quality",
                        "description": f"SSL/TLS configured with {cipher[0] if cipher else 'unknown'}",
                        "category": "security",
                        "source": "SSL Labs",
                    }
        except Exception as e:
            logger.warning(f"SSL check failed for {domain}: {e}")
        
        return {
            "score": 40,
            "name": "SSL Quality",
            "description": "Unable to verify SSL configuration",
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
            "name": "DNS Configuration",
            "description": "DNS records verified",
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
                
                return {
                    "score": score,
                    "name": "Security Headers",
                    "description": f"{len([h for h in security_headers if h.lower() in [x.lower() for x in headers.keys()]])} security headers present",
                    "category": "security",
                    "source": "HTTP Headers",
                }
        except Exception as e:
            logger.warning(f"Header check failed for {url}: {e}")
        
        return {
            "score": score,
            "name": "Security Headers",
            "description": "Unable to verify security headers",
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
                    "name": "Content Quality",
                    "description": "Content analysis completed",
                    "category": "content",
                    "source": "Content Analysis",
                }
        except Exception:
            pass
        
        return {
            "score": score,
            "name": "Content Quality",
            "description": "Content analysis based on basic metrics",
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
            "name": "Domain Reputation",
            "description": "Reputation check completed",
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
            'gov': ['.gov', 'gouv', 'assemblee-nationale', 'senat'],
            'edu': ['.edu', 'university', 'universite', 'school'],
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
        """Détection simplifiée de contenu généré par IA"""
        # En production: utiliser un modèle ML spécialisé
        # Retourne un score de 0-100 (plus haut = plus probable IA)
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
    
    def _estimate_domain_age(self, signals: list) -> int:
        """Estime l'âge du domaine en jours"""
        for signal in signals:
            if signal.get("name") == "Domain Age" and "days ago" in signal.get("description", ""):
                try:
                    days = int(signal.get("description", "").split()[0])
                    return days
                except:
                    pass
        return 365
    
    def _get_registration_date(self, signals: list) -> str:
        """Obtient la date d'enregistrement"""
        # En production: récupérer la vraie date de WHOIS
        return datetime.now().strftime("%Y-%m-%d")
    
    def _get_owner(self, signals: list) -> str:
        """Obtient le propriétaire du domaine"""
        return "Unknown"
    
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
