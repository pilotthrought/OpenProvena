"""
/v1/auth — Registration, login, token refresh, API key management.
"""

import secrets
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token, get_current_user
from app.db.session import get_db
from app.models import User
from app.schemas import RegisterRequest, LoginRequest, TokenResponse, UserResponse

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Create a new user account."""
    existing = await db.execute(select(User).where(User.email == request.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered.")

    user = User(
        id=str(uuid.uuid4()),
        email=request.email,
        hashed_password=hash_password(request.password),
        full_name=request.full_name,
        tier="free",
        api_key=f"opk_{secrets.token_urlsafe(32)}",
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate and receive JWT tokens."""
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials.",
        )
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled.")

    user.last_login = datetime.now(timezone.utc)
    await db.commit()

    return TokenResponse(
        access_token=create_access_token(user.id, {"email": user.email, "tier": user.tier}),
        refresh_token=create_refresh_token(user.id),
        expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(body: dict, db: AsyncSession = Depends(get_db)):
    """Exchange a refresh token for a new access token."""
    token = body.get("refresh_token")
    if not token:
        raise HTTPException(status_code=422, detail="refresh_token required.")
    payload = decode_token(token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token.")

    user = await db.get(User, payload["sub"])
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or disabled.")

    return TokenResponse(
        access_token=create_access_token(user.id, {"email": user.email, "tier": user.tier}),
        refresh_token=create_refresh_token(user.id),
        expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.get("/me", response_model=UserResponse)
async def me(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return the authenticated user's profile."""
    user = await db.get(User, current_user["sub"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return user


@router.post("/me/rotate-api-key")
async def rotate_api_key(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate a new API key (invalidates the old one)."""
    user = await db.get(User, current_user["sub"])
    user.api_key = f"opk_{secrets.token_urlsafe(32)}"
    await db.commit()
    return {"api_key": user.api_key, "message": "API key rotated successfully."}
