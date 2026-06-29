"""
API v1 — all routes assembled.
"""

from fastapi import APIRouter
from app.api.v1.endpoints import trust, auth, search, narratives, sources

api_router = APIRouter()

api_router.include_router(trust.router,      prefix="/trust",      tags=["Trust Score"])
api_router.include_router(auth.router,       prefix="/auth",       tags=["Authentication"])
api_router.include_router(search.router,     prefix="/search",     tags=["Search"])
api_router.include_router(narratives.router, prefix="/narratives", tags=["Narratives"])
api_router.include_router(sources.router,    prefix="/sources",    tags=["Source Intelligence"])
