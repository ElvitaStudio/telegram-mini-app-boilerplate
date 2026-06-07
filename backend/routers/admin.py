from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session
from pydantic import BaseModel
from db.database import get_db
from models.models import Order, Product
from models.pro_models import TelegramUser, Subscription, Broadcast
from services.auth import require_admin

router = APIRouter(prefix="/api/admin", tags=["admin"])


# ─── Stats ────────────────────────────────────────────────────────────────────

@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    _: None = Depends(require_admin),
):
    total_users = db.query(func.count(TelegramUser.id)).scalar() or 0
    total_orders = db.query(func.count(Order.id)).scalar() or 0
    total_revenue = db.query(func.sum(Order.total)).filter(Order.payment_status == "paid").scalar() or 0.0
    active_subs = db.query(func.count(Subscription.id)).filter(Subscription.status == "active").scalar() or 0
    pending_orders = db.query(func.count(Order.id)).filter(Order.status == "pending").scalar() or 0

    return {
        "success": True,
        "data": {
            "total_users": total_users,
            "total_orders": total_orders,
            "total_revenue": round(total_revenue, 2),
            "active_subscriptions": active_subs,
            "pending_orders": pending_orders,
        },
        "error": None,
    }


# ─── Users ────────────────────────────────────────────────────────────────────

@router.get("/users")
def list_users(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=50, ge=1, le=200),
    search: str | None = Query(default=None),
    db: Session = Depends(get_db),
    _: None = Depends(require_admin),
):
    query = db.query(TelegramUser)
    if search:
        query = query.filter(
            TelegramUser.username.ilike(f"%{search}%")
            | TelegramUser.first_name.ilike(f"%{search}%")
        )
    total = query.count()
    users = query.order_by(TelegramUser.joined_at.desc()).offset((page - 1) * limit).limit(limit).all()

    return {
        "success": True,
        "data": [
            {
                "id": u.id,
                "first_name": u.first_name,
                "last_name": u.last_name,
                "username": u.username,
                "joined_at": u.joined_at.isoformat(),
                "credits": u.credits,
                "is_blocked": u.is_blocked,
                "has_subscription": u.subscription is not None and u.subscription.status == "active",
            }
            for u in users
        ],
        "total": total,
        "page": page,
        "limit": limit,
        "error": None,
    }


@router.patch("/users/{user_id}/block")
def toggle_block(
    user_id: int,
    blocked: bool,
    db: Session = Depends(get_db),
    _: None = Depends(require_admin),
):
    user = db.get(TelegramUser, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_blocked = blocked
    db.commit()
    return {"success": True, "data": {"id": user_id, "is_blocked": blocked}, "error": None}


# ─── Orders ───────────────────────────────────────────────────────────────────

@router.get("/orders")
def list_all_orders(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=50, ge=1, le=200),
    status: str | None = Query(default=None),
    db: Session = Depends(get_db),
    _: None = Depends(require_admin),
):
    query = db.query(Order)
    if status:
        query = query.filter(Order.status == status)
    total = query.count()
    orders = query.order_by(Order.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    return {
        "success": True,
        "data": [
            {
                "id": o.id,
                "user_id": o.user_id,
                "total": o.total,
                "status": o.status,
                "payment_method": o.payment_method,
                "payment_status": o.payment_status,
                "created_at": o.created_at.isoformat(),
                "items_count": len(o.items),
            }
            for o in orders
        ],
        "total": total,
        "page": page,
        "limit": limit,
        "error": None,
    }


class StatusUpdate(BaseModel):
    status: str


@router.patch("/orders/{order_id}/status")
def update_order_status(
    order_id: int,
    body: StatusUpdate,
    db: Session = Depends(get_db),
    _: None = Depends(require_admin),
):
    valid = {"pending", "confirmed", "preparing", "ready", "delivered", "cancelled"}
    if body.status not in valid:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid}")

    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.status = body.status
    db.commit()
    return {"success": True, "data": {"id": order_id, "status": body.status}, "error": None}
