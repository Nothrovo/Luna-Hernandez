# 🌙 Luna Hernandez — AI Crypto Research & Decision Support Assistant

**Luna Hernandez** adalah asisten riset dan pendukung keputusan (*decision support*) crypto personal berbasis AI yang dirancang khusus untuk swing trader di Indonesia (target profit mingguan hingga bulanan).

Bot ini terintegrasi langsung dengan **Telegram Webhook Realtime (0 delay)**, ditenagai oleh **n8n workflow automation**, **Google Gemini 3.5 Flash Lite**, **CoinGecko Market API**, **Google News Live Search**, dan database lokal **SQLite**.

---

## 🚀 Fitur Unggulan

### 1. 🔍 Deep Analysis Koin (`/coin <simbol>`)
- **Indikator Teknikal Lengkap:** RSI (14), MACD (12, 26, 9), Bollinger Bands (20, 2), Average True Range (ATR), ADX (14) untuk kekuatan tren, SMA-20, dan level Swing Low 14 hari sebagai batas invalidasi tren.
- **BTC Macro Gate:** Sinyal makro Bitcoin (bullish / bearish / netral) untuk memvalidasi apakah pasar mendukung entri altcoin.
- **Live Google News:** Browsing 10 artikel berita live terbaru secara otomatis untuk menganalisis katalis dan sentimen fundamental terkini.
- **Sintesis Gemini 3.5 Flash Lite:** Analisis disintesis oleh AI dalam tempo super cepat (~2 detik) dengan panduan level TP (+12%) dan Stop Loss yang realistis.

### 2. 🧠 Riset Bebas & Memori Percakapan (`/ask <pertanyaan>`)
- Tanya apa saja seputar kondisi pasar, tren narasi crypto, atau kelanjutan analisis koin sebelumnya.
- Otomatis melakukan riset berita live Google News dan membaca riwayat analisis yang tersimpan di database SQLite lokal.

### 3. 🎯 Radar Rekomendasi Swing Pullback (`/rec`)
- Menyaring Top 100 koin pasar crypto secara efisien dalam satu panggilan API.
- Memfilter koin likuid non-stablecoin yang berada dalam **Uptrend Mingguan (7d positif)** dan sedang mengalami **Pullback Sehat (koreksi 24h -1% s/d -8%)**.
- Menampilkan 3 rekomendasi terbaik lengkap dengan area entry ideal, target TP (+12%), batas SL (-6%), dan tombol pintas `/buy`.

### 4. 💼 Manajemen Portofolio & Posisi Aktif
- **`/buy <simbol> [modal]`**: Catat entri posisi dengan modal fleksibel (contoh: `/buy sol 150k`, `/buy btc 200000`, atau `/buy sol` dengan default Rp 100.000). Mendukung **Auto-DCA / Average Down** jika koin sudah aktif.
- **`/stat <simbol>`**: Evaluasi posisi khusus holder — menghitung floating PnL realtime, sisa jarak ke TP, toleransi ke SL, dan rekomendasi tindakan tegas (*Hold*, *Take Profit*, *Cut Loss*, atau *DCA*).
- **`/sell <simbol>`**: Menutup posisi di harga pasar saat ini, menghitung realized PnL (% dan Rp), merekap total pengembalian dana, dan menghapus koin dari pantauan.
- **`/portfolio`**: Ringkasan dinamis koin aktif, total modal teralokasi, estimasi nilai portofolio, total floating PnL, dan konteks makro BTC.

### 5. 🔔 Auto-Alert Peringatan TP / SL (Setiap 2 Jam)
- Cron job n8n berjalan di latar belakang setiap 2 jam.
- Otomatis mengecek harga posisi aktif dan langsung mengirimkan notifikasi peringatan ke Telegram saat koin menyentuh **Target Profit** atau **Stop Loss**.

---

## 📖 Ringkasan Perintah Telegram

| Perintah | Deskripsi | Contoh |
|---|---|---|
| `/start` | Panduan interaktif dan pengenalan fitur Luna Hernandez | `/start` |
| `/help` | Menampilkan ringkasan seluruh perintah yang tersedia | `/help` |
| `/rec` | Radar 3 rekomendasi koin pullback sehat untuk swing entry | `/rec` |
| `/coin <simbol>` | Analisis mendalam teknikal + berita live Google News + AI | `/coin sol`, `/coin btc` |
| `/ask <pertanyaan>` | Tanya jawab pasar live Google News + memori database | `/ask prospek solana bulan ini` |
| `/buy <simbol> [modal]` | Catat beli koin & pantau ketat (mendukung auto-DCA) | `/buy sol 150k` |
| `/stat <simbol>` | Evaluasi posisi holder: PnL, jarak TP/SL, saran aksi | `/stat sol` |
| `/sell <simbol>` | Tutup posisi, hitung realized PnL, dan unlist koin | `/sell sol` |
| `/portfolio` | Rekap portofolio aktif, total modal, PnL, & makro BTC | `/portfolio` |
| `/market` | Top 5 gainers & losers 24 jam dalam IDR | `/market` |
| `/history [simbol]` | Cek riwayat analisis yang tersimpan di SQLite lokal | `/history sol` |

---

## 🏗️ Arsitektur Sistem

```
Telegram User 
     │
     ▼ (Webhook Realtime)
Cloudflare Tunnel (Quick Tunnel)
     │
     ▼
Docker n8n Engine
     ├── CoinGecko API (Market Chart, Simple Price, Markets)
     ├── Google News RSS (Live Real-time Browsing)
     ├── Gemini 3.5 Flash Lite (AI Decision Support Synthesis)
     └── SQLite Engine (manage_positions.mjs & database.sqlite)
```

---

## 🛠️ Panduan Instalasi & Menjalankan

### 1. Prasyarat
- Docker & Docker Compose
- Node.js (v20+ disarankan untuk build script)
- Akun Telegram & Bot Token (via [@BotFather](https://t.me/Botfather))
- Google Gemini API Key

### 2. Konfigurasi Lingkungan
Salin file `.env.example` ke `.env`:
```bash
cp .env.example .env
```

Sesuaikan parameter bot token, chat ID, dan API key pada file konfigurasi workflow `build-bot.mjs`.

### 3. Generate Workflow & Jalankan Container
```bash
# Generate workflow JSON
node build-bot.mjs

# Jalankan service docker (n8n, tunnel, webhook-sync)
docker compose up -d

# Import & publish workflow ke n8n
docker compose exec -T n8n n8n import:workflow --input=/home/node/.n8n/midas-bot.n8n.json
docker compose exec -T n8n n8n publish:workflow --id=RzqHFpZWsPL7CsM1
docker compose restart n8n
```

---

## ⚠️ Disclaimer
*Luna Hernandez dirancang semata-mata sebagai **decision support tool** (alat bantu riset dan analisis keputusan). Seluruh analisis dan sinyal yang dihasilkan bukanlah saran finansial resmi. Selalu lakukan riset mandiri (DYOR) dan kendalikan manajemen risiko modal kamu.*
