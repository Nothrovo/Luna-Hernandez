#!/bin/sh
set -e

echo "🚀 Midas Webhook Auto-Sync aktif..."

# Pastikan curl dan jq terinstall
if ! command -v curl >/dev/null 2>&1 || ! command -v jq >/dev/null 2>&1; then
  apk add --no-cache curl jq >/dev/null 2>&1
fi

CF_IP="104.16.231.132"

while true; do
  URL=$(docker logs midas-tunnel 2>&1 | grep -o 'https://[a-zA-Z0-9-]*\.trycloudflare\.com' | tail -1)
  
  if [ -n "$URL" ]; then
    TARGET_WEBHOOK="${URL}/webhook/midas-bot"
    
    # Cek webhook aktif saat ini di Telegram
    INFO=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo" || true)
    CURRENT_URL=$(echo "$INFO" | jq -r '.result.url // empty' 2>/dev/null || true)
    LAST_ERR=$(echo "$INFO" | jq -r '.result.last_error_message // empty' 2>/dev/null || true)
    
    if [ "$CURRENT_URL" != "$TARGET_WEBHOOK" ] || [ -n "$LAST_ERR" ]; then
      echo "🔗 [AUTO-SYNC] Menunggu tunnel aktif & terverifikasi: $URL"
      
      # Tunggu Cloudflare edge selesai routing (healthz return 200)
      TUNNEL_READY=false
      for i in $(seq 1 20); do
        STATUS=$(curl -s --resolve "$(echo "$URL" | sed 's|https://||'):443:${CF_IP}" "${URL}/healthz" | jq -r '.status // empty' 2>/dev/null || true)
        if [ "$STATUS" = "ok" ]; then
          TUNNEL_READY=true
          break
        fi
        sleep 3
      done
      
      if [ "$TUNNEL_READY" = "true" ]; then
        echo "🌐 [AUTO-SYNC] Tunnel terverifikasi sehat! Mendaftarkan ke Telegram..."
        RESP=$(curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
          -H "Content-Type: application/json" \
          -d "{\"url\":\"${TARGET_WEBHOOK}\",\"ip_address\":\"${CF_IP}\",\"drop_pending_updates\":true}")
        
        OK=$(echo "$RESP" | jq -r '.ok // false' 2>/dev/null || true)
        if [ "$OK" = "true" ]; then
          echo "✅ [AUTO-SYNC] Telegram Webhook berhasil aktif: $TARGET_WEBHOOK"
        else
          echo "⚠️ [AUTO-SYNC] Telegram setWebhook error: $RESP"
        fi
      else
        echo "⏳ [AUTO-SYNC] Tunnel belum siap, akan mencoba lagi..."
      fi
    fi
  fi
  
  sleep 10
done
