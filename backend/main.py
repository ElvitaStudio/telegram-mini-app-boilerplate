from dotenv import load_dotenv
load_dotenv()

import asyncio
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db.database import engine, Base
from models import models       # noqa: F401
from models import pro_models   # noqa: F401
from routers import products, orders, payments
from routers import admin, subscriptions, referrals, broadcasts
from routers.broadcasts import check_scheduled_broadcasts


async def _broadcast_cron():
    """Check for due scheduled broadcasts every 60 seconds."""
    while True:
        await asyncio.sleep(60)
        try:
            await check_scheduled_broadcasts()
        except Exception:
            pass


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    _seed_products_if_empty()
    task = asyncio.create_task(_broadcast_cron())
    yield
    task.cancel()


def _seed_products_if_empty():
    from db.database import SessionLocal
    from models.models import Product

    db = SessionLocal()
    try:
        if db.query(Product).count() == 0:
            samples = [
                Product(name="Капучино", description="Класичний капучино з молочною піною", price=75, category="coffee", in_stock=True),
                Product(name="Латте", description="М'який латте з цілісним молоком", price=85, category="coffee", in_stock=True),
                Product(name="Американо", description="Міцний американо без молока", price=60, category="coffee", in_stock=True),
                Product(name="Круасан", description="Свіжий круасан з маслом", price=55, category="food", in_stock=True),
                Product(name="Чізкейк", description="Ніжний чізкейк з ягодами", price=95, category="food", in_stock=False),
            ]
            db.add_all(samples)
            db.commit()
    finally:
        db.close()


app = FastAPI(
    title="Telegram Mini App API (PRO)",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

frontend_url = os.getenv("FRONTEND_URL", "")
allowed_origins = ["https://web.telegram.org", "https://webk.telegram.org"]
if frontend_url:
    allowed_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(payments.router)

# PRO
app.include_router(admin.router)
app.include_router(subscriptions.router)
app.include_router(referrals.router)
app.include_router(broadcasts.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "version": "2.0.0"}
