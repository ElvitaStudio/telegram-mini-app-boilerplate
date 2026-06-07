#!/usr/bin/env bash
# Obtain SSL certificates for all provided domains via Certbot + Nginx.
# Usage: bash ssl.sh yourdomain.com api.yourdomain.com
set -euo pipefail

EMAIL="${CERTBOT_EMAIL:-}"
DOMAINS=("$@")

if [[ ${#DOMAINS[@]} -eq 0 ]]; then
    echo "Usage: $0 domain1.com domain2.com ..."
    exit 1
fi

if [[ -z "${EMAIL}" ]]; then
    read -rp "Enter email for Certbot (Let's Encrypt notices): " EMAIL
fi

for DOMAIN in "${DOMAINS[@]}"; do
    echo "▶ Obtaining SSL for ${DOMAIN}..."
    certbot --nginx \
        --non-interactive \
        --agree-tos \
        --email "${EMAIL}" \
        -d "${DOMAIN}" \
        --redirect
    echo "✓ SSL ready for ${DOMAIN}"
done

# Enable auto-renewal
systemctl enable certbot.timer 2>/dev/null || true
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | sort -u | crontab -

echo ""
echo "════════════════════════════"
echo "  SSL setup complete! 🔒"
echo "  Auto-renewal: enabled"
echo "════════════════════════════"
