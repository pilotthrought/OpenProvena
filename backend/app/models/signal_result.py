from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.db.session import Base

class SignalResult(Base):
    __tablename__ = "signal_results"
    id               = Column(Integer, primary_key=True, autoincrement=True)
    domain_id        = Column(String, ForeignKey("domains.id"), nullable=False, index=True)
    signal_name      = Column(String, nullable=False)
    raw_value        = Column(JSON)
    normalized_score = Column(Float)
    weight           = Column(Float)
    weighted_score   = Column(Float)
    detail           = Column(Text)
    confidence       = Column(Float)
    computed_at      = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    domain           = relationship("Domain", back_populates="signals")
