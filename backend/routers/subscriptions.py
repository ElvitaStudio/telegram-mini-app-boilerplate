import os
import httpx
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from db.database import get_db
from models.pro_models import TelegramUser, Subscription
from services.auth import get_current_user
from services.notifications import notify_owner

router = APIRouter(prefix="/api/subscriptions", tags=["subscriptions"])

PLAN_DURATION_DAYS = {"monthly": 30, "yearly": 365}
PLAN_STARS = {"monthly": 100, "yearly": 999}  # adjust as needed


@router.get("/status")
def get_subscription_status(
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    sub = db.query(Subscription).filter_by(user_id=user["id"]).first()
    is_active = (
        sub is not None
        and sub.status == "active"
        and (sub.expires_at is None or sub.expires_at > datetime.now(timezone.utc))
    )
    return {
        "success": True,
        "data": {
            "is_subscribed": is_active,
            "plan": sub.plan if sub else None,
            "expires_at": sub.expires_at.isoformat() if sub and sub.expires_at else None,
            "status": sub.status if sub else None,
        },
        "error": None,
    }


class SubscribeRequest(BaseModel):
    plan: str = "monthly"


@router.post("/create-invoice")
async def create_subscription_invoice(
    body: SubscribeRequest,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    if body.plan not in PLAN_STARS:
        raise HTTPException(status_code=400, detail="Invalid plan. Choose 'monthly' or 'yearly'.")

    bot_token = os.getenv("BOT_TOKEN", "")
    if not bot_token:
        raise HTTPException(status_code=500, detail="Bot token not configured")

    stars = PLAN_STARS[body.plan]
    plan_label = "місяць" if body.plan == "monthly" else "рік"

    payload = {
        "title": f"Підписка на {plan_label}",
        "description": f"Преміум підписка на {plan_label} — {stars} ⭐",
        "payload": f"sub:{user['id']}:{body.plan}",
        "currency": "XTR",
        "prices": [{"label": f"Підписка ({body.plan})", "amount": stars}],
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"https://api.telegram.org/bot{bot_token}/createInvoiceLink",
            json=payload,
            timeout=10.0,
        )
        data = resp.json()

    if not data.get("ok"):
        raise HTTPException(status_code=502, detail=data.get("description", "Telegram API error"))

    return {"success": True, "data": {"invoice_link": data["result"]}, "error": None}


@router.post("/webhook/stars")
async def subscription_stars_webhook(request: Request, db: Session = Depends(get_db)):
    """Called by bot.py after successful Stars payment for a subscription."""
    body = await request.json()
    invoice_payload: str = body.get("payload", "")

    if not invoice_payload.startswith("sub:"):
        return {"ok": True}

    _, user_id_str, plan = invoice_payload.split(":", 2)
    user_id = int(user_id_str)
    charge_id: str = body.get("charge_id", "")

    days = PLAN_DURATION_DAYS.get(plan, 30)
    expires_at = datetime.now(timezone.utc) + timedelta(days=days)

    sub = db.query(Subscription).filter_by(user_id=user_id).first()
    if sub:
        # Extend if already active, otherwise restart
        base = max(sub.expires_at or datetime.now(timezone.utc), datetime.now(timezone.utc))
        sub.expires_at = base + timedelta(days=days)
        sub.status = "active"
        sub.plan = plan
        sub.stars_charge_id = charge_id
    else:
        sub = Subscription(
            user_id=user_id,
            plan=plan,
            status="active",
            stars_charge_id=charge_id,
            expires_at=expires_at,
        )
        db.add(sub)

    db.commit()
    await notify_owner(f"⭐ Нова підписка: user {user_id}, план {plan}")
    return {"ok": True}


@router.post("/cancel")
def cancel_subscription(
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    sub = db.query(Subscription).filter_by(user_id=user["id"]).first()
    if not sub or sub.status != "active":
        raise HTTPException(status_code=404, detail="No active subscription found")

    sub.status = "cancelled"
    sub.cancelled_at = datetime.now(timezone.utc)
    db.commit()
    return {"success": True, "data": {"status": "cancelled"}, "error": None}
