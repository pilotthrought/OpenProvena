"""
Application configuration — chargée depuis les variables d'environnement.

Sécurité production :
- SECRET_KEY, POSTGRES_URL, NEO4J_PASSWORD n'ont PAS de défaut utilisable en prod.
  Un validator bloque le démarrage si ENVIRONMENT=production et qu'une valeur
  par défaut/insecure est détectée.
- ALLOWED_HOSTS et CORS_ORIGINS sont fermés par défaut ; "*" est explicitement
  refusé en production.
"""

import json
import sys
from typing import List, Union

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings

# Valeurs connues comme non sécurisées — si retrouvées en production, on bloque.
INSECURE_DEFAULTS = {
    "INSECURE_DEV_KEY_CHANGE_ME_a8f3e9c21b",
    "dev_secret_change_in_production",
    "changeme",
    "secret",
    "",
}
INSECURE_DB_PASSWORDS = {"provena", "password", "postgres", "changeme", ""}


class Settings(BaseSettings):
    # ── App ─────────────────────────────────────────────────────────────────
    ENVIRONMENT: str = "development"  # "development" | "staging" | "production"
    SECRET_KEY: str = "INSECURE_DEV_KEY_CHANGE_ME_a8f3e9c21b"
    API_VERSION: str = "0.9.0"

    # ── Auth / JWT ───────────────────────────────────────────────────────────
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # ── Database ─────────────────────────────────────────────────────────────
    POSTGRES_URL: str = "postgresql+asyncpg://provena:provena@postgres:5432/openprovena"
    REDIS_URL: str = "redis://redis:6379/0"
    REDIS_PASSWORD: str = ""

    # ── Elasticsearch ────────────────────────────────────────────────────────
    ELASTICSEARCH_URL: str = "http://elasticsearch:9200"
    ELASTICSEARCH_INDEX_DOMAINS: str = "provena_domains"
    ELASTICSEARCH_INDEX_NARRATIVES: str = "provena_narratives"

    # ── Neo4j ────────────────────────────────────────────────────────────────
    NEO4J_URI: str = "bolt://neo4j:7687"
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str = "provena_neo4j"

    # ── Security ─────────────────────────────────────────────────────────────
    # Fermé par défaut. En dev, le docker-compose.dev.yml ouvre explicitement.
    ALLOWED_HOSTS: Union[List[str], str] = ["localhost", "127.0.0.1"]
    CORS_ORIGINS: Union[List[str], str] = ["http://localhost:3000"]

    @field_validator("ALLOWED_HOSTS", "CORS_ORIGINS", mode="before")
    @classmethod
    def parse_list(cls, v):
        """Parse JSON string → list si l'env var arrive comme string depuis Docker."""
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
            except (json.JSONDecodeError, ValueError):
                pass
            return [item.strip() for item in v.split(",") if item.strip()]
        return v

    # Rate limiting (req/min)
    RATE_LIMIT_DEFAULT: int = 60
    RATE_LIMIT_PREMIUM: int = 600
    RATE_LIMIT_ANONYMOUS: int = 10

    # ── Celery ───────────────────────────────────────────────────────────────
    CELERY_BROKER_URL: str = "amqp://provena:provena@rabbitmq:5672//"
    CELERY_RESULT_BACKEND: str = "redis://redis:6379/1"

    # ── Cache TTLs (seconds) ─────────────────────────────────────────────────
    CACHE_TTL_TRUST_SCORE: int = 3600
    CACHE_TTL_DOMAIN_META: int = 86400
    CACHE_TTL_NARRATIVES: int = 900

    # ── External APIs (optionnels) ───────────────────────────────────────────
    WHOIS_API_KEY: str = ""
    GOOGLE_SAFEBROWSING_KEY: str = ""
    VIRUSTOTAL_API_KEY: str = ""
    CLAIMBUSTER_API_KEY: str = ""

    # ── Observability ────────────────────────────────────────────────────────
    SENTRY_DSN: str = ""
    LOG_LEVEL: str = "INFO"

    # ── Scoring weights ──────────────────────────────────────────────────────
    SIGNAL_WEIGHTS: dict = {
        "domain_age":             0.08,
        "ownership_transparency": 0.12,
        "citation_quality":       0.13,
        "factcheck_overlap":      0.18,
        "editorial_quality":      0.12,
        "ai_content_detection":   0.10,
        "bot_amplification":      0.10,
        "narrative_propagation":  0.07,
        "security_risk":          0.05,
        "historical_reliability": 0.05,
    }

    # ── Garde-fous production ────────────────────────────────────────────────
    @model_validator(mode="after")
    def enforce_production_safety(self):
        """
        Bloque le démarrage si ENVIRONMENT=production et qu'une config
        non sécurisée est détectée. Évite de déployer en prod avec les
        valeurs par défaut de développement.
        """
        if self.ENVIRONMENT != "production":
            return self

        errors = []

        if self.SECRET_KEY in INSECURE_DEFAULTS or len(self.SECRET_KEY) < 32:
            errors.append(
                "SECRET_KEY manquant ou trop faible. "
                "Générez-en un avec: openssl rand -hex 32"
            )

        if "*" in self.ALLOWED_HOSTS:
            errors.append(
                "ALLOWED_HOSTS contient '*' en production. "
                "Listez les domaines exacts (ex: api.openprovena.org)."
            )

        if any("localhost" in o or "*" in o for o in self.CORS_ORIGINS):
            errors.append(
                "CORS_ORIGINS contient localhost ou '*' en production. "
                "Listez uniquement les domaines frontend exacts (https://...)."
            )

        for pw in INSECURE_DB_PASSWORDS:
            if f":{pw}@" in self.POSTGRES_URL:
                errors.append("POSTGRES_URL utilise un mot de passe par défaut faible.")
                break

        if self.NEO4J_PASSWORD in INSECURE_DB_PASSWORDS:
            errors.append("NEO4J_PASSWORD utilise une valeur par défaut faible.")

        if not self.POSTGRES_URL.startswith("postgresql+asyncpg://"):
            errors.append("POSTGRES_URL doit utiliser le driver asyncpg.")

        if errors:
            msg = "\n".join(f"  ✗ {e}" for e in errors)
            sys.stderr.write(
                f"\n{'='*70}\n"
                f"REFUS DE DÉMARRAGE — Configuration de production non sécurisée :\n"
                f"{msg}\n"
                f"Consultez .env.production.example pour la configuration attendue.\n"
                f"{'='*70}\n\n"
            )
            raise SystemExit(1)

        return self

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
        "extra": "ignore",
    }


settings = Settings()
