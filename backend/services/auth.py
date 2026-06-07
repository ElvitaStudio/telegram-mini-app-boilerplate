import hashlib
import hmac
import json
from urllib.parse import unquote
from fastapi import HTTPException, Header
import os


def validate_telegram_init_data(init_data: str) -> dict:
    """Validate Telegram WebApp initData using HMAC-SHA256."""
    bot_token = os.getenv("BOT_TOKEN", "")
    if not bot_token:
        raise HTTPException(status_code=500, detail="BOT_TOKEN not configured")

    if not init_data:
        raise HTTPException(status_code=401, detail="Missing init data")

    # Parse key=value pairs
    params: dict[str, str] = {}
    for part in init_data.split("&"):
        if "=" in part:
            k, _, v = part.partition("=")
            params[k] = unquote(v)

    received_hash = params.pop("hash", None)
    if not received_hash:
        raise HTTPException(status_code=401, detail="Missing hash in init data")

    # Build data-check-string
    data_check_string = "\n".join(
        f"{k}={v}" for k, v in sorted(params.items())
    )

    # HMAC-SHA256(WebAppData, bot_token) as the secret key
    secret_key = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
    computed_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

    if not hmac.compare_digest(computed_hash, received_hash):
        raise HTTPException(status_code=401, detail="Invalid init data signature")

    # Parse user field
    user_str = params.get("user", "{}")
    try:
        user = json.loads(user_str)
    except json.JSONDecodeError:
        raise HTTPException(status_code=401, detail="Invalid user data")

    return user


async def get_current_user(
    x_telegram_init_data: str = Header(default=""),
) -> dict:
    """FastAPI dependency: validate and return Telegram user."""
    return validate_telegram_init_data(x_telegram_init_data)
