#!/usr/bin/env bash
# Full server setup script for Ubuntu 22.04+
# Run as root or with sudo: bash setup.sh
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/tma}"
PYTHON_VERSION="3.11"
NODE_VERSION="20"

echo "══════════════════════════════════════"
echo "  Telegram Mini App — Server Setup"
echo "══════════════════════════════════════"

# ─── System packages ─────────────────────────────────────────────────────────
apt-get update -qq
apt-get install -y -qq \
    curl wget git unzip build-essential \
    nginx certbot python3-certbot-nginx \
    python${PYTHON_VERSION} python${PYTHON_VERSION}-venv python3-pip \
    sqlite3

# ─── Node.js ────────────────────────────────────────────────────────────────
if ! command -v node &>/dev/null; then
    echo "→ Installing Node.js ${NODE_VERSION}..."
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt-get install -y nodejs
fi
echo "✓ Node $(node -v) / npm $(npm -v)"

# ─── PM2 ─────────────────────────────────────────────────────────────────────
if ! command -v pm2 &>/dev/null; then
    echo "→ Installing PM2..."
    npm install -g pm2
    pm2 startup systemd -u "${SUDO_USER:-root}" --hp "/home/${SUDO_USER:-root}"
fi
echo "✓ PM2 $(pm2 -v)"

# ─── App directory ───────────────────────────────────────────────────────────
mkdir -p "${APP_DIR}"
echo "✓ App dir: ${APP_DIR}"

# ─── Nginx ───────────────────────────────────────────────────────────────────
systemctl enable nginx
systemctl start nginx
echo "✓ Nginx running"

echo ""
echo "══════════════════════════════════════"
echo "  Setup complete!"
echo "  Next steps:"
echo "  1. Copy your project to ${APP_DIR}"
echo "  2. Run: bash scripts/deploy.sh"
echo "  3. Run: bash scripts/ssl.sh yourdomain.com api.yourdomain.com"
echo "══════════════════════════════════════"
