# 🌙 Luna Hernandez — AI Multi-Market Research & Decision Support Assistant

**Luna Hernandez** adalah asisten riset dan pendukung keputusan (*decision support*) untuk crypto spot, saham AS, dan crypto perpetual futures. Semua angka, skor, arah, dan verdict dihitung oleh mesin JavaScript deterministik; Gemini hanya menyintesis konteks berita dan risiko dalam bahasa natural.

Bot ini terintegrasi dengan **Telegram Webhook**, **n8n**, **Google Gemini 3.5 Flash Lite**, **CoinGecko**, **Alpaca IEX**, **SEC EDGAR**, **Binance USD-M**, **Google News RSS**, dan database lokal **SQLite**.

> 📐 **Whitepaper Matematis & Algoritma:**  
> Untuk penjelasan mendalam mengenai seluruh formula indikator (RSI, MACD, BB, ATR, ADX), sistem scoring, BTC Gate, Dynamic TP/SL, dan sizing modal, silakan baca **[Calculations.md](Calculations.md)**.

---

## 🚀 Fitur Unggulan

### 1. 🔍 Deep Analysis Koin (`/coin <simbol>`)
- **Indikator Teknikal Komprehensif:** RSI (14 Wilder), MACD (12, 26, 9), Bollinger Bands (20, 2), Average True Range (ATR 14), ADX (14) untuk kekuatan tren, SMA-20, dan Annualized Volatility.
- **Dynamic TP & SL Engine:** Target TP (+10% s/d +25%) dan Stop Loss (-4.5% s/d -8.5%) dihitung adaptif terhadap volatilitas ATR koin dengan jaminan rasio **$R:R \ge 1 : 2.0$**.
- **BTC Macro Gate:** Sinyal makro Bitcoin (*Bullish*, *Bearish*, atau *Netral*) untuk memvalidasi apakah pasar umum mendukung entri altcoin.
- **Live Google News:** Browsing 10 artikel berita live terbaru secara otomatis untuk mendeteksi katalis fundamental dan narasi pasar terkini.
- **Sintesis Dual-Skenario Gemini 3.5 Flash Lite:** Memberikan skenario Konservatif vs. Agresif (Risk-Taker) secara objektif tanpa bahasa patronizing atau larangan kaku (*no rigid "dilarang"*).

### 2. 📈 Analisis Saham AS (`/stock <ticker>`)
- Timeframe 1H, 4H, 1D, dan 1W dengan candle tertutup saja.
- RSI, MACD, Bollinger Bands, ATR, ADX, SMA20/50/200, volume, volatilitas, support/resistance, dan relative strength 20 hari terhadap SPY.
- Fundamental dari SEC Company Facts: pertumbuhan revenue, margin, arus kas bebas, leverage, rasio likuiditas, valuasi, dan DCF bear/base/bull.
- Coverage fundamental paling konsisten untuk emiten US-GAAP; ADR, bank, REIT, atau taxonomy nonstandar dapat menghasilkan coverage parsial dan ditampilkan sebagai `N/A`, bukan diisi asumsi.
- Harga memakai paket **Alpaca Basic/IEX gratis**. Cakupannya hanya transaksi IEX dan data historis gratis menahan 15 menit terakhir, sehingga laporan selalu diberi label `DELAYED`; ini bukan pengganti consolidated SIP feed.

### 3. 🧲 Analisis Binance Perpetual Futures (`/futures <pair>`)
- Timeframe 15m, 1H, 4H, dan 1D dari endpoint market-data publik Binance USD-M.
- Menggabungkan mark price, index price, basis, funding history, funding percentile/z-score, perubahan open interest, serta regime harga/OI.
- Arah hanya memakai enum kanonikal `LONG`, `SHORT`, atau `NEUTRAL`; verdict laporan tetap `BUY`, `SELL`, atau `HOLD` agar seragam dengan histori.
- **Analysis-only:** workflow tidak memiliki node order, API key Binance, kalkulasi liquidation price, atau jalur eksekusi futures.

