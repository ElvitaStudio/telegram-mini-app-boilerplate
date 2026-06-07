# Telegram Mini App Boilerplate

Production-ready boilerplate for Telegram Mini Apps.  
**Stack:** Next.js 14 · FastAPI · SQLite · PM2 · Nginx · Monobank + Telegram Stars

---

## Quick Start (5 steps)

```bash
# 1. Clone & enter
git clone https://github.com/yourname/telegram-mini-app-boilerplate
cd telegram-mini-app-boilerplate

# 2. Configure environment
cp frontend/.env.example frontend/.env.local
cp backend/.env.example  backend/.env
# → Edit both files with your values

# 3. Install & build frontend
cd frontend && npm install && npm run build && cd ..

# 4. Install backend dependencies
cd backend && python3 -m venv venv && ./venv/bin/pip install -r requirements.txt && cd ..

# 5. Start everything
pm2 start ecosystem.config.js
```

---

## Project Structure

```
/
├── frontend/               # Next.js 14 App Router
│   ├── src/
│   │   ├── app/            # Pages: /, /catalog, /cart, /orders, /profile
│   │   ├── components/ui/  # TelegramButton, TelegramCard, BottomNav, ...
│   │   ├── hooks/          # useTelegram, useCart, useMainButton, useBackButton
│   │   ├── lib/            # telegram.ts, api.ts, utils.ts
│   │   └── types/          # TypeScript types
│   └── .env.local          # Frontend env vars
│
├── backend/                # FastAPI + SQLite
│   ├── routers/            # products.py, orders.py, payments.py
│   ├── models/             # SQLAlchemy ORM models
│   ├── services/           # auth.py, monobank.py, notifications.py
│   ├── db/                 # database.py (SQLAlchemy engine)
│   ├── main.py             # FastAPI app
│   ├── bot.py              # python-telegram-bot (webhook mode)
│   └── .env                # Backend env vars
│
├── nginx/
│   ├── frontend.conf       # yourdomain.com → :3000
│   └── backend.conf        # api.yourdomain.com → :8000, :8443
│
├── scripts/
│   ├── setup.sh            # Full server setup from scratch
│   ├── deploy.sh           # Deploy frontend/backend/both
│   └── ssl.sh              # SSL via Certbot
│
├── ecosystem.config.js     # PM2 processes
└── docs/setup.md           # Detailed setup guide
```

---

## Environment Variables

### `frontend/.env.local`

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `https://api.yourdomain.com` |
| `NEXT_PUBLIC_BOT_USERNAME` | Telegram bot username (no @) | `myshop_bot` |

### `backend/.env`

| Variable | Description | Example |
|----------|-------------|---------|
| `BOT_TOKEN` | Telegram bot token from @BotFather | `123:ABC...` |
| `MONOBANK_TOKEN` | Monobank merchant token | `u...` |
| `WEBHOOK_URL` | Public backend URL | `https://api.yourdomain.com` |
| `FRONTEND_URL` | Public frontend URL | `https://yourdomain.com` |
| `OWNER_CHAT_ID` | Your Telegram ID for order notifications | `123456789` |
| `WEBHOOK_SECRET` | Optional secret for Telegram webhook | random string |
| `DATABASE_URL` | SQLAlchemy DB URL | `sqlite:///./app.db` |

---

## Deploy to Production

```bash
# 1. Server setup (Ubuntu 22.04, run as root)
bash scripts/setup.sh

# 2. Deploy app
bash scripts/deploy.sh both

# 3. SSL (replace with your domains)
bash scripts/ssl.sh yourdomain.com api.yourdomain.com
```

See [`docs/setup.md`](docs/setup.md) for the full step-by-step guide.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/products` | List products |
| GET | `/api/products/:id` | Get product |
| POST | `/api/orders` | Create order |
| GET | `/api/orders` | User's orders |
| POST | `/api/payments/monobank` | Create Monobank invoice |
| POST | `/api/payments/stars` | Create Stars invoice link |
| POST | `/api/payments/monobank/webhook` | Monobank webhook |
| GET | `/api/health` | Health check |
| GET | `/api/docs` | Swagger UI |

All endpoints (except webhooks) require `X-Telegram-Init-Data` header.

---

## PM2 Processes

| Name | Description | Port |
|------|-------------|------|
| `tma-frontend` | Next.js production server | 3000 |
| `tma-backend` | FastAPI + Uvicorn | 8000 |
| `tma-bot` | python-telegram-bot (webhook) | 8443 |

---

---

# 🇺🇦 Українська версія

## Швидкий старт (5 кроків)

```bash
# 1. Клонуйте та перейдіть до директорії
git clone https://github.com/yourname/telegram-mini-app-boilerplate
cd telegram-mini-app-boilerplate

# 2. Налаштуйте змінні середовища
cp frontend/.env.example frontend/.env.local
cp backend/.env.example  backend/.env
# → Відредагуйте обидва файли

# 3. Встановіть та зберіть фронтенд
cd frontend && npm install && npm run build && cd ..

# 4. Встановіть залежності бекенду
cd backend && python3 -m venv venv && ./venv/bin/pip install -r requirements.txt && cd ..

# 5. Запустіть усе
pm2 start ecosystem.config.js
```

## Деплой на сервер

```bash
# Налаштування сервера (Ubuntu 22.04, від root)
bash scripts/setup.sh

# Деплой додатку
bash scripts/deploy.sh both

# SSL (замініть на свої домени)
bash scripts/ssl.sh yourdomain.com api.yourdomain.com
```

Детальна інструкція: [`docs/setup.md`](docs/setup.md)

## Змінні середовища

### `frontend/.env.local`

| Змінна | Опис |
|--------|------|
| `NEXT_PUBLIC_API_URL` | URL бекенд API |
| `NEXT_PUBLIC_BOT_USERNAME` | Username бота без @ |

### `backend/.env`

| Змінна | Опис |
|--------|------|
| `BOT_TOKEN` | Токен бота від @BotFather |
| `MONOBANK_TOKEN` | Токен Monobank merchant |
| `WEBHOOK_URL` | Публічний URL бекенду |
| `FRONTEND_URL` | Публічний URL фронтенду |
| `OWNER_CHAT_ID` | Ваш Telegram ID для сповіщень |
| `WEBHOOK_SECRET` | Секрет для Telegram webhook |
| `DATABASE_URL` | SQLAlchemy DB URL |
