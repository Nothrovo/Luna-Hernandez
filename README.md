# 🌙 Luna Hernandez — AI Crypto Research & Decision Support Assistant

**Luna Hernandez** adalah asisten riset dan pendukung keputusan (*decision support*) cryptocurrency personal berbasis AI yang dirancang khusus untuk swing trader di Indonesia (target profit mingguan hingga bulanan).

Bot ini terintegrasi langsung dengan **Telegram Webhook Realtime (0 delay)**, ditenagai oleh **n8n workflow automation**, **Google Gemini 2.5 Flash**, **CoinGecko Market API**, **Google News Live Search**, dan database lokal **SQLite**.

> 📐 **Whitepaper Matematis & Algoritma:**  
> Untuk penjelasan mendalam mengenai seluruh formula indikator (RSI, MACD, BB, ATR, ADX), sistem scoring, BTC Gate, Dynamic TP/SL, dan sizing modal, silakan baca **[Calculations.md](Calculations.md)**.

---

## 🚀 Fitur Unggulan

### 1. 🔍 Deep Analysis Koin (`/coin <simbol>`)
- **Indikator Teknikal Komprehensif:** RSI (14 Wilder), MACD (12, 26, 9), Bollinger Bands (20, 2), Average True Range (ATR 14), ADX (14) untuk kekuatan tren, SMA-20, dan Annualized Volatility.
- **Dynamic TP & SL Engine:** Target TP (+10% s/d +25%) dan Stop Loss (-4.5% s/d -8.5%) dihitung adaptif terhadap volatilitas ATR koin dengan jaminan rasio **$R:R \ge 1 : 2.0$**.
- **BTC Macro Gate:** Sinyal makro Bitcoin (*Bullish*, *Bearish*, atau *Netral*) untuk memvalidasi apakah pasar umum mendukung entri altcoin.
- **Live Google News:** Browsing 10 artikel berita live terbaru secara otomatis untuk mendeteksi katalis fundamental dan narasi pasar terkini.
- **Sintesis Dual-Skenario Gemini 2.5:** Memberikan skenario Konservatif vs. Agresif (Risk-Taker) secara objektif tanpa bahasa patronizing atau larangan kaku (*no rigid "dilarang"*).

### 2. ⚡ Kalkulator Risiko & Tactical Position Sizing (`/risk <simbol> [modal]`)
- **Skor Risiko Komposit (1.0 – 10.0):** Mengukur tingkat bahaya pasar berbasis makro BTC, posisi band Bollinger (%B), overbought/oversold, dan deviasi SMA20.
- **Downside Analysis:** Menghitung jarak koreksi ke *Mean Reversion* (SMA20) dan *Worst-Case Support* (Lower Bollinger Band).
- **Kalkulasi Modal Rupiah Real:** Menghitung estimasi nominal kerugian jika SL terpacu vs. potensi keuntungan jika TP tercapai berdasarkan alokasi modal pengguna (e.g. `/risk sol 200k`).
- **Tactical Sizing & Risk-Taker POV:** Panduan alokasi portofolio (% modal) dan taktik eksekusi (cicil DCA, batas SL ketat) bagi trader agresif.

### 3. 📰 Headline Berita Live & Analisis Sentimen AI (`/news <simbol>`)
- Menampilkan daftar headline berita terhangat (24-48 jam terakhir) langsung dari Google News RSS.
- Dilengkapi ringkasan sentimen, potensi katalis, dan risiko regulasi/pasar oleh AI.
- Contoh: `/news sol`, `/news btc`, atau `/news` untuk pasar global.

### 4. 🎯 Radar Rekomendasi Swing Pullback (`/rec`)
- Menyaring Top 100 koin pasar crypto secara efisien dalam satu panggilan API.
- Memfilter koin likuid non-stablecoin yang berada dalam **Uptrend Mingguan (7d positif)** dan sedang mengalami **Pullback Sehat (koreksi 24h -1% s/d -8%)**.
- Menampilkan 3 rekomendasi terbaik lengkap dengan area entry ideal, target TP/SL dinamis ($R:R \ge 2.0$), peringatan makro BTC, dan tombol pintas `/buy` & `/risk`.

### 5. 🧠 Riset Bebas & Memori Percakapan (`/ask <pertanyaan>`)
- Tanya apa saja seputar kondisi pasar, narasi crypto, atau kelanjutan analisis koin sebelumnya.
- Otomatis melakukan riset berita live Google News dan mengingat konteks percakapan sebelumnya via database SQLite lokal.

