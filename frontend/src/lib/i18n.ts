export type Locale = "fr" | "en";

export const translations = {
  fr: {
    // Masthead
    "masthead.since": "Open Source · Depuis 2025",
    "masthead.tagline": "Un standard ouvert pour évaluer la crédibilité de l'information",
    "masthead.version": "v0.9 · Bêta",
    "nav.search": "Trust Search",
    "nav.dashboard": "Tableau de bord",
    "nav.narratives": "Narratives",
    "nav.api": "API",

    // Search page
    "search.placeholder": "Entrez une URL, un domaine ou une affirmation…",
    "search.button": "Analyser",
    "search.try": "Essayez :",
    "search.loading": "Lancement des 10 agents de signal…",
    "search.stats.signals": "Signaux analysés",
    "search.stats.signals.sub": "par domaine",
    "search.stats.sources": "Sources indexées",
    "search.stats.sources.sub": "domaines actifs",
    "search.stats.factchecks": "Fact-checks",
    "search.stats.factchecks.sub": "vérifications liées",
    "search.recent": "Analyses récentes",

    // Trust card
    "trust.source": "Source analysée",
    "trust.score": "Trust Score",
    "trust.confidence": "confiance",
    "trust.signals": "Décomposition des signaux",
    "trust.analysis": "Analyse éditoriale",
    "trust.cached": "Résultat en cache · analysé le",
    "trust.deep": "Demander une analyse approfondie",
    "trust.hint": "Passez la souris sur un signal pour voir le détail",

    // Tiers
    "tier.HIGH": "Fiable",
    "tier.MEDIUM": "Modéré",
    "tier.LOW": "Faible fiabilité",
    "tier.CRITICAL": "Risque critique",

    // Signal names
    "signal.domain_age": "Âge du domaine",
    "signal.ownership_transparency": "Transparence propriété",
    "signal.citation_quality": "Qualité des citations",
    "signal.factcheck_overlap": "Fact-checks croisés",
    "signal.editorial_quality": "Qualité éditoriale",
    "signal.ai_content_detection": "Contenu IA généré",
    "signal.bot_amplification": "Amplification bot",
    "signal.narrative_propagation": "Propagation narrative",
    "signal.security_risk": "Risque sécurité",
    "signal.historical_reliability": "Fiabilité historique",

    // Dashboard
    "dashboard.api_error": "API backend non joignable — données de démonstration",
    "dashboard.analyses": "Analyses aujourd'hui",
    "dashboard.avg_score": "Score moyen",
    "dashboard.avg_score.sub": "sur 100",
    "dashboard.alerts": "Alertes actives",
    "dashboard.alerts.sub": "désinformation détectée",
    "dashboard.api_calls": "API calls ce mois",
    "dashboard.distribution": "Distribution des scores (30 derniers jours)",
    "dashboard.top_signals": "Top signaux détectés",
    "dashboard.recent": "Dernières analyses en temps réel",
    "dashboard.table.domain": "Domaine",
    "dashboard.table.score": "Score",
    "dashboard.table.tier": "Tier",
    "dashboard.table.confidence": "Confiance",
    "dashboard.table.analyzed": "Analysé",

    // Narratives
    "narratives.title": "Narratives émergentes",
    "narratives.subtitle": "Clusters de désinformation détectés et en propagation active",
    "narratives.filter.all": "Toutes",
    "narratives.filter.fast": "Rapide",
    "narratives.filter.moderate": "Modérée",
    "narratives.filter.slow": "Lente",
    "narratives.loading": "Chargement des narratives…",
    "narratives.sources": "sources actives",
    "narratives.detected": "Détecté le",
    "narratives.updated": "mis à jour le",
    "narratives.velocity.fast": "Propagation rapide",
    "narratives.velocity.moderate": "Propagation modérée",
    "narratives.velocity.slow": "Propagation lente",

    // API docs
    "api.title": "API publique REST",
    "api.subtitle": "Intégrez OpenProvena dans vos applications",
    "api.base_url": "Base URL",
    "api.param": "Paramètre",
    "api.required": "Requis",
    "api.description": "Description",
    "api.example": "Exemple",
    "api.response": "Réponse JSON",
    "api.auth.title": "Authentification",
    "api.auth.desc": "Deux méthodes : Bearer JWT (utilisateurs enregistrés) ou header X-API-Key.",
    "api.limits.title": "Limites de débit",
    "api.limits.tier": "Tier",
    "api.limits.limit": "Limite",
    "api.limits.window": "Fenêtre",
    "api.limits.anonymous": "Anonyme",
    "api.limits.authenticated": "Authentifié",
    "api.limits.apikey": "API Key",
    "api.limits.window_val": "Fenêtre glissante 60s",
  },

  en: {
    // Masthead
    "masthead.since": "Open Source · Since 2025",
    "masthead.tagline": "An open standard to evaluate information credibility",
    "masthead.version": "v0.9 · Beta",
    "nav.search": "Trust Search",
    "nav.dashboard": "Dashboard",
    "nav.narratives": "Narratives",
    "nav.api": "API",

    // Search page
    "search.placeholder": "Enter a URL, domain or claim…",
    "search.button": "Analyze",
    "search.try": "Try:",
    "search.loading": "Running 10 signal agents…",
    "search.stats.signals": "Signals analyzed",
    "search.stats.signals.sub": "per domain",
    "search.stats.sources": "Indexed sources",
    "search.stats.sources.sub": "active domains",
    "search.stats.factchecks": "Fact-checks",
    "search.stats.factchecks.sub": "linked verifications",
    "search.recent": "Recent analyses",

    // Trust card
    "trust.source": "Source analyzed",
    "trust.score": "Trust Score",
    "trust.confidence": "confidence",
    "trust.signals": "Signal breakdown",
    "trust.analysis": "Editorial analysis",
    "trust.cached": "Cached result · analyzed on",
    "trust.deep": "Request in-depth analysis",
    "trust.hint": "Hover a signal to see details",

    // Tiers
    "tier.HIGH": "Reliable",
    "tier.MEDIUM": "Mixed",
    "tier.LOW": "Low reliability",
    "tier.CRITICAL": "Critical risk",

    // Signal names
    "signal.domain_age": "Domain age",
    "signal.ownership_transparency": "Ownership transparency",
    "signal.citation_quality": "Citation quality",
    "signal.factcheck_overlap": "Fact-check overlap",
    "signal.editorial_quality": "Editorial quality",
    "signal.ai_content_detection": "AI-generated content",
    "signal.bot_amplification": "Bot amplification",
    "signal.narrative_propagation": "Narrative propagation",
    "signal.security_risk": "Security risk",
    "signal.historical_reliability": "Historical reliability",

    // Dashboard
    "dashboard.api_error": "API backend unreachable — showing demo data",
    "dashboard.analyses": "Analyses today",
    "dashboard.avg_score": "Average score",
    "dashboard.avg_score.sub": "out of 100",
    "dashboard.alerts": "Active alerts",
    "dashboard.alerts.sub": "disinformation detected",
    "dashboard.api_calls": "API calls this month",
    "dashboard.distribution": "Score distribution (last 30 days)",
    "dashboard.top_signals": "Top detected signals",
    "dashboard.recent": "Real-time recent analyses",
    "dashboard.table.domain": "Domain",
    "dashboard.table.score": "Score",
    "dashboard.table.tier": "Tier",
    "dashboard.table.confidence": "Confidence",
    "dashboard.table.analyzed": "Analyzed",

    // Narratives
    "narratives.title": "Emerging narratives",
    "narratives.subtitle": "Detected disinformation clusters in active propagation",
    "narratives.filter.all": "All",
    "narratives.filter.fast": "Fast",
    "narratives.filter.moderate": "Moderate",
    "narratives.filter.slow": "Slow",
    "narratives.loading": "Loading narratives…",
    "narratives.sources": "active sources",
    "narratives.detected": "Detected on",
    "narratives.updated": "updated on",
    "narratives.velocity.fast": "Fast propagation",
    "narratives.velocity.moderate": "Moderate propagation",
    "narratives.velocity.slow": "Slow propagation",

    // API docs
    "api.title": "Public REST API",
    "api.subtitle": "Integrate OpenProvena into your applications",
    "api.base_url": "Base URL",
    "api.param": "Parameter",
    "api.required": "Required",
    "api.description": "Description",
    "api.example": "Example",
    "api.response": "JSON Response",
    "api.auth.title": "Authentication",
    "api.auth.desc": "Two methods: Bearer JWT (registered users) or X-API-Key header.",
    "api.limits.title": "Rate limits",
    "api.limits.tier": "Tier",
    "api.limits.limit": "Limit",
    "api.limits.window": "Window",
    "api.limits.anonymous": "Anonymous",
    "api.limits.authenticated": "Authenticated",
    "api.limits.apikey": "API Key",
    "api.limits.window_val": "60s sliding window",
  },
} as const;

export type TranslationKey = keyof typeof translations.fr;

export function t(locale: Locale, key: TranslationKey): string {
  return translations[locale][key] ?? translations.fr[key] ?? key;
}
