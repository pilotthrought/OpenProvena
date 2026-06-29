from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime
from app.db.session import Base

class User(Base):
    __tablename__ = "users"
    id              = Column(String, primary_key=True)
    email           = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    full_name       = Column(String)
    tier            = Column(String, default="free")
    api_key         = Column(String, unique=True, index=True)
    is_active       = Column(Boolean, default=True)
    is_admin        = Column(Boolean, default=False)
    created_at      = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_login      = Column(DateTime)
