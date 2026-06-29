from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime
from sqlalchemy.orm import relationship
from app.db.session import Base

class Domain(Base):
    __tablename__ = "domains"
    id           = Column(String, primary_key=True)
    name         = Column(String, nullable=False, index=True)
    domain_type  = Column(String)
    country      = Column(String(2))
    owner        = Column(String)
    registered_at= Column(DateTime)
    trust_score  = Column(Float)
    confidence   = Column(Float)
    tier         = Column(String)
    last_analyzed= Column(DateTime, default=lambda: datetime.now(timezone.utc))
    created_at   = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at   = Column(DateTime, onupdate=lambda: datetime.now(timezone.utc))
    signals      = relationship("SignalResult", back_populates="domain", cascade="all, delete")
