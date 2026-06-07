from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, BigInteger, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from db.database import Base


class TelegramUser(Base):
    """Persisted Telegram user record — populated on first auth."""
    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True)          # Telegram user ID
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=True)
    username = Column(String, nullable=True, index=True)
    language_code = Column(String, nullable=True)
    joined_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    credits = Column(Float, default=0.0)               # referral bonus credits
    is_blocked = Column(Boolean, default=False)

    referrals_made = relationship("Referral", foreign_keys="Referral.referrer_id", back_populates="referrer")
    referral_received = relationship("Referral", foreign_keys="Referral.referee_id", back_populates="referee", uselist=False)
    subscription = relationship("Subscription", back_populates="user", uselist=False)
    broadcasts_received = relationship("BroadcastRecipient", back_populates="user")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False, unique=True, index=True)
    plan = Column(String, default="monthly")           # monthly | yearly
    status = Column(String, default="active")          # active | cancelled | expired
    stars_charge_id = Column(String, nullable=True)
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)

    user = relationship("TelegramUser", back_populates="subscription")


class Referral(Base):
    __tablename__ = "referrals"

    id = Column(Integer, primary_key=True, index=True)
    referrer_id = Column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    referee_id = Column(BigInteger, ForeignKey("users.id"), nullable=False, unique=True)
    bonus_awarded = Column(Boolean, default=False)
    bonus_amount = Column(Float, default=0.0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    referrer = relationship("TelegramUser", foreign_keys=[referrer_id], back_populates="referrals_made")
    referee = relationship("TelegramUser", foreign_keys=[referee_id], back_populates="referral_received")


class Broadcast(Base):
    __tablename__ = "broadcasts"

    id = Column(Integer, primary_key=True, index=True)
    message = Column(Text, nullable=False)
    parse_mode = Column(String, default="HTML")
    status = Column(String, default="pending")         # pending | running | done | failed
    scheduled_at = Column(DateTime, nullable=True)     # None = send immediately
    sent_at = Column(DateTime, nullable=True)
    total_recipients = Column(Integer, default=0)
    sent_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    recipients = relationship("BroadcastRecipient", back_populates="broadcast")


class BroadcastRecipient(Base):
    __tablename__ = "broadcast_recipients"

    id = Column(Integer, primary_key=True, index=True)
    broadcast_id = Column(Integer, ForeignKey("broadcasts.id"), nullable=False)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    delivered = Column(Boolean, default=False)
    error = Column(String, nullable=True)

    broadcast = relationship("Broadcast", back_populates="recipients")
    user = relationship("TelegramUser", back_populates="broadcasts_received")
