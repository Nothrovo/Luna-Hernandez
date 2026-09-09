# Setup Docker Lokal — Midas n8n

## Struktur

```
Midas/
├── docker-compose.yml        ← definisi service n8n
├── .env                      ← encryption key (jangan commit!)
├── .env.example              ← template .env
├── .gitignore
├── Makefile                  ← shortcut perintah
├── docker/
│   ├── Dockerfile            ← n8n + sqlite3
│   └── n8n-data/             ← data persisten n8n (workflow, DB)
└── crypto-decision-support-btc-eth.n8n.json  ← workflow untuk diimport
```

## Perintah Cepat

| Perintah | Aksi |
|----------|------|
| `make up` | Jalankan n8n |
| `make down` | Hentikan n8n |
| `make logs` | Lihat log real-time |
| `make db` | Baca tabel sinyal SQLite |
| `make shell` | Masuk shell container |
| `make build` | Rebuild image |

## Langkah Pertama Kali

```bash
# 1. Build image (hanya sekali atau setelah update)
make build

# 2. Jalankan
make up

# 3. Buka browser
# http://localhost:5678

# 4. Import workflow:
#    Settings → Import Workflow → pilih crypto-decision-support-btc-eth.n8n.json

# 5. Isi Config node:
#    - telegramChatId: ID chat Telegram kamu
#    - ollamaBaseUrl: http://host.docker.internal:11434  (sudah default)
#    - ollamaModel: qwen3.5:2b  (sudah default)

# 6. Isi credential Telegram di node "Send Telegram Signal"

# 7. Activate workflow (toggle kanan atas)
```

## Cek Database SQLite

```bash
# Lewat Makefile
make db

# Atau langsung sqlite3 di host (lokasi file di dalam volume)
sqlite3 ./docker/n8n-data/crypto_decision_support.sqlite \
  'SELECT * FROM signal_harian ORDER BY tanggal DESC;'
```

## Update n8n

```bash
docker compose pull   # tidak berlaku karena pakai build
make build            # rebuild dengan versi n8n terbaru
make down && make up
```
