"""
Celery worker — OpenProvena async task queue.
Usage: celery -A app.worker worker --loglevel=info
"""

from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "openprovena",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_routes={
        "app.tasks.analyze_domain": {"queue": "trust"},
        "app.tasks.crawl_domain":   {"queue": "crawl"},
    },
)

# Expose as `worker` for `celery -A app.worker`
worker = celery_app
