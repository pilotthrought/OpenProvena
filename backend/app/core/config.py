"""
Configuration centralisée pour OpenProvena Backend
Gère les variables d'environnement et les paramètres de l'application
"""

from functools import lru_cache
from typing import List, Optional

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Configuration de l'application OpenProvena
    Charge les valeurs depuis les variables d'environnement
    """
    
    # Configuration du modèle
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )
    
    # === Informations de l'application ===
    app_name: str = "OpenProvena"
    app_version: str = "1.0.0"
    app_description: str = "Open standard for assessing information credibility"
    debug: bool = Field(default=False)
    
    # === Configuration du serveur ===
    host: str = "0.0.0.0"
    port: int = 8000
    workers: int = 4
    
    # === URLs de base ===
    api_v1_prefix: str = "/api/v1"
    frontend_url: str = "http://localhost:3000"
    
    # === Base de données PostgreSQL ===
    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/openprovena",
        description="URL de connexion à PostgreSQL"
    )
    database_pool_size: int = 20
    database_max_overflow: int = 10
    
    # === Neo4j pour le Knowledge Graph ===
    neo4j_url: str = "bolt://localhost:7687"
    neo4j_user: str = "neo4j"
    neo4j_password: str = "password"
    
    # === Redis Cache ===
    redis_url: str = "redis://localhost:6379/0"
    redis_cache_ttl: int = 3600  # 1 hour default
    
    # === Celery / RQ pour les tâches asynchrones ===
    celery_broker_url: str = "redis://localhost:6379/1"
    celery_result_backend: str = "redis://localhost:6379/2"
    
    # === Sécurité ===
    secret_key: str = Field(
        default="change-me-in-production",
        description="Clé secrète pour JWT et sessions"
    )
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    
    # === CORS ===
    cors_origins: List[str] = [
        "http://localhost:3000",
        "https://openprovena.org",
    ]
    
    # === Rate Limiting ===
    rate_limit_per_minute: int = 60
    rate_limit_burst: int = 10
    
    # === Services externes ===
    whois_api_key: Optional[str] = None
    ssl_labs_api_key: Optional[str] = None
    
    # === ML/NLP ===
    model_cache_dir: str = "./models"
    device: str = "cpu"  # ou "cuda" si GPU disponible
    
    # === Logging ===
    log_level: str = "INFO"
    log_format: str = "json"  # ou "text"
    
    @field_validator("debug", mode="before")
    @classmethod
    def set_debug(cls, v):
        """Convertit la chaîne 'true'/'false' en booléen"""
        if isinstance(v, str):
            return v.lower() in ("true", "1", "yes")
        return v


@lru_cache()
def get_settings() -> Settings:
    """
    Retourne les settings de l'application
    Utilise LRU cache pour éviter de recharger la config à chaque appel
    """
    return Settings()


# Instance globale des settings
settings = get_settings()
