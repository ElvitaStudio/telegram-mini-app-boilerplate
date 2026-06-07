import os
import hashlib
import hmac
import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from db.database import get_db
from models.models import Order
from services.auth import get_current_user
from services.monobank import create_invoice
from services.notifications import notify_owner

router = APIRouter(prefix="/api/payments", tags=["payments"])


class PaymentRequest(BaseModel):
    order_id: int


# ─── Monobank ────────────────────────────────────────────────────────────────

@router.post("/monobank")
async def create_monobank_payment(
    payload: PaymentRequest,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    order = db.get(Order, payload.order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.user_id != user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    if order.payment_status == "paid":
        raise HTTPException(status_code=400, detail="Order already paid")

    webhook_url = f"{os.getenv('WEBHOOK_URL', '')}/api/payments/monobank/webhook"
    redirect_url = f"{os.getenv('FRONTEND_URL', '')}/orders"

    try:
        invoice = await create_invoice(
            amount_uah=order.total,
            order_id=order.id,
            webhook_url=webhook_url,
            redirect_url=redirect_url,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Monobank error: {e}")

    order.payment_reference = invoice["invoiceId"]
    db.commit()

    return {
        "success": True,
        "data": {"payment_url": invoice["pageUrl"], "invoice_id": invoice["invoiceId"]},
        "error": None,
    }


@router.post("/monobank/webhook")
async def monobank_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Monobank payment status webhook."""
    body = await request.json()

    reference = body.get("reference") or (body.get("merchantPaymInfo") or {}).get("reference")
    status = body.get("status")
    invoice_id = body.get("invoiceId")

    if not reference or not status:
        return {"ok": True}

    try:
        order_id = int(reference)
    except (ValueError, TypeError):
        return {"ok": True}

    order = db.get(Order, order_id)
    if not order:
        return {"ok": True}

    if status == "success":
        order.payment_status = "paid"
        order.status = "confirmed"
        if invoice_id:
            order.payment_reference = invoice_id
        db.commit()
        await notify_owner(f"✅ Оплата підтверджена для замовлення #{order_id}")
    elif status in ("failure", "expired"):
        order.payment_status = "failed"
        db.commit()

    return {"ok": True}


# ─── Telegram Stars ───────────────────────────────────────────────────────────

@router.post("/stars")
async def create_stars_payment(
    payload: PaymentRequest,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    order = db.get(Order, payload.order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.user_id != user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    if order.payment_status == "paid":
        raise HTTPException(status_code=400, detail="Order already paid")

    bot_token = os.getenv("BOT_TOKEN", "")
    if not bot_token:
        raise HTTPException(status_code=500, detail="Bot token not configured")

    # Stars price: 1 star ≈ 0.013 USD. Adjust conversion as needed.
    # Minimum 1 star.
    stars_amount = max(1, round(order.total / 50))  # rough UAH → Stars

    url = f"https://api.telegram.org/bot{bot_token}/createInvoiceLink"
    payload_data = {
        "title": f"Замовлення #{order.id}",
        "description": f"Оплата замовлення на суму {order.total:.2f} ₴",
        "payload": str(order.id),
        "currency": "XTR",
        "prices": [{"label": f"Замовлення #{order.id}", "amount": stars_amount}],
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(url, json=payload_data, timeout=10.0)
        if not resp.is_success:
            raise HTTPException(status_code=502, detail=f"Telegram API error: {resp.text}")
        data = resp.json()

    if not data.get("ok"):
        raise HTTPException(status_code=502, detail=data.get("description", "Telegram error"))

    return {
        "success": True,
        "data": {"invoice_link": data["result"]},
        "error": None,
    }


@router.post("/stars/webhook")
async def stars_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Telegram Stars pre-checkout and successful payment via bot webhook."""
    body = await request.json()
    message = body.get("message", {})

    if "successful_payment" in message:
        payment = message["successful_payment"]
        try:
            order_id = int(payment["invoice_payload"])
        except (ValueError, KeyError):
            return {"ok": True}

        order = db.get(Order, order_id)
        if order:
            order.payment_status = "paid"
            order.status = "confirmed"
            order.payment_reference = payment.get("telegram_payment_charge_id")
            db.commit()
            await notify_owner(f"⭐ Stars-оплата підтверджена для замовлення #{order_id}")

    return {"ok": True}
