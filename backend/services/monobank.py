import httpx
import os
from typing import TypedDict


MONOBANK_API = "https://api.monobank.ua"


class MonobankInvoice(TypedDict):
    invoiceId: str
    pageUrl: str


async def create_invoice(
    amount_uah: float,
    order_id: int,
    webhook_url: str,
    redirect_url: str,
) -> MonobankInvoice:
    """Create a Monobank payment invoice. Amount in UAH (converted to kopecks)."""
    token = os.getenv("MONOBANK_TOKEN", "")
    if not token:
        raise ValueError("MONOBANK_TOKEN not configured")

    amount_kopecks = round(amount_uah * 100)

    payload = {
        "amount": amount_kopecks,
        "ccy": 980,  # UAH
        "merchantPaymInfo": {
            "reference": str(order_id),
            "comment": f"Order #{order_id}",
        },
        "redirectUrl": redirect_url,
        "webHookUrl": webhook_url,
        "validity": 3600,
        "paymentType": "debit",
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{MONOBANK_API}/api/merchant/invoice/create",
            json=payload,
            headers={"X-Token": token},
            timeout=10.0,
        )
        resp.raise_for_status()
        return resp.json()


async def get_invoice_status(invoice_id: str) -> dict:
    token = os.getenv("MONOBANK_TOKEN", "")
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{MONOBANK_API}/api/merchant/invoice/status",
            params={"invoiceId": invoice_id},
            headers={"X-Token": token},
            timeout=10.0,
        )
        resp.raise_for_status()
        return resp.json()
