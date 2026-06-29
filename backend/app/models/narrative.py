from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, Text, JSON
from app.db.session import Base

class Narrative(Base):
    __tablename__ = "narratives"
    id           = Column(String, primary_key=True)
    title        = Column(String, nullable=False)
    description  = Column(Text)
    velocity     = Column(String)
    trend        = Column(String)
    source_count = Column(Integer, default=0)
    domain_cluster= Column(JSON)
    tags         = Column(JSON)
    detected_at  = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at   = Column(DateTime, onupdate=lambda: datetime.now(timezone.utc))