### 6. 💼 Manajemen Portofolio & Posisi Aktif
- **`/buy <simbol> [modal]`**: Catat entri posisi dengan modal fleksibel (contoh: `/buy sol 150k`, `/buy btc 200000`, atau default Rp 100.000). Mendukung **Auto-DCA / Average Down** berbobot jika koin sudah ada di portofolio.
- **`/stat <simbol>`**: Evaluasi posisi aktif — menghitung floating PnL realtime, sisa jarak ke TP dinamis, toleransi ke SL dinamis, dan rekomendasi tindakan (*Hold*, *Take Profit*, *Cut Loss*, atau *DCA*).
- **`/sell <simbol> [porsi]`**: Menutup posisi (penuh atau parsial, misal: `/sell tia 50%`) di harga pasar saat ini, menghitung realized PnL (% dan Rp), merekap pengembalian modal, dan mencatat mutasi ke audit ledger `position_transactions`.
- **`/portfolio`**: Ringkasan dinamis koin aktif, total modal teralokasi, estimasi nilai portofolio, total floating PnL, dan status tren makro BTC.

### 7. 🔔 Auto-Alert Peringatan TP / SL (Setiap 30 Menit)
- Cron job n8n otomatis berjalan di latar belakang setiap **30 menit**.
- Mengecek harga pasar realtime posisi aktif di database SQLite dan langsung mengirimkan notifikasi Telegram saat koin menyentuh **Target Profit** atau **Stop Loss**. Dilengkapi state machine hysteresis 2% untuk mencegah loop spam notifikasi.

---

## 📖 Ringkasan Perintah Telegram

| Perintah | Deskripsi | Contoh |
|---|---|---|
| `/start` | Panduan interaktif dan pengenalan fitur Luna Hernandez | `/start` |
| `/help` | Menampilkan ringkasan seluruh perintah yang tersedia | `/help` |
| `/coin <simbol>` | Analisis mendalam teknikal + berita live Google News + AI | `/coin sol`, `/coin btc` |
| `/risk <simbol> [modal]` | Kalkulator skor risiko, downside, & kalkulasi nominal modal | `/risk sol 200k`, `/risk aero` |
| `/news <simbol>` | Headline berita live terhangat & analisis sentimen AI | `/news sol`, `/news btc` |
| `/rec` | Radar 3 rekomendasi koin pullback sehat untuk swing entry | `/rec` |
| `/ask <pertanyaan>` | Tanya jawab pasar live Google News + memori percakapan | `/ask prospek solana minggu ini` |
| `/market` | Top 5 gainers & losers 24 jam dalam IDR | `/market` |
| `/buy <simbol> [modal]` | Catat beli koin & pantau ketat (mendukung auto-DCA) | `/buy sol 150k` |
| `/stat <simbol>` | Evaluasi posisi holder: PnL, jarak TP/SL, saran aksi | `/stat sol` |
| `/sell <simbol> [porsi]` | Tutup posisi penuh/parsial, hitung realized PnL, simpan ledger | `/sell sol`, `/sell tia 50%` |
| `/portfolio` | Rekap portofolio aktif, total modal, PnL, & makro BTC | `/portfolio` |
| `/history [simbol]` | Cek riwayat analisis yang tersimpan di SQLite lokal | `/history sol` |

---

## 🏗️ Arsitektur Sistem

```
Telegram User 
     │
     ▼ (Webhook Realtime 0 Delay)
Cloudflare Tunnel (Quick Tunnel)
     │
     ▼
Docker n8n Engine (Workflow: Luna Hernandez)
     ├── CoinGecko API (Market Chart, Simple Price, Markets)
     ├── Google News RSS (Live Real-Time Browsing)
     ├── Gemini 2.5 Flash (AI Dual-Scenario Synthesis)
     ├── Quantitative Core (RSI, MACD, BB, ATR, ADX, Dynamic TP/SL)
     └── SQLite Database (manage_positions.mjs & crypto_decision_support.sqlite)
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

Sesuaikan parameter bot token, chat ID, dan API key pada file konfigurasi `build-bot.mjs`.

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

### 4. Menjalankan Posisi & Alert Secara Manual (Opsional)
```bash
# Cek alert TP/SL manual
docker compose exec -T n8n node /home/node/.n8n/manage_positions.mjs check-alerts

# Lihat daftar posisi aktif di database
docker compose exec -T n8n node /home/node/.n8n/manage_positions.mjs list-active

# Lihat histori transaksi dan audit ledger
docker compose exec -T n8n node /home/node/.n8n/manage_positions.mjs history
```

---

## 📄 Lisensi & Catatan Risiko
Proyek ini dilisensikan di bawah [MIT License](LICENSE).  
⚠️ **Disclaimer:** *Luna Hernandez adalah sistem pendukung keputusan (decision support system) berbasis analisis kuantitatif dan AI. Segala keputusan jual-beli dan risiko finansial berada di tangan masing-masing pengguna.*
