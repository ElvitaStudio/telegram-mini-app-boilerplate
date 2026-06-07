#!/usr/bin/env bash
# Deploy frontend, backend, or both.
# Usage: bash deploy.sh [frontend|backend|both]  (default: both)
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/tma}"
TARGET="${1:-both}"

log() { echo "▶ $*"; }
success() { echo "✓ $*"; }

deploy_frontend() {
    log "Deploying frontend..."
    cd "${APP_DIR}/frontend"

    [[ -f .env.local ]] || { echo "ERROR: frontend/.env.local not found. Copy from .env.example and fill in."; exit 1; }

    npm ci --prefer-offline
    npm run build
    pm2 restart tma-frontend 2>/dev/null || pm2 start "${APP_DIR}/ecosystem.config.js" --only tma-frontend
    success "Frontend deployed"
}

deploy_backend() {
    log "Deploying backend..."
    cd "${APP_DIR}/backend"

    [[ -f .env ]] || { echo "ERROR: backend/.env not found. Copy from .env.example and fill in."; exit 1; }

    # Create venv if not exists
    [[ -d venv ]] || python3 -m venv venv
    ./venv/bin/pip install -q -r requirements.txt

    pm2 restart tma-backend 2>/dev/null || pm2 start "${APP_DIR}/ecosystem.config.js" --only tma-backend
    pm2 restart tma-bot    2>/dev/null || pm2 start "${APP_DIR}/ecosystem.config.js" --only tma-bot
    success "Backend + Bot deployed"
}

deploy_nginx() {
    log "Installing Nginx configs..."
    cp "${APP_DIR}/nginx/frontend.conf" /etc/nginx/sites-available/tma-frontend
    cp "${APP_DIR}/nginx/backend.conf"  /etc/nginx/sites-available/tma-backend
    ln -sf /etc/nginx/sites-available/tma-frontend /etc/nginx/sites-enabled/
    ln -sf /etc/nginx/sites-available/tma-backend  /etc/nginx/sites-enabled/
    nginx -t && systemctl reload nginx
    success "Nginx reloaded"
}

case "${TARGET}" in
    frontend) deploy_frontend ;;
    backend)  deploy_backend  ;;
    nginx)    deploy_nginx    ;;
    both)
        deploy_frontend
        deploy_backend
        deploy_nginx
        ;;
    *)
        echo "Usage: $0 [frontend|backend|nginx|both]"
        exit 1
        ;;
esac

pm2 save
echo ""
echo "════════════════════════════"
echo "  Deploy complete! 🚀"
echo "  pm2 status:"
pm2 list