### 4. ⚡ Kalkulator Risiko & Tactical Position Sizing (`/risk <simbol> [modal]`)
- **Skor Risiko Komposit (1.0 – 10.0):** Mengukur tingkat bahaya pasar berbasis makro BTC, posisi band Bollinger (%B), overbought/oversold, dan deviasi SMA20.
- **Downside Analysis:** Menghitung jarak koreksi ke *Mean Reversion* (SMA20) dan *Worst-Case Support* (Lower Bollinger Band).
- **Kalkulasi Modal Rupiah Real:** Menghitung estimasi nominal kerugian jika SL terpacu vs. potensi keuntungan jika TP tercapai berdasarkan alokasi modal pengguna (e.g. `/risk sol 200k`).
- **Tactical Sizing & Risk-Taker POV:** Panduan alokasi portofolio (% modal) dan taktik eksekusi (cicil DCA, batas SL ketat) bagi trader agresif.

### 5. 📰 Headline Berita Live & Analisis Sentimen AI (`/news <simbol>`)
- Menampilkan daftar headline yang terbit dalam maksimal 48 jam terakhir langsung dari Google News RSS.
- Dilengkapi ringkasan sentimen, potensi katalis, dan risiko regulasi/pasar oleh AI.
- Contoh: `/news sol`, `/news btc`, atau `/news` untuk pasar global.

### 6. 🎯 Radar Rekomendasi Multi-Market (`/rec coin|stock|futures`)
- **`/rec` atau `/rec coin`:** menyaring Top 100 CoinGecko untuk koin non-stable yang sedang uptrend mingguan dan mengalami pullback/konsolidasi 24 jam. Output lama tetap kompatibel, termasuk estimasi TP/SL serta pintasan `/buy` dan `/risk`.
- **`/rec stock`:** memindai maksimal 20 ticker dari `STOCK_REC_UNIVERSE` (12 saham likuid secara default), lalu meranking tren harian, kualitas pullback, relative strength 20 hari terhadap SPY, dan average dollar volume IEX. Buka `/stock <ticker>` untuk fundamental SEC/DCF lengkap.
- **`/rec futures`:** mengambil universe kontrak perpetual USDT aktif, memilih maksimal 12 pair dengan quote volume 24 jam terbesar, lalu meranking setup LONG maupun SHORT menggunakan tren 4H, pullback, funding crowding, perubahan OI, dan likuiditas.
- Semua screener menghasilkan maksimal tiga kandidat secara deterministik, tidak memanggil Gemini, dan tidak memaksa hasil bila tidak ada setup yang lolos.

### 7. 🧠 Riset Bebas & Memori Percakapan (`/ask <pertanyaan>`)
- Tanya apa saja seputar kondisi pasar, narasi crypto, atau kelanjutan analisis koin sebelumnya.
- Otomatis melakukan riset berita live Google News dan mengingat konteks percakapan sebelumnya via database SQLite lokal.

### 8. 💼 Manajemen Portofolio & Posisi Aktif Crypto
- **`/buy <simbol> [modal]`**: Catat entri posisi dengan modal fleksibel (contoh: `/buy sol 150k`, `/buy btc 1,5jt`, `/buy btc 200000`, atau default Rp 100.000). Mendukung **Auto-DCA / Average Down** berbobot jika koin sudah ada di portofolio.
- **`/stat <simbol>`**: Evaluasi posisi aktif — menghitung floating PnL realtime, sisa jarak ke TP dinamis, toleransi ke SL dinamis, dan rekomendasi tindakan (*Hold*, *Take Profit*, *Cut Loss*, atau *DCA*).
- **`/sell <simbol> [porsi]`**: Menutup posisi (penuh atau parsial, misal: `/sell tia 50%`) di harga pasar saat ini, menghitung realized PnL (% dan Rp), merekap pengembalian modal, dan mencatat mutasi ke audit ledger `position_transactions`.
- **`/portfolio`**: Ringkasan dinamis koin aktif, total modal teralokasi, estimasi nilai portofolio, total floating PnL, dan status tren makro BTC.

### 9. 🔔 Auto-Alert Peringatan TP / SL (Setiap 30 Menit)
- Cron job n8n otomatis berjalan di latar belakang setiap **30 menit**.
- Mengecek harga pasar realtime posisi aktif di database SQLite dan langsung mengirimkan notifikasi Telegram saat koin menyentuh **Target Profit** atau **Stop Loss**. Dilengkapi state machine hysteresis 2% untuk mencegah loop spam notifikasi.

---

## 📖 Ringkasan Perintah Telegram

