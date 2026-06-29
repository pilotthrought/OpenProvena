"""Structured logging setup (JSON in production, pretty in dev)."""

import logging
import sys
from app.core.config import settings


def setup_logging() -> logging.Logger:
    level = logging.DEBUG if settings.ENVIRONMENT == "development" else logging.INFO
    fmt = "%(asctime)s [%(levelname)s] %(name)s — %(message)s"
    logging.basicConfig(stream=sys.stdout, level=level, format=fmt)
    return logging.getLogger("openprovena")
