"""
Async PostgreSQL session factory via SQLAlchemy 2.0.
init_db() est resilient : retry avec backoff si PG n'est pas encore prêt.
"""

import asyncio
import logging
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

logger = logging.getLogger("openprovena")

engine = create_async_engine(
    settings.POSTGRES_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    echo=settings.ENVIRONMENT == "development",
)

AsyncSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


class Base(DeclarativeBase):
    pass


async def get_db():
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
    Crée les tables au démarrage.
    Retry avec backoff exponentiel si PostgreSQL n'est pas encore prêt —
    évite le crash au premier démarrage Docker quand PG est lent.
    """
    from app.models import domain, user, signal_result, narrative  # noqa: F401

    max_attempts = 10
    for attempt in range(1, max_attempts + 1):
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            logger.info("Database initialized successfully.")
            return
        except Exception as e:
            wait = min(2 ** attempt, 30)
            logger.warning(
                f"Database not ready (attempt {attempt}/{max_attempts}): {e}. "
                f"Retrying in {wait}s…"
            )
            if attempt == max_attempts:
                logger.error("Could not connect to database after max attempts. Continuing without DB init.")
                return
            await asyncio.sleep(wait)
