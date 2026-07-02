"""
OpenProvena — Backend API
"""

import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time

from app.core.config import settings
from app.core.logging import setup_logging
from app.core.security import RateLimitMiddleware
from app.api.v1.router import api_router

logger = setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup : lance init_db() en tâche de fond pour ne pas bloquer uvicorn.
    /health répond immédiatement ; la DB se connecte en arrière-plan.
    """
    logger.info("OpenProvena API starting…")
    asyncio.create_task(_init_db_background())
    yield
    logger.info("OpenProvena API shutting down.")


async def _init_db_background():
    """
    Init DB en arrière-plan avec retry.
    Ne bloque jamais le démarrage de l'API.
    """
    from app.db.session import init_db
    try:
        await init_db()
    except Exception as e:
        logger.error(f"Background DB init failed: {e}")


app = FastAPI(
    title="OpenProvena API",
    description="Open Trust Infrastructure — credibility scoring for information sources.",
    version="0.9.0",
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
    openapi_url="/openapi.json" if settings.ENVIRONMENT != "production" else None,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type", "X-OpenProvena-Version"],
)
app.add_middleware(RateLimitMiddleware)


@app.middleware("http")
async def add_process_time_header(request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    response.headers["X-Process-Time"] = f"{(time.perf_counter() - start) * 1000:.2f}ms"
    return response


app.include_router(api_router, prefix="/v1")


@app.get("/health", tags=["system"])
async def health():
    """Toujours disponible immédiatement — indépendant de la DB."""
    return {"status": "ok", "version": "0.9.0", "service": "openprovena-api"}


@app.get("/", tags=["system"])
async def root():
    return {
        "service": "OpenProvena API",
        "version": "0.9.0",
        "docs": "/docs",
        "standard": "https://openprovena.org",
    }


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "internal_server_error", "detail": "An unexpected error occurred."},
    )
