import os
import asyncio
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
import httpx

from db.database import get_db, SessionLocal
from models.pro_models import TelegramUser, Broadcast, BroadcastRecipient
from services.auth import require_admin

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/admin/broadcast", tags=["broadcast"])


class BroadcastCreate(BaseModel):
    message: str
    parse_mode: str = "HTML"
    scheduled_at: datetime | None = None


@router.post("")
async def create_broadcast(
    body: BroadcastCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _: None = Depends(require_admin),
):
    """Create a broadcast. If scheduled_at is None, sends immediately."""
    broadcast = Broadcast(
        message=body.message,
        parse_mode=body.parse_mode,
        scheduled_at=body.scheduled_at,
        status="pending",
    )
    db.add(broadcast)
    db.commit()
    db.refresh(broadcast)

    if body.scheduled_at is None:
        background_tasks.add_task(_run_broadcast, broadcast.id)
        return {
            "success": True,
            "data": {"id": broadcast.id, "status": "running"},
            "error": None,
        }

    return {
        "success": True,
        "data": {"id": broadcast.id, "status": "pending", "scheduled_at": body.scheduled_at.isoformat()},
        "error": None,
    }


@router.get("")
def list_broadcasts(
    db: Session = Depends(get_db),
    _: None = Depends(require_admin),
):
    broadcasts = db.query(Broadcast).order_by(Broadcast.created_at.desc()).limit(50).all()
    return {
        "success": True,
        "data": [
            {
                "id": b.id,
                "message": b.message[:80] + ("…" if len(b.message) > 80 else ""),
                "status": b.status,
                "scheduled_at": b.scheduled_at.isoformat() if b.scheduled_at else None,
                "sent_at": b.sent_at.isoformat() if b.sent_at else None,
                "total_recipients": b.total_recipients,
                "sent_count": b.sent_count,
                "failed_count": b.failed_count,
            }
            for b in broadcasts
        ],
        "error": None,
    }


@router.post("/{broadcast_id}/send")
async def send_broadcast_now(
    broadcast_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _: None = Depends(require_admin),
):
    """Manually trigger a scheduled or pending broadcast."""
    broadcast = db.get(Broadcast, broadcast_id)
    if not broadcast:
        raise HTTPException(status_code=404, detail="Broadcast not found")
    if broadcast.status in ("running", "done"):
        raise HTTPException(status_code=400, detail=f"Broadcast is already {broadcast.status}")

    background_tasks.add_task(_run_broadcast, broadcast_id)
    return {"success": True, "data": {"id": broadcast_id, "status": "running"}, "error": None}


# ─── Background worker ────────────────────────────────────────────────────────

BATCH_SIZE = 25          # messages per second (stay under Telegram's 30/s limit)
BATCH_DELAY = 1.0        # seconds between batches


async def _run_broadcast(broadcast_id: int) -> None:
    """Send broadcast to all non-blocked users. Runs in background."""
    bot_token = os.getenv("BOT_TOKEN", "")
    if not bot_token:
        logger.error("Cannot send broadcast: BOT_TOKEN not set")
        return

    db: Session = SessionLocal()
    try:
        broadcast = db.get(Broadcast, broadcast_id)
        if not broadcast:
            return

        users = db.query(TelegramUser).filter(TelegramUser.is_blocked == False).all()  # noqa: E712
        broadcast.status = "running"
        broadcast.total_recipients = len(users)
        db.commit()

        sent = 0
        failed = 0
        url = f"https://api.telegram.org/bot{bot_token}/sendMessage"

        async with httpx.AsyncClient() as client:
            for i, user in enumerate(users):
                try:
                    resp = await client.post(
                        url,
                        json={
                            "chat_id": user.id,
                            "text": broadcast.message,
                            "parse_mode": broadcast.parse_mode,
                        },
                        timeout=5.0,
                    )
                    if resp.is_success and resp.json().get("ok"):
                        sent += 1
                        recipient = BroadcastRecipient(
                            broadcast_id=broadcast_id,
                            user_id=user.id,
                            delivered=True,
                        )
                    else:
                        failed += 1
                        recipient = BroadcastRecipient(
                            broadcast_id=broadcast_id,
                            user_id=user.id,
                            delivered=False,
                            error=resp.text[:200],
                        )
                except Exception as e:
                    failed += 1
                    recipient = BroadcastRecipient(
                        broadcast_id=broadcast_id,
                        user_id=user.id,
                        delivered=False,
                        error=str(e)[:200],
                    )

                db.add(recipient)

                # Flush and rate-limit every BATCH_SIZE messages
                if (i + 1) % BATCH_SIZE == 0:
                    db.commit()
                    await asyncio.sleep(BATCH_DELAY)

        broadcast.status = "done"
        broadcast.sent_at = datetime.now(timezone.utc)
        broadcast.sent_count = sent
        broadcast.failed_count = failed
        db.commit()
        logger.info("Broadcast %d done: %d sent, %d failed", broadcast_id, sent, failed)

    except Exception as e:
        logger.exception("Broadcast %d crashed: %s", broadcast_id, e)
        try:
            broadcast = db.get(Broadcast, broadcast_id)
            if broadcast:
                broadcast.status = "failed"
                db.commit()
        except Exception:
            pass
    finally:
        db.close()


# ─── Cron checker (called from lifespan) ─────────────────────────────────────

async def check_scheduled_broadcasts() -> None:
    """Run pending scheduled broadcasts whose time has come. Call from a periodic task."""
    db: Session = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        due = (
            db.query(Broadcast)
            .filter(
                Broadcast.status == "pending",
                Broadcast.scheduled_at <= now,
            )
            .all()
        )
        for b in due:
            asyncio.create_task(_run_broadcast(b.id))
    finally:
        db.close()
