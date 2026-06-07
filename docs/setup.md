# Setup Guide

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 20+ | frontend build |
| Python | 3.11+ | backend + bot |
| PM2 | latest | `npm i -g pm2` |
| Nginx | 1.18+ | reverse proxy |
| Certbot | latest | SSL |

---

## 1. Create a Telegram Bot

1. Open [@BotFather](https://t.me/BotFather) in Telegram
2. `/newbot` → choose name and username
3. Copy the token → `BOT_TOKEN` in `backend/.env`
4. `/newapp` → set Web App URL to `https://yourdomain.com`

---

## 2. Monobank Acquiring

1. Register at [monobank.ua](https://monobank.ua) Business
2. Get your merchant token from the dashboard
3. Set `MONOBANK_TOKEN` in `backend/.env`
4. Set webhook URL: `https://api.yourdomain.com/api/payments/monobank/webhook`

---

## 3. Server Setup (Ubuntu 22.04)

```bash
# Upload project to server
scp -r . user@your-server:/var/www/tma

# Run server setup (as root)
cd /var/www/tma
bash scripts/setup.sh
```

---

## 4. Configure Environment

```bash
# Frontend
cp frontend/.env.example frontend/.env.local
# Edit frontend/.env.local:
# NEXT_PUBLIC_API_URL=https://api.yourdomain.com
# NEXT_PUBLIC_BOT_USERNAME=your_bot

# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your tokens
```

---

## 5. Update Nginx Domain Names

Replace `yourdomain.com` in:
- `nginx/frontend.conf`
- `nginx/backend.conf`

---

## 6. Deploy

```bash
bash scripts/deploy.sh both
bash scripts/ssl.sh yourdomain.com api.yourdomain.com
```

---

## 7. Set Bot Webhook

After SSL is ready, the bot sets its webhook automatically on startup.
To set manually:

```bash
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://api.yourdomain.com/bot/webhook"
```

---

## Useful Commands

```bash
pm2 status               # check all processes
pm2 logs tma-backend     # backend logs
pm2 logs tma-frontend    # frontend logs
pm2 logs tma-bot         # bot logs
pm2 restart all          # restart everything
nginx -t                  # test nginx config
```
