import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from db.database import get_db
from models.pro_models import TelegramUser, Referral
from services.auth import get_current_user

router = APIRouter(prefix="/api/referrals", tags=["referrals"])

REFERRAL_BONUS = float(os.getenv("REFERRAL_BONUS", "50"))   # credits awarded to referrer


@router.get("/my")
def get_my_referral_stats(
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    bot_username = os.getenv("BOT_USERNAME", "")
    referral_link = f"https://t.me/{bot_username}?start=ref{user['id']}" if bot_username else ""

    total_referrals = (
        db.query(func.count(Referral.id))
        .filter(Referral.referrer_id == user["id"])
        .scalar() or 0
    )
    awarded = (
        db.query(func.count(Referral.id))
        .filter(Referral.referrer_id == user["id"], Referral.bonus_awarded == True)  # noqa: E712
        .scalar() or 0
    )
    total_bonus = awarded * REFERRAL_BONUS

    tg_user = db.get(TelegramUser, user["id"])
    credits = tg_user.credits if tg_user else 0.0

    return {
        "success": True,
        "data": {
            "referral_link": referral_link,
            "total_referrals": total_referrals,
            "awarded_referrals": awarded,
            "total_bonus_earned": total_bonus,
            "current_credits": credits,
        },
        "error": None,
    }


@router.post("/award/{referral_id}")
def award_referral_bonus(
    referral_id: int,
    db: Session = Depends(get_db),
):
    """
    Called internally (e.g. after referee completes first order).
    Marks the referral as awarded and credits the referrer.
    """
    referral = db.get(Referral, referral_id)
    if not referral:
        raise HTTPException(status_code=404, detail="Referral not found")
    if referral.bonus_awarded:
        return {"success": True, "data": {"already_awarded": True}, "error": None}

    referrer = db.get(TelegramUser, referral.referrer_id)
    if referrer:
        referrer.credits = (referrer.credits or 0.0) + REFERRAL_BONUS

    referral.bonus_awarded = True
    referral.bonus_amount = REFERRAL_BONUS
    db.commit()

    return {
        "success": True,
        "data": {
            "referral_id": referral_id,
            "bonus_amount": REFERRAL_BONUS,
            "referrer_id": referral.referrer_id,
        },
        "error": None,
    }


@router.get("/leaderboard")
def referral_leaderboard(
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """Top 10 referrers by successful referrals."""
    rows = (
        db.query(
            Referral.referrer_id,
            func.count(Referral.id).label("count"),
            TelegramUser.username,
            TelegramUser.first_name,
        )
        .join(TelegramUser, TelegramUser.id == Referral.referrer_id)
        .filter(Referral.bonus_awarded == True)  # noqa: E712
        .group_by(Referral.referrer_id)
        .order_by(func.count(Referral.id).desc())
        .limit(10)
        .all()
    )

    return {
        "success": True,
        "data": [
            {
                "user_id": r.referrer_id,
                "username": r.username,
                "first_name": r.first_name,
                "referral_count": r.count,
            }
            for r in rows
        ],
        "error": None,
    }
