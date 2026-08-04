"""
Configuration de la base de données PostgreSQL
Gère les connexions et les sessions SQLAlchemy
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    create_async_engine,
    async_sessionmaker,
)
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool

from app.core.config import settings


# Création du moteur de base de données async
engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,  # Affiche les requêtes SQL en mode debug
    pool_size=settings.database_pool_size,
    max_overflow=settings.database_max_overflow,
    pool_pre_ping=True,  # Vérifie la connexion avant chaque utilisation
    poolclass=NullPool,  # Utiliser NullPool pour les environments serverless
)

# Session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    """Base class pour tous les modèles SQLAlchemy"""
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Générateur de session de base de données
    Utilisé comme dépendance FastAPI
    
    Yields:
        Session SQLAlchemy async
    """
    async with AsyncSessionLocal() as session:
        try:
            # Exécute les opérations dans un transaction
            yield session
            await session.commit()
        except Exception:
            # Rollback en cas d'erreur
            await session.rollback()
            raise
        finally:
            # Ferme la session proprement
            await session.close()


@asynccontextmanager
async def get_db_context() -> AsyncGenerator[AsyncSession, None]:
    """
    Contexte manager pour les sessions de base de données
    Utile pour les scripts et les tâches Celery
    
    Yields:
        Session SQLAlchemy async
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """
    Initialise la base de données
    Crée toutes les tables si elles n'existent pas
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db():
    """
    Ferme les connexions à la base de données
    Appelé à l'arrêt de l'application
    """
    await engine.dispose()
