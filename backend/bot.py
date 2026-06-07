from dotenv import load_dotenv
load_dotenv()

import os
import asyncio
import logging
import httpx
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

    # Handle referral: /start ref<USER_ID>
    ref_id: int | None = None
    if context.args:
        arg = context.args[0]
        if arg.startswith("ref"):
            try:
                ref_id = int(arg[3:])
            except ValueError:
                pass

    # Register user + referral via API
    if ref_id:
        try:
            async with httpx.AsyncClient() as client:
                await client.post(
                    f"{WEBHOOK_URL}/api/referrals/register",
                    json={"user_id": user.id, "ref_id": ref_id},
                    timeout=5.0,
                )
        except Exception as e:
            logger.warning("Referral registration failed: %s", e)

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
    query = update.pre_checkout_query
    if query:
        await query.answer(ok=True)


async def successful_payment(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message or not update.message.successful_payment:
        return

    payment = update.message.successful_payment
    invoice_payload: str = payment.invoice_payload
    charge_id: str = payment.telegram_payment_charge_id

    api_base = WEBHOOK_URL

    async with httpx.AsyncClient() as client:
        if invoice_payload.startswith("sub:"):
            # Subscription payment
            try:
                await client.post(
                    f"{api_base}/api/subscriptions/webhook/stars",
                    json={"payload": invoice_payload, "charge_id": charge_id},
                    timeout=5.0,
                )
            except Exception as e:
                logger.error("Subscription webhook failed: %s", e)
            await update.message.reply_text("⭐ Підписку активовано! Дякуємо.")
        else:
            # Regular order payment
            try:
                await client.post(
                    f"{api_base}/api/payments/stars/webhook",
                    json={
                        "message": {
                            "successful_payment": {
                                "invoice_payload": invoice_payload,
                                "telegram_payment_charge_id": charge_id,
                            }
                        }
                    },
                    timeout=5.0,
                )
            except Exception as e:
                logger.error("Order payment webhook failed: %s", e)
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
        logger.info("Starting in polling mode")
        async with app:
            await set_menu_button(app)
            await app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    asyncio.run(main())
