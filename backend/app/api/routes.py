"""
Routes API pour OpenProvena
Module qui organise les différents routers de l'application
"""

from fastapi import APIRouter

# Import des routers
from app.api.endpoints import (
    analyze,
    search,
    dashboard,
    narratives,
    graph,
    health,
)

__all__ = [
    "analyze",
    "search",
    "dashboard",
    "narratives",
    "graph",
    "health",
]
