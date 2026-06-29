"""
Pydantic v2 schemas — API request/response contracts.
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, EmailStr, field_validator
import re


# ── Common ────────────────────────────────────────────────────────────────

class SignalDetail(BaseModel):
    signal_name: str
    normalized_score: float = Field(ge=0, le=100)
    weight: float = Field(ge=0, le=1)
    weighted_score: float
    detail: str
    confidence: float = Field(ge=0, le=1)

    class Config:
        from_attributes = True


class PaginationMeta(BaseModel):
    total: int
    page: int
    per_page: int
    pages: int


# ── Trust Score ───────────────────────────────────────────────────────────

class TrustScoreRequest(BaseModel):
    domain: str = Field(..., examples=["lemonde.fr"])
    signals: str = Field("all", description="Comma-separated signal names, or 'all'")
    explain: bool = Field(True, description="Include per-signal explanations")
    force_refresh: bool = Field(False, description="Bypass cache and recompute")

    @field_validator("domain")
    @classmethod
    def clean_domain(cls, v: str) -> str:
        v = re.sub(r"^https?://", "", v.strip().lower())
        v = v.split("/")[0]
        if not re.match(r"^[a-z0-9][a-z0-9\-\.]{1,253}[a-z0-9]$", v):
            raise ValueError("Invalid domain format.")
        return v


class TrustScoreResponse(BaseModel):
    domain: str
    trust_score: float = Field(ge=0, le=100)
    confidence: float = Field(ge=0, le=1)
    tier: str                                   # HIGH / MEDIUM / LOW / CRITICAL
    domain_type: Optional[str] = None
    country: Optional[str] = None
    owner: Optional[str] = None
    signals: List[SignalDetail] = []
    summary: Optional[str] = None
    last_analyzed: datetime
    cached: bool = False
    version: str = "0.9.0"

    class Config:
        from_attributes = True


# ── Narratives ────────────────────────────────────────────────────────────

class NarrativeResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    velocity: str
    trend: str
    source_count: int
    domain_cluster: List[str] = []
    tags: List[str] = []
    detected_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class NarrativeListResponse(BaseModel):
    items: List[NarrativeResponse]
    meta: PaginationMeta


# ── Auth ──────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    full_name: Optional[str] = None

    @field_validator("password")
    @classmethod
    def strong_password(cls, v: str) -> str:
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one digit.")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str]
    tier: str
    api_key: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ── Search ────────────────────────────────────────────────────────────────

class SearchRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=500)
    filters: Dict[str, Any] = {}
    page: int = Field(1, ge=1)
    per_page: int = Field(20, ge=1, le=100)


class SearchResult(BaseModel):
    domain: str
    trust_score: Optional[float]
    tier: Optional[str]
    snippet: Optional[str]
    score: float                    # Elasticsearch relevance score


class SearchResponse(BaseModel):
    results: List[SearchResult]
    meta: PaginationMeta
    took_ms: float


# ── Source Intelligence ───────────────────────────────────────────────────

class SourceIntelligenceResponse(BaseModel):
    domain: str
    owner: Optional[str]
    registrant_country: Optional[str]
    registered_at: Optional[datetime]
    domain_age_days: Optional[int]
    ssl_valid: Optional[bool]
    related_domains: List[str] = []
    editorial_notes: Optional[str]
    funding_transparency: Optional[str]
    fact_check_references: List[str] = []
