"""
OpenProvena Backend - Application principale FastAPI
Point d'entrée de l'API REST/GraphQL
"""

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.core.config import settings
from app.core.database import init_db, close_db
from app.api.routes import (
    analyze,
    search,
    dashboard,
    narratives,
    graph,
    health,
)

# Configuration du logging
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    """
    Gestionnaire du cycle de vie de l'application
    Exécute les actions au démarrage et à l'arrêt
    """
    # === Démarrage ===
    logger.info(f"Démarrage de {settings.app_name} v{settings.app_version}")
    
    try:
        # Initialise la base de données
        await init_db()
        logger.info("Base de données initialisée")
    except Exception as e:
        logger.error(f"Erreur lors de l'initialisation de la DB: {e}")
        # Continue même si la DB n'est pas prête (dev mode)
    
    yield
    
    # === Arrêt ===
    logger.info("Arrêt de l'application...")
    await close_db()
    logger.info("Connexions fermées")


# Création de l'application FastAPI
app = FastAPI(
    title=settings.app_name,
    description="""
## OpenProvena API

API pour l'analyse de la crédibilité de l'information.

### Fonctionnalités

- **Trust Analysis**: Analyse approfondie de la confiance d'une source
- **Narrative Tracking**: Suivi des narratifs et de leur propagation
- **Knowledge Graph**: Exploration des relations entre sources
- **Dashboard**: Statistiques et métriques globales

### Authentification

L'API supporte l'authentification JWT via Bearer token.
Certaines endpoints sont publiques, d'autres nécessitent une authentification.
    """,
    version=settings.app_version,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# ============================================
# Middlewares
# ============================================

# Compression GZip pour réduire la taille des réponses
app.add_middleware(GZipMiddleware, minimum_size=1000)

# CORS - Gestion des requêtes cross-origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
)

# Protection contre les attaques par host header
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"]  # En production: limiter aux domaines autorisés
)


# ============================================
# Exception Handlers
# ============================================

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError
) -> JSONResponse:
    """Gère les erreurs de validation des requêtes"""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Erreur de validation",
                "details": exc.errors(),
                "timestamp": None
            }
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(
    request: Request,
    exc: Exception
) -> JSONResponse:
    """Gère les erreurs non gérées"""
    logger.error(f"Erreur non gérée: {exc}", exc_info=True)
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "Une erreur interne s'est produite",
                "details": None,
                "timestamp": None
            }
        }
    )


# ============================================
# Routes
# ============================================

# Health check - endpoint de base
app.include_router(health, tags=["Health"])

# Endpoints d'analyse de confiance
app.include_router(
    analyze,
    prefix=settings.api_v1_prefix,
    tags=["Trust Analysis"]
)

# Endpoints de recherche
app.include_router(
    search,
    prefix=settings.api_v1_prefix,
    tags=["Search"]
)

# Endpoints du dashboard
app.include_router(
    dashboard,
    prefix=settings.api_v1_prefix,
    tags=["Dashboard"]
)

# Endpoints des narratifs
app.include_router(
    narratives,
    prefix=settings.api_v1_prefix,
    tags=["Narratives"]
)

# Endpoints du graphe de connaissances
app.include_router(
    graph,
    prefix=settings.api_v1_prefix,
    tags=["Knowledge Graph"]
)


# ============================================
# Route racine
# ============================================

@app.get("/", tags=["Root"])
async def root():
    """Route racine avec informations sur l'API"""
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "description": settings.app_description,
        "docs": "/docs",
        "health": "/api/v1/health"
    }


# ============================================
# Point d'entrée pour uvicorn
# ============================================

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        workers=settings.workers,
        reload=settings.debug,
    )
