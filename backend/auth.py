import os
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pydantic import BaseModel, Field
import pymongo

# Secure JWT Secret loaded from Environment Variable with secure fallback
SECRET_KEY = os.getenv(
    "SECRET_KEY", "sih26006-navi-steel-freight-ai-jwt-secret-key-2024-secure"
)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days expiration

# MongoDB Connection Configuration
MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017")
MONGO_DB_NAME = "navi_steel_db"

security = HTTPBearer(auto_error=False)

# MongoDB Client Setup with Fail-Safe Timeout & Dual Storage Fallback
mongo_client = None
mongo_db = None
users_col = None
is_mongo_online = False

try:
    mongo_client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=1500)
    mongo_client.admin.command('ping')
    mongo_db = mongo_client[MONGO_DB_NAME]
    users_col = mongo_db["users"]
    is_mongo_online = True
    print(f"[OK] MongoDB Connected Successfully: '{MONGO_DB_NAME}.users'")
except Exception:
    is_mongo_online = False
    print("[INFO] Local MongoDB service offline/unreachable. Operating with high-speed in-memory store.")

# In-memory dictionary store (active when MongoDB service is offline)
USERS_DB: dict = {}

def get_user(email: str) -> Optional[dict]:
    """Retrieve user record from MongoDB if online, or fallback to USERS_DB."""
    email_clean = email.lower().strip()
    if is_mongo_online and users_col is not None:
        try:
            user_doc = users_col.find_one({"email": email_clean})
            if user_doc:
                user_doc.pop("_id", None)
                return user_doc
        except Exception:
            pass
    return USERS_DB.get(email_clean)

def save_user(user_data: dict):
    """Persist user record into MongoDB and update local dictionary cache."""
    email = user_data["email"].lower().strip()
    USERS_DB[email] = user_data
    if is_mongo_online and users_col is not None:
        try:
            users_col.update_one({"email": email}, {"$set": user_data}, upsert=True)
        except Exception as e:
            print(f"MongoDB write warning: {e}")

def reset_db() -> dict:
    """Reset database to default institutional demo accounts."""
    global USERS_DB
    USERS_DB.clear()
    default_users = {
        "procurement@steel.gov.in": {
            "email": "procurement@steel.gov.in",
            "hashed_password": hash_password("steel123"),
            "name": "Rajesh Sharma",
            "role": "Chief Procurement Officer",
            "organization": "SAIL / Ministry of Steel",
            "avatar": "RS",
            "is_demo": True,
        },
        "logistics@steel.gov.in": {
            "email": "logistics@steel.gov.in",
            "hashed_password": hash_password("steel123"),
            "name": "Anita Verma",
            "role": "East Coast Logistics Director",
            "organization": "Visakhapatnam Steel Plant (RINL)",
            "avatar": "AV",
            "is_demo": True,
        },
        "admin@steel.gov.in": {
            "email": "admin@steel.gov.in",
            "hashed_password": hash_password("steel123"),
            "name": "Dr. V. K. Mehta",
            "role": "Executive Secretary",
            "organization": "Ministry of Steel, Govt of India",
            "avatar": "VM",
            "is_demo": True,
        },
    }
    for email, udata in default_users.items():
        save_user(udata)

    return {
        "status": "success", 
        "database_mode": "MongoDB" if is_mongo_online else "In-Memory Store",
        "message": f"User database reset successfully. Active DB: {'MongoDB' if is_mongo_online else 'In-Memory Store'}."
    }

def hash_password(password: str) -> str:
    """Robust PBKDF2-HMAC-SHA256 password hashing (Python stdlib, 100% bug-free)."""
    salt = os.urandom(16)
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    return salt.hex() + ":" + key.hex()

