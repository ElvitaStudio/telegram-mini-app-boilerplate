import hashlib
import hmac
import json
import os
from urllib.parse import unquote
from fastapi import HTTPException, Header, Depends
from sqlalchemy.orm import Session
from db.database import get_db


def validate_telegram_init_data(init_data: str) -> dict:
    """Validate Telegram WebApp initData using HMAC-SHA256."""
    bot_token = os.getenv("BOT_TOKEN", "")
    if not bot_token:
        raise HTTPException(status_code=500, detail="BOT_TOKEN not configured")
    if not init_data:
        raise HTTPException(status_code=401, detail="Missing init data")

    params: dict[str, str] = {}
    for part in init_data.split("&"):
        if "=" in part:
            k, _, v = part.partition("=")
            params[k] = unquote(v)

    received_hash = params.pop("hash", None)
    if not received_hash:
        raise HTTPException(status_code=401, detail="Missing hash in init data")

    data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(params.items()))
    secret_key = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
    computed_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

    if not hmac.compare_digest(computed_hash, received_hash):
        raise HTTPException(status_code=401, detail="Invalid init data signature")

    user_str = params.get("user", "{}")
    try:
        user = json.loads(user_str)
    except json.JSONDecodeError:
        raise HTTPException(status_code=401, detail="Invalid user data")

    return user


def upsert_user(user_data: dict, db: Session, ref_id: int | None = None) -> "TelegramUser":  # noqa: F821
    """Upsert TelegramUser row; optionally register a referral."""
    from models.pro_models import TelegramUser, Referral

    user = db.get(TelegramUser, user_data["id"])
    if user is None:
        user = TelegramUser(
            id=user_data["id"],
            first_name=user_data.get("first_name", ""),
            last_name=user_data.get("last_name"),
            username=user_data.get("username"),
            language_code=user_data.get("language_code"),
        )
        db.add(user)
        db.flush()

        # Register referral only for new users
        if ref_id and ref_id != user_data["id"]:
            referrer = db.get(TelegramUser, ref_id)
            if referrer and not db.query(Referral).filter_by(referee_id=user_data["id"]).first():
                referral = Referral(referrer_id=ref_id, referee_id=user_data["id"])
                db.add(referral)

        db.commit()
        db.refresh(user)
    else:
        # Keep name fields fresh
        user.first_name = user_data.get("first_name", user.first_name)
        user.last_name = user_data.get("last_name", user.last_name)
        user.username = user_data.get("username", user.username)
        db.commit()

    return user


async def get_current_user(
    x_telegram_init_data: str = Header(default=""),
    db: Session = Depends(get_db),
) -> dict:
    """FastAPI dependency: validate init data, upsert user, return user dict."""
    user_data = validate_telegram_init_data(x_telegram_init_data)
    upsert_user(user_data, db)
    return user_data


async def get_current_user_with_db(
    x_telegram_init_data: str = Header(default=""),
    db: Session = Depends(get_db),
):
    """Returns (user_dict, db) — for routes that need both."""
    user_data = validate_telegram_init_data(x_telegram_init_data)
    upsert_user(user_data, db)
    return user_data, db


def require_admin(x_admin_secret: str = Header(default="")) -> None:
    """FastAPI dependency: verify ADMIN_SECRET header."""
    secret = os.getenv("ADMIN_SECRET", "")
    if not secret:
        raise HTTPException(status_code=500, detail="ADMIN_SECRET not configured")
    if x_admin_secret != secret:
        raise HTTPException(status_code=403, detail="Forbidden")
