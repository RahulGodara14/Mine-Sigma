from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import bcrypt
from config import settings
import secrets


def _password_bytes(password: str) -> bytes:
    pw = (password or "").encode("utf-8")
    # bcrypt only uses the first 72 bytes; enforce a hard limit to avoid surprises
    if len(pw) > 72:
        raise ValueError(
            "password cannot be longer than 72 bytes, truncate manually if necessary (e.g. my_password[:72])"
        )
    return pw


def hash_password(password: str) -> str:
    pw = _password_bytes(password)
    return bcrypt.hashpw(pw, bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        pw = _password_bytes(plain_password)
        return bcrypt.checkpw(pw, (hashed_password or "").encode("utf-8"))
    except ValueError:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.access_token_expire_minutes
        )
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, settings.secret_key, algorithm=settings.algorithm
    )
    return encoded_jwt


def verify_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(
            token, settings.secret_key, algorithms=[settings.algorithm]
        )
        return payload
    except JWTError:
        return None


def generate_nonce() -> str:
    """Generate a random nonce for wallet verification"""
    return secrets.token_hex(16)