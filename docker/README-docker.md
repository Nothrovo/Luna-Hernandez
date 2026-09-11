# Setup Docker Lokal — Midas n8n

## Struktur runtime

```text
Midas/
├── build-bot.mjs                    generator workflow
├── lib/
│   ├── market-analysis.mjs          kalkulator multi-market deterministik
│   └── market-providers.mjs         adapter Alpaca, SEC, Binance, dan News
├── midas-bot.n8n.json               workflow hasil generate
├── docker-compose.yml
└── docker/n8n-data/
    ├── midas-bot.n8n.json           salinan workflow untuk container
    ├── manage_positions.mjs         posisi crypto spot
    ├── market_analysis_cli.mjs      CLI saham/futures/history/cache
    ├── market-analysis.mjs          salinan runtime hasil generate
    └── market-providers.mjs         salinan runtime hasil generate
```

`midas-bot.n8n.json` dan dua modul market di `docker/n8n-data` adalah artifact hasil `npm run build`. Edit sumber di `build-bot.mjs` atau `lib/`, bukan salinan hasil generate.

## Konfigurasi

```bash
cp .env.example .env
```

Isi variabel berikut:

| Variabel | Dipakai untuk | Wajib |
|---|---|---|
| `N8N_ENCRYPTION_KEY` | Enkripsi credential n8n | Ya |
| `GEMINI_API_KEY` | Narasi berita/risiko | Ya untuk fitur AI |
| `ALPACA_API_KEY_ID` | Candle saham IEX | Ya untuk `/stock` |
| `ALPACA_API_SECRET` | Candle saham IEX | Ya untuk `/stock` |
| `SEC_USER_AGENT` | Identitas akses SEC, contoh aplikasi + email | Ya untuk akses SEC yang benar |
| `STOCK_REC_UNIVERSE` | Maksimal 20 ticker yang dipindai `/rec stock` | Opsional |

`/futures` hanya memakai endpoint market-data publik Binance USD-M dan tidak membutuhkan API key Binance. Tidak ada jalur order futures.

## Build, test, dan jalankan

```bash
# Generate artifact dan jalankan seluruh regression test
npm test

# Build image dan mulai service
docker compose build
docker compose up -d

# Import dan publish workflow hasil generate
docker compose exec -T n8n n8n import:workflow --input=/home/node/.n8n/midas-bot.n8n.json
docker compose exec -T n8n n8n publish:workflow --id=RzqHFpZWsPL7CsM1
docker compose restart n8n
```

n8n tersedia di `http://localhost:5678`. Workflow bernama **Luna Hernandez — Multi-Market Decision Support**.

## Smoke test dari container

```bash
docker compose exec -T n8n node /home/node/.n8n/market_analysis_cli.mjs stock AAPL
docker compose exec -T n8n node /home/node/.n8n/market_analysis_cli.mjs futures BTCUSDT
docker compose exec -T n8n node /home/node/.n8n/market_analysis_cli.mjs recommend-stock
docker compose exec -T n8n node /home/node/.n8n/market_analysis_cli.mjs recommend-futures
docker compose exec -T n8n node /home/node/.n8n/market_analysis_cli.mjs history
docker compose exec -T n8n node /home/node/.n8n/manage_positions.mjs list-active
docker compose exec -T n8n node /home/node/.n8n/manage_positions.mjs check-alerts
```

Setiap CLI market mengeluarkan tepat satu objek JSON. Respons gagal juga berbentuk JSON dengan `error.code`, `message`, dan `retryable`, sehingga workflow dapat memilih pesan error tanpa menebak isi `stderr`.

## SQLite

Database default berada di `docker/n8n-data/crypto_decision_support.sqlite` dan memuat tabel legacy posisi/analisis crypto serta tabel baru:

- `market_analysis_sessions`: histori kanonikal saham dan futures.
- `market_data_cache`: cache provider berbasis TTL.
- `position_transactions`: audit ledger transaksi posisi crypto.

Perintah `/history [simbol]` menggabungkan `coin_sessions` dan `market_analysis_sessions`, kemudian mengurutkan hasil terbaru.

## Update workflow

```bash
npm test
docker compose build
docker compose up -d
docker compose exec -T n8n n8n import:workflow --input=/home/node/.n8n/midas-bot.n8n.json
docker compose exec -T n8n n8n publish:workflow --id=RzqHFpZWsPL7CsM1
```

Jangan mengedit workflow JSON langsung karena perubahan akan ditimpa build berikutnya.
