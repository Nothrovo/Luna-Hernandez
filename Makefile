.PHONY: build up down restart logs shell db status build-bot webhook tunnel-url

# Build ulang image
build:
	docker compose build --no-cache

# Jalankan n8n + Cloudflare Tunnel + Otomatis Set Webhook ke Telegram
up:
	docker compose up -d
	@sleep 3
	@./setup-webhook.sh
	@echo ""
	@echo "🌐 n8n Web UI: http://localhost:5678"

# Hentikan semua service
down:
	docker compose down

# Restart service
restart:
	docker compose restart
	@sleep 3
	@./setup-webhook.sh

# Lihat log real-time n8n
logs:
	docker compose logs -f n8n

# Lihat log tunnel
logs-tunnel:
	docker compose logs -f tunnel

# Cek URL tunnel saat ini
tunnel-url:
	@docker logs midas-tunnel 2>&1 | grep -o 'https://[a-zA-Z0-9-]*\.trycloudflare\.com' | tail -1

# Daftarkan ulang webhook secara manual
webhook:
	@./setup-webhook.sh

# Masuk ke shell container n8n
shell:
	docker compose exec n8n sh

# Baca database SQLite
db:
	docker compose exec n8n sqlite3 /home/node/.n8n/crypto_decision_support.sqlite \
		"SELECT * FROM coin_sessions ORDER BY id DESC LIMIT 10;"

# Cek status container
status:
	docker compose ps

# Rebuild workflow bot JSON
build-bot:
	node build-bot.mjs
	@echo "midas-bot.n8n.json siap diimport ke n8n"
