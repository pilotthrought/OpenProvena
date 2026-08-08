"""
Application Celery pour OpenProvena
Définit le broker et le backend de résultats depuis la configuration centralisée.
Référencé par `celery -A app.celery_app worker` dans docker-compose.
"""

from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "openprovena",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)

celery_app.autodiscover_tasks(["app.services"])
