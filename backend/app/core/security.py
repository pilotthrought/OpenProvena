"""
Security: JWT authentication, API key validation, rate limiting middleware.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, Annotated
import logging

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import redis.asyncio as aioredis

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer(auto_error=False)


# ── Password hashing ──────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# ── JWT tokens ────────────────────────────────────────────────────────────

def create_access_token(subject: str, extra: dict = {}) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {"sub": subject, "exp": expire, "type": "access", **extra}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(subject: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS
    )
    payload = {"sub": subject, "exp": expire, "type": "refresh"}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ── Dependencies ──────────────────────────────────────────────────────────

async def get_current_user(
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(bearer_scheme)]
):
    """Extract and validate the current user from Bearer token."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_token(credentials.credentials)
    if payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type.")
    return payload


async def get_optional_user(
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(bearer_scheme)]
) -> Optional[dict]:
    """Return user payload if authenticated, None otherwise (for public endpoints)."""
    if not credentials:
        return None
    try:
        payload = decode_token(credentials.credentials)
        return payload if payload.get("type") == "access" else None
    except HTTPException:
        return None


# ── API Key header support ────────────────────────────────────────────────

async def get_api_key(request: Request) -> Optional[str]:
    """Extract API key from X-API-Key header."""
    return request.headers.get("X-API-Key")


# ── Rate limiting middleware ──────────────────────────────────────────────

class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Token-bucket rate limiting per API key or IP.
    Limits stored in Redis with sliding window.
    """

    EXEMPT_PATHS = {"/health", "/", "/docs", "/redoc", "/openapi.json"}

    async def dispatch(self, request: Request, call_next):
        if request.url.path in self.EXEMPT_PATHS:
            return await call_next(request)

        # Identify the caller
        api_key = request.headers.get("X-API-Key")
        auth = request.headers.get("Authorization", "")
        identifier = api_key or (auth[7:20] if auth.startswith("Bearer ") else None) or request.client.host

        # Determine limit tier
        if api_key:
            limit = settings.RATE_LIMIT_PREMIUM
        elif auth:
            limit = settings.RATE_LIMIT_DEFAULT
        else:
            limit = settings.RATE_LIMIT_ANONYMOUS

        try:
            redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
            key = f"rl:{identifier}"
            count = await redis_client.incr(key)
            if count == 1:
                await redis_client.expire(key, 60)
            await redis_client.aclose()

            if count > limit:
                return JSONResponse(
                    status_code=429,
                    content={
                        "error": "rate_limit_exceeded",
                        "detail": f"Rate limit: {limit} requests/minute.",
                        "retry_after": 60,
                    },
                    headers={"Retry-After": "60", "X-RateLimit-Limit": str(limit)},
                )
        except Exception as e:
            # Redis indisponible — fail-open pour ne pas bloquer le trafic légitime,
            # mais on log bruyamment car cela désactive silencieusement la protection.
            logging.getLogger("openprovena.security").warning(
                f"Rate limiter dégradé — Redis indisponible, requêtes non limitées: {e}"
            )

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(limit)
        return response
