from dotenv import load_dotenv
load_dotenv()

import os
import asyncio
import logging
from telegram import Update, WebAppInfo, InlineKeyboardButton, InlineKeyboardMarkup, MenuButtonWebApp
from telegram.ext import Application, CommandHandler, ContextTypes, PreCheckoutQueryHandler, MessageHandler, filters

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

BOT_TOKEN = os.getenv("BOT_TOKEN", "")
WEBHOOK_URL = os.getenv("WEBHOOK_URL", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "")
WEBHOOK_PATH = "/bot/webhook"
WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET", "")


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.effective_user or not update.message:
        return

    user = update.effective_user
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton(
            "🛍 Відкрити магазин",
            web_app=WebAppInfo(url=FRONTEND_URL),
        )]
    ])

    await update.message.reply_text(
        f"Привіт, {user.first_name}! 👋\n\nНатисніть кнопку нижче щоб відкрити магазин.",
        reply_markup=keyboard,
    )


async def pre_checkout(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Approve all pre-checkout queries (Stars payments)."""
    query = update.pre_checkout_query
    if query:
        await query.answer(ok=True)


async def successful_payment(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle successful Stars payment — forward to FastAPI via HTTP."""
    if not update.message or not update.message.successful_payment:
        return

    payment = update.message.successful_payment
    order_id = payment.invoice_payload

    import httpx
    api_url = os.getenv("WEBHOOK_URL", "")
    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{api_url}/api/payments/stars/webhook",
                json={
                    "message": {
                        "successful_payment": {
                            "invoice_payload": order_id,
                            "telegram_payment_charge_id": payment.telegram_payment_charge_id,
                        }
                    }
                },
                timeout=5.0,
            )
    except Exception as e:
        logger.error("Failed to notify API about Stars payment: %s", e)

    await update.message.reply_text("✅ Оплату підтверджено! Дякуємо за замовлення.")


def build_app() -> Application:
    app = Application.builder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(PreCheckoutQueryHandler(pre_checkout))
    app.add_handler(MessageHandler(filters.SUCCESSFUL_PAYMENT, successful_payment))
    return app


async def set_menu_button(app: Application) -> None:
    await app.bot.set_chat_menu_button(
        menu_button=MenuButtonWebApp(text="Магазин", web_app=WebAppInfo(url=FRONTEND_URL))
    )


async def main() -> None:
    if not BOT_TOKEN:
        raise RuntimeError("BOT_TOKEN is not set")

    app = build_app()

    if WEBHOOK_URL:
        webhook_url = f"{WEBHOOK_URL}{WEBHOOK_PATH}"
        logger.info("Starting in webhook mode: %s", webhook_url)

        await app.initialize()
        await set_menu_button(app)
        await app.bot.set_webhook(
            url=webhook_url,
            secret_token=WEBHOOK_SECRET or None,
            allowed_updates=Update.ALL_TYPES,
        )
        await app.start()
        await app.updater.start_webhook(
            listen="0.0.0.0",
            port=8443,
            url_path=WEBHOOK_PATH,
            secret_token=WEBHOOK_SECRET or None,
            webhook_url=webhook_url,
        )
        logger.info("Bot running via webhook on port 8443")
        await asyncio.Event().wait()
    else:
        logger.info("Starting in polling mode (no WEBHOOK_URL set)")
        async with app:
            await set_menu_button(app)
            await app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    asyncio.run(main())
