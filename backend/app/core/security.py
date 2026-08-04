"""
Module de sécurité pour OpenProvena
Gère l'authentification, l'autorisation et la protection des données
"""

from datetime import datetime, timedelta
from typing import Optional, Any, Union

from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer, HTTPBearer, HTTPAuthorizationCredentials

from app.core.config import settings


# Configuration du hachage des mots de passe
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12
)

# Configuration OAuth2
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.api_v1_prefix}/auth/token",
    auto_error=False
)

# Configuration Bearer Token
bearer_scheme = HTTPBearer(auto_error=False)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Vérifie si le mot de passe en clair correspond au hash
    
    Args:
        plain_password: Mot de passe en clair
        hashed_password: Hash du mot de passe à vérifier
        
    Returns:
        True si les mots de passe correspondent
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Génère un hash sécurisé pour le mot de passe
    
    Args:
        password: Mot de passe à hasher
        
    Returns:
        Hash bcrypt du mot de passe
    """
    return pwd_context.hash(password)


def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Crée un token JWT pour l'authentification
    
    Args:
        data: Données à encoder dans le token
        expires_delta: Durée de validité du token
        
    Returns:
        Token JWT encodé
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.access_token_expire_minutes
        )
    
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.secret_key,
        algorithm=settings.algorithm
    )
    
    return encoded_jwt


def create_refresh_token(
    data: dict,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Crée un token de rafraîchissement pour renouvelé l'accès
    
    Args:
        data: Données à encoder dans le token
        expires_delta: Durée de validité du token
        
    Returns:
        Token JWT de rafraîchissement
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            days=settings.refresh_token_expire_days
        )
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "refresh"
    })
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.secret_key,
        algorithm=settings.algorithm
    )
    
    return encoded_jwt


def decode_token(token: str) -> dict:
    """
    Décode et valide un token JWT
    
    Args:
        token: Token JWT à décoder
        
    Returns:
        Contenu du token décodé
        
    Raises:
        HTTPException: Si le token est invalide ou expiré
    """
    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm]
        )
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token invalide: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user_id(
    token: Optional[str] = Depends(oauth2_scheme)
) -> Optional[str]:
    """
    Extrait l'ID utilisateur du token JWT
    
    Args:
        token: Token JWT optionnel
        
    Returns:
        ID utilisateur ou None si non authentifié
    """
    if not token:
        return None
    
    try:
        payload = decode_token(token)
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
        return user_id
    except HTTPException:
        return None


async def get_current_active_user(
    token: str = Depends(oauth2_scheme)
) -> dict:
    """
    Obtient l'utilisateur courant à partir du token
    
    Args:
        token: Token JWT
        
    Returns:
        Données de l'utilisateur
        
    Raises:
        HTTPException: Si non authentifié
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Non authentifié",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    payload = decode_token(token)
    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide",
        )
    
    # En production: récupérer l'utilisateur depuis la base
    return {"id": user_id, "email": payload.get("email")}


class RateLimiter:
    """
    Rate limiter simple basé sur Redis
    Limite le nombre de requêtes par IP ou par utilisateur
    """
    
    def __init__(self, redis_client, max_requests: int = 60, window: int = 60):
        """
        Initialise le rate limiter
        
        Args:
            redis_client: Client Redis
            max_requests: Nombre max de requêtes autorisées
            window: Fenêtre de temps en secondes
        """
        self.redis = redis_client
        self.max_requests = max_requests
        self.window = window
    
    async def is_allowed(self, key: str) -> bool:
        """
        Vérifie si une requête est autorisée pour la clé donnée
        
        Args:
            key: Clé d'identification (IP, user_id, etc.)
            
        Returns:
            True si la requête est autorisée
        """
        redis_key = f"ratelimit:{key}"
        
        try:
            # Incrémente le compteur
            current = self.redis.incr(redis_key)
            
            # Définit l'expiration sur la première requête
            if current == 1:
                self.redis.expire(redis_key, self.window)
            
            return current <= self.max_requests
        except Exception:
            # En cas d'erreur Redis, autorise la requête
            return True


def check_password_strength(password: str) -> tuple[bool, str]:
    """
    Vérifie la force d'un mot de passe
    
    Args:
        password: Mot de passe à vérifier
        
    Returns:
        Tuple (valide, message d'erreur)
    """
    if len(password) < 8:
        return False, "Le mot de passe doit contenir au moins 8 caractères"
    
    if not any(c.isupper() for c in password):
        return False, "Le mot de passe doit contenir au moins une majuscule"
    
    if not any(c.islower() for c in password):
        return False, "Le mot de passe doit contenir au moins une minuscule"
    
    if not any(c.isdigit() for c in password):
        return False, "Le mot de passe doit contenir au moins un chiffre"
    
    return True, ""


def sanitize_input(text: str, max_length: int = 1000) -> str:
    """
    Nettoie une entrée utilisateur
    
    Args:
        text: Texte à nettoyer
        max_length: Longueur maximale autorisée
        
    Returns:
        Texte nettoyé
    """
    if not text:
        return ""
    
    # Supprime les caractères de contrôle
    text = "".join(
        char for char in text 
        if ord(char) >= 32 or char in "\n\t"
    )
    
    # Tronque à la longueur maximale
    text = text[:max_length]
    
    return text.strip()