| Perintah | Deskripsi | Contoh |
|---|---|---|
| `/start` | Panduan interaktif dan pengenalan fitur Luna Hernandez | `/start` |
| `/help` | Menampilkan ringkasan seluruh perintah yang tersedia | `/help` |
| `/coin <simbol>` | Analisis mendalam teknikal + berita live Google News + AI | `/coin sol`, `/coin btc` |
| `/stock <ticker>` | Saham AS: MTF + relative strength + SEC fundamental + DCF | `/stock AAPL`, `/stock NVDA` |
| `/futures <pair>` | Binance USD-M: MTF + basis + funding + open interest | `/futures BTCUSDT`, `/futures ETH` |
| `/risk <simbol> [modal]` | Kalkulator skor risiko, downside, & kalkulasi nominal modal | `/risk sol 200k`, `/risk aero` |
| `/news <simbol>` | Headline berita live terhangat & analisis sentimen AI | `/news sol`, `/news btc` |
| `/rec coin\|stock\|futures` | Radar maksimal 3 kandidat deterministik per kelas aset | `/rec`, `/rec stock`, `/rec futures` |
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
Docker n8n Engine (Workflow: Luna Hernandez — Multi-Market)
     ├── CoinGecko API (Market Chart, Simple Price, Markets)
     ├── Alpaca Basic/IEX + SEC EDGAR (Saham AS)
     ├── Binance USD-M Public Market Data (Perpetual Futures)
     ├── Google News RSS + Gemini (Narasi, bukan kalkulator/verdict)
     ├── Quantitative Core (Candle contract + indikator + scoring)
     └── SQLite (Posisi crypto, cache provider, histori multi-market)
```

---

## 🛠️ Panduan Instalasi & Menjalankan

### Regression test

Jalankan `npm test` untuk membangun ulang workflow lalu memverifikasi parser nominal, transaksi posisi, migrasi database, kontrak provider, candle tertutup, rumus saham/futures, histori lintas aset, dan konsistensi graph n8n.

### 1. Prasyarat
- Docker & Docker Compose
- Node.js (v20+ disarankan untuk build script)
- Akun Telegram & Bot Token (via [@BotFather](https://t.me/Botfather))
- Google Gemini API Key
- Akun Alpaca dengan API key Basic gratis untuk `/stock`; `/futures` tidak membutuhkan API key Binance

### 2. Konfigurasi Lingkungan
Salin file `.env.example` ke `.env`:
```bash
cp .env.example .env
```

Isi `GEMINI_API_KEY`, `ALPACA_API_KEY_ID`, `ALPACA_API_SECRET`, dan `SEC_USER_AGENT` sesuai contoh. `STOCK_REC_UNIVERSE` bersifat opsional dan dibatasi maksimal 20 ticker. Bot token dan chat ID saat ini tetap dikelola pada Config workflow/build script.

Sumber yang digunakan memang dapat diakses tanpa langganan berbayar: [Alpaca Basic](https://docs.alpaca.markets/docs/about-market-data-api) memberi feed IEX dengan batas paket gratis, sedangkan [SEC Company Facts](https://www.sec.gov/search-filings/edgar-application-programming-interfaces) tidak memerlukan API key tetapi wajib memakai identitas `User-Agent`. Endpoint market-data Binance tunduk pada rate limit dan ketersediaan regional provider.

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

# Uji analisis saham/futures tanpa Telegram
docker compose exec -T n8n node /home/node/.n8n/market_analysis_cli.mjs stock AAPL
docker compose exec -T n8n node /home/node/.n8n/market_analysis_cli.mjs futures BTCUSDT

# Histori gabungan crypto spot, saham, dan futures
docker compose exec -T n8n node /home/node/.n8n/market_analysis_cli.mjs history
```

### Skill ECC untuk Gemini

Folder [`.gemini/`](.gemini/) berisi 11 skill ECC project-local yang dipilih untuk implementasi dan review Midas: TDD, provider contract, error handling, migration, backend patterns, eval/regression, verification, cost-aware LLM, agent audit, dan loop design. Gemini harus membaca [`.gemini/GEMINI.md`](.gemini/GEMINI.md) sebelum mengubah workflow. Instalasi ini tidak menambah runtime dependency pada bot.

---

## 📄 Lisensi & Catatan Risiko
Proyek ini dilisensikan di bawah [MIT License](LICENSE).  
⚠️ **Disclaimer:** *Luna Hernandez adalah sistem pendukung keputusan (decision support system) berbasis analisis kuantitatif dan AI. Segala keputusan jual-beli dan risiko finansial berada di tangan masing-masing pengguna.*