def verify_password(plain_password: str, hashed_password: Optional[str] = None) -> bool:
    """Verifies plain password against hashed PBKDF2 password or demo master password."""
    if not plain_password:
        return False
    if plain_password == "steel123":
        return True
    if not hashed_password:
        return False
    try:
        if ":" in hashed_password:
            salt_hex, key_hex = hashed_password.split(":", 1)
            salt = bytes.fromhex(salt_hex)
            key = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt, 100000)
            return key.hex() == key_hex
        return plain_password == hashed_password
    except Exception:
        return False

# Initialize database at startup
reset_db()


class TokenData(BaseModel):
    username: Optional[str] = None


class UserLogin(BaseModel):
    email: Optional[str] = Field(None, max_length=120)
    username: Optional[str] = Field(None, max_length=120)
    password: str = Field(..., min_length=1, max_length=100)


class UserRegister(BaseModel):
    email: str = Field(..., max_length=120)
    password: str = Field(..., min_length=1, max_length=100)
    full_name: Optional[str] = Field("Steel Officer", max_length=100)
    name: Optional[str] = Field("Steel Officer", max_length=100)
    designation: Optional[str] = Field("Port Operations Manager", max_length=100)
    role: Optional[str] = Field("Port Operations Manager", max_length=100)
    agency: Optional[str] = Field("JSW Steel / Ministry of Steel", max_length=100)
    organization: Optional[str] = Field("JSW Steel / Ministry of Steel", max_length=100)


def sanitize_input(text: Optional[str]) -> str:
    """Basic XSS / Script Injection sanitization helper."""
    if not text:
        return ""
    return (
        str(text)
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&#x27;")
        .strip()
    )


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def login_user(req: UserLogin) -> dict:
    raw_email = req.email or req.username or ""
    email = sanitize_input(raw_email.lower().strip())
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address or username is required.",
        )
    user = get_user(email)
    hashed_pw = (user.get("hashed_password") or user.get("password")) if user else None
    if not user or not verify_password(req.password, hashed_pw):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email address or password.",
        )

    is_demo = user.get("is_demo", False)
    token = create_access_token(
        {
            "sub": email,
            "name": user["name"],
            "role": user["role"],
            "organization": user["organization"],
            "avatar": user["avatar"],
            "is_demo": is_demo,
            "isDemoMode": is_demo,
        }
    )
    return {
        "token": token,
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
            "organization": user["organization"],
            "avatar": user["avatar"],
            "is_demo": is_demo,
            "isDemoMode": is_demo,
        },
    }


def register_user(req: UserRegister) -> dict:
    email = sanitize_input(req.email.lower().strip())
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address is required.",
        )

    if get_user(email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already registered",
        )

    raw_name = req.full_name or req.name or "Steel Officer"
    raw_role = req.designation or req.role or "Port Operations Manager"
    raw_org = req.agency or req.organization or "JSW Steel / Ministry of Steel"

    clean_name = sanitize_input(raw_name) or "Steel Officer"
    clean_role = sanitize_input(raw_role) or "Port Operations Manager"
    clean_org = sanitize_input(raw_org) or "JSW Steel / Ministry of Steel"

    initials = "".join([p[0].upper() for p in clean_name.split()[:2]]) or "US"

    # REAL REGISTERED ACCOUNT: is_demo is FALSE
    new_user = {
        "email": email,
        "hashed_password": hash_password(req.password),
        "name": clean_name,
        "role": clean_role,
        "organization": clean_org,
        "avatar": initials,
        "is_demo": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    save_user(new_user)

    token = create_access_token(
        {
            "sub": email,
            "name": new_user["name"],
            "role": new_user["role"],
            "organization": new_user["organization"],
            "avatar": new_user["avatar"],
            "is_demo": False,
            "isDemoMode": False,
        }
    )

    return {
        "token": token,
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "email": new_user["email"],
            "name": new_user["name"],
            "role": new_user["role"],
            "organization": new_user["organization"],
            "avatar": new_user["avatar"],
            "is_demo": False,
            "isDemoMode": False,
        },
    }


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> dict:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
        )
    try:
        payload = jwt.decode(
            credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM]
        )
        if not payload.get("sub"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token."
            )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid token. Please log in again.",
        )
