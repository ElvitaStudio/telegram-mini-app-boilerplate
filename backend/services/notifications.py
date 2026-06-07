import os
import httpx


async def notify_owner(message: str) -> None:
    """Send a notification message to the bot owner via Telegram."""
    bot_token = os.getenv("BOT_TOKEN", "")
    owner_chat_id = os.getenv("OWNER_CHAT_ID", "")

    if not bot_token or not owner_chat_id:
        return

    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        "chat_id": owner_chat_id,
        "text": message,
        "parse_mode": "HTML",
    }

    async with httpx.AsyncClient() as client:
        try:
            await client.post(url, json=payload, timeout=5.0)
        except Exception:
            pass  # Notification failure must not affect order flow


def format_order_notification(order_id: int, user: dict, items: list, total: float) -> str:
    user_name = user.get("first_name", "Unknown")
    username = f" (@{user.get('username')})" if user.get("username") else ""
    items_text = "\n".join(
        f"  • {item['product_name']} × {item['quantity']} — {item['price'] * item['quantity']:.2f} ₴"
        for item in items
    )
    return (
        f"🛍 <b>Нове замовлення #{order_id}</b>\n"
        f"👤 {user_name}{username} (ID: {user.get('id')})\n\n"
        f"{items_text}\n\n"
        f"💰 <b>Разом: {total:.2f} ₴</b>"
    )
