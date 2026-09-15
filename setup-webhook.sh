#!/usr/bin/env bash
set -e

TOKEN=${BOT_TOKEN}

echo "🔍 Mencari URL Cloudflare Tunnel..."
for i in {1..15}; do
  URL=$(docker logs midas-tunnel 2>&1 | grep -o 'https://[a-zA-Z0-9-]*\.trycloudflare\.com' | tail -1)
  if [ -n "$URL" ]; then
    break
  fi
  sleep 1
done

if [ -z "$URL" ]; then
  echo "❌ Gagal mendapatkan URL tunnel dari container midas-tunnel."
  exit 1
fi

echo "✅ Tunnel aktif: $URL"
echo "🔗 Mendaftarkan Webhook ke Telegram API..."

RESP=$(curl -s -X POST "https://api.telegram.org/bot${TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"${URL}/webhook/midas-bot\", \"secret_token\": \"${WEBHOOK_SECRET}\", \"drop_pending_updates\": true}")

OK=$(echo "$RESP" | python3 -c "import json,sys; print(json.load(sys.stdin).get('ok', False))" 2>/dev/null || echo "false")

if [ "$OK" = "True" ] || [ "$OK" = "true" ]; then
  echo "🎉 Webhook berhasil diset ke Telegram!"
  echo "⚡ Bot sekarang aktif 100% REALTIME (0 delay)!"
else
  echo "⚠️ Respon Telegram: $RESP"
fi
