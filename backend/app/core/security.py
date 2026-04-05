from datetime import datetime, timedelta
from typing import Optional
import hashlib

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _pre_hash_password(password: str) -> str:
    """Pre-hash password with SHA256 to handle bcrypt's 72-byte limit."""
    return hashlib.sha256(password.encode()).hexdigest()


def hash_password(password: str) -> str:
    pre_hashed = _pre_hash_password(password)
    return pwd_context.hash(pre_hashed)


def verify_password(plain: str, hashed: str) -> bool:
    pre_hashed = _pre_hash_password(plain)
    return pwd_context.verify(pre_hashed, hashed)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None
