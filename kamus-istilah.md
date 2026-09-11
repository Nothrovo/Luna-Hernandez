# 📖 Kamus Istilah & Singkatan Teknis Bot Midas (Luna Hernandez)

Dokumen ini menjelaskan istilah teknis, indikator, dan strategi yang digunakan Luna pada crypto spot, saham AS, dan crypto perpetual futures.

---

## 1. Strategi & Gaya Trading (Cara Bot Mencari Duit)

### Swing Trading
* **Arti:** Trading ayunan.
* **Maksudnya:** Gaya trading santai di mana kita menahan koin selama beberapa hari hingga beberapa minggu (bukan scalping menitan, bukan juga hodl bertahun-tahun) untuk menangkap satu ayunan tren kenaikan besar.
* **Kenapa di Bot:** Luna Hernandez didesain khusus untuk swing trading agar kamu tidak perlu memantau chart 24 jam nonstop.

### Trend-Following
* **Arti:** Mengikuti tren yang sedang berjalan.
* **Maksudnya:** Filosofi "jangan melawan arus". Kalau koin lagi tren naik (uptrend), kita hanya cari peluang beli (Buy). Kalau tren lagi turun (downtrend), kita hindari atau tunggu.
* **Kenapa di Bot:** Probabilitas cuan jauh lebih tinggi saat berenang searah arus air dibanding melawan arus air.

### Pullback (Trend-Continuation Setup)
* **Arti:** Koreksi sementara / diskon di dalam tren naik.
* **Maksudnya:** Bayangkan mobil mau lompat jauh, dia mundur sedikit untuk ancang-ancang. Koin yang lagi uptrend kuat tidak akan naik lurus terus, pasti ada jeda istirahat (pullback) sebelum lanjut naik lagi.
* **Kenapa di Bot:** Logika utama bot kita adalah *Buy on Dip* pada koin yang uptrend. Kita tidak mau beli pas lagi naik kencang, tapi nunggu pas harganya diskon sesaat.

### Chasing Momentum (FOMO / Beli di Pucuk)
* **Arti:** Mengejar harga yang sudah terlanjur terbang.
* **Maksudnya:** Kesalahan pemula yang melihat koin naik +30% hijau tebal, panik takut ketinggalan (FOMO), lalu langsung beli. Seringnya setelah dibeli, harganya langsung koreksi (nyangkut di pucuk).
* **Kenapa di Bot:** Bot didesain untuk menyaring dan melarang kamu beli koin yang sudah terlalu overbought/terbang tinggi.

### Mean Reversion
* **Arti:** Kembali ke harga rata-rata.
* **Maksudnya:** Hukum elastisitas karet gelang. Harga koin kalau diregangkan terlalu jauh dari rata-ratanya (ke atas atau ke bawah), pada akhirnya cenderung akan memantul kembali ke harga wajarnya (garis tengah/SMA20).
* **Kenapa di Bot:** Digunakan untuk mendeteksi apakah harga sudah terlalu murah dari rata-ratanya sehingga layak dibeli (pullback).

### Dollar Cost Averaging (DCA) / Average Down
* **Arti:** Membeli bertahap saat harga turun.
* **Maksudnya:** Kalau kamu beli di Rp 1.000, lalu harga turun ke Rp 800 tapi trennya masih bagus, kamu beli lagi sejumlah nominal tertentu agar harga modal rata-rata kamu turun (misal jadi Rp 900).
* **Kenapa di Bot:** Fitur `/buy <simbol> [modal]` bot secara otomatis menghitung *Auto-DCA* jika koin tersebut sudah pernah kamu beli sebelumnya.

---

## 2. Indikator Teknikal & Sinyal Bot (Alat Sensor Bot)

### RSI (Relative Strength Index)
* **Arti:** Indeks Kekuatan Relatif (skala angka 0 sampai 100).
* **Maksudnya:** Spedometer untuk mengukur apakah suatu koin sudah "kekenyangan pembeli" atau "kehabisan penjual".
  * **Overbought (>70):** Koin sudah terlalu panas / kekenyangan beli, rawan profit taking (turun).
  * **Oversold (<30):** Koin sudah terlalu murah / panik jual ekstrem, ada potensi memantul (rebound).
  * **Zona Sehat (45–60):** Area pullback ideal di mana harga sedang rileks sejenak tanpa merusak tren naik.
* **Kenapa di Bot:** Membantu bot tahu apakah koin lagi diskon sehat atau sudah kemahalan.

### MACD (Moving Average Convergence Divergence)
* **Arti:** Perbedaan pergerakan rata-rata harga jangka pendek dan panjang.
* **Maksudnya:** Kompas momentum pasar.
  * **MACD Bullish (▲):** Garis momentum memotong ke atas. Pembeli mendominasi, dorongan naik sedang terbentuk.
  * **MACD Bearish (▼):** Garis momentum menukik ke bawah. Tekanan jual mendominasi.
* **Kenapa di Bot:** Syarat mutlak konfirmasi tren naik bersama dengan SMA.

### Lagging Indicator
* **Arti:** Indikator yang terlambat / membuntuti harga.
* **Maksudnya:** Indikator seperti MACD dan Moving Average menghitung rata-rata dari data harga masa lalu, jadi sinyalnya baru muncul *setelah* harga mulai bergerak, bukan meramal masa depan.
* **Kenapa Penting:** Supaya kita sadar bahwa indikator ini adalah alat *konfirmasi*, bukan bola kristal ramalan.

### SMA & EMA (Moving Averages)
* **Arti:** Rata-rata pergerakan harga.
  * **SMA-20:** Rata-rata harga 20 hari terakhir.
  * **EMA (Exponential Moving Average):** Rata-rata yang lebih memberi bobot pada harga terbaru.
* **Maksudnya:** Garis penentu tren utama. Kalau harga di atas SMA-20, artinya dalam jangka pendek pasar lagi senang beli (uptrend).
* **Kenapa di Bot:** Bot memakai SMA-20 sebagai garis pertahanan tren dan garis tengah Bollinger Bands.

### Bollinger Bands & %B (Percent B)
* **Arti:** Pita batas volatilitas harga.
* **Maksudnya:** Jalur jalan raya harga dengan pembatas atas (*Upper Band*), garis tengah (*SMA-20*), dan pembatas bawah (*Lower Band*).
  * **%B (Percent B):** Angka yang menunjukkan posisi harga relatif terhadap pita tersebut.
  * `%B > 0.85` / mendekati 1: Harga mepet trotoar atas (sudah mahal).
  * `%B < 0.30` / mendekati 0: Harga mepet trotoar bawah (potensi diskon).
  * `%B = 0.50`: Harga tepat di marka tengah (harga rata-rata).
* **Kenapa di Bot:** Dipakai bersama RSI untuk memvalidasi setup pullback.

### ADX (Average Directional Index)
* **Arti:** Indeks Kekuatan Arah Tren (skala angka 0–100).
* **Maksudnya:** Mengukur **seberapa kuat** tren suatu koin, tanpa memedulikan arahnya (bisa tren naik kencang atau tren turun kencang).
  * `ADX < 20`: Tren lemah / pasar sedang lesu / sideways.
  * `ADX 20–25`: Tren mulai terbentuk.
  * `ADX > 25`: Tren sangat kuat dan solid.
* **Kenapa di Bot:** Koin TIA kamu kemarin memiliki `ADX 30.1 (Kuat)`. Artinya tren naiknya bukan sekadar pantulan angin-anginan, tapi didorong volume nyata.

### ATR (Average True Range) & Volatilitas
* **Arti:** Rentang gerak rata-rata sebenarnya.
* **Maksudnya:** Mengukur seberapa liar koin bergerak dalam sehari. Koin receh bisa naik-turun 20% sehari (ATR tinggi), sementara koin besar seperti BTC naiknya cuma 2% (ATR rendah).
* **Kenapa di Bot:** Menentukan jarak Stop Loss yang masuk akal. Koin yang sangat liar butuh toleransi Stop Loss yang sedikit lebih longgar agar tidak gampang tersenggol *noise*.

### Multiple Timeframe Analysis (MTF) & Bias Filter
* **Arti:** Analisis gabungan berbagai kerangka waktu (harian, 4 jam, mingguan).
* **Maksudnya:** Menggunakan teropong jauh (timeframe besar) untuk melihat cuaca umum, lalu menggunakan kaca pembesar (timeframe kecil) untuk melangkah.
* **Kenapa di Bot:** Mencegah bot tertipu oleh pantulan kecil di grafik 1 jam padahal di grafik harian koin tersebut lagi terjun bebas.

---

## 3. Kondisi & Siklus Pasar (Psikologi Pasar)

### Impulse vs Correction (Siklus Ayunan)
* **Arti:** Gelombang pendorong vs gelombang koreksi.
* **Maksudnya:** Pasar bergerak zigzag: melonjak naik kencang (*impulse*), istirahat turun sejenak (*correction*), lalu melonjak lagi.
* **Kenapa di Bot:** Kita mau masuk trading saat fase *correction* hampir selesai, agar kita bisa menunggangi fase *impulse* berikutnya.

### Akumulasi vs Distribusi
* **Arti:** Tahap borong diam-diam vs tahap jualan diam-diam (oleh bandar/institusi besar).
  * **Akumulasi:** Harga terlihat membosankan di bawah, pemain besar pelan-pelan mengumpulkan barang sebelum menerbangkannya.
  * **Distribusi:** Harga terlihat masih ramai dan naik sedikit, tapi pemain besar mulai mencicil jualan ke ritel sebelum harga dijatuhkan.
* **Kenapa di Bot:** Kewaspadaan jika koreksi ternyata bukan diskon, melainkan awal distribusi (bandar mulai kabur).

### Sideways / Chop / Whipsaw
* **Arti:** Pasar mendatar, gergaji, atau cambuk bolak-balik.
* **Maksudnya:** Harga bergerak naik turun tak tentu arah di tempat yang sempit tanpa ada tren yang jelas. Mirip gergaji kayu (*chop*) yang sering memotong modal trader karena sinyal beli/jual palsu (*whipsaw*).
* **Kenapa di Bot:** Bot menyaring pasar ini menggunakan indikator ADX agar tidak buang-buang biaya transaksi di pasar yang lagi jalan di tempat.

### Pisau Jatuh (Falling Knife)
* **Arti:** Menangkap koin yang sedang terjun bebas.
* **Maksudnya:** Mencoba membeli koin yang turun tajam tanpa ada tanda-tanda berhenti. Sering dianalogikan seperti mencoba menangkap pisau yang jatuh dari meja: tanganmu yang berdarah.
* **Kenapa di Bot:** Bot dilarang membeli koin hanya karena "harganya sudah murah". Harus ada konfirmasi struktur dasar/swing low sebelum berani beli.

### BTC Gate (Macro Gate)
* **Arti:** Pintu gerbang makro Bitcoin.
* **Maksudnya:** Bitcoin adalah "raja" pasar kripto (menguasai >55% kapitalisasi pasar). Jika Bitcoin bersin, seluruh altcoin kena flu.
  * Kalau BTC Bearish (di bawah SMA-20 & MACD negatif), pintu gerbang ditutup (sinyal altcoin ditahan/HOLD).
  * Kalau BTC Bullish/Stabil, pintu gerbang dibuka (lampu hijau untuk belanja altcoin).
* **Kenapa di Bot:** Seperti kasus TIA kemarin, TIA sinyal aslinya BUY, tapi tertahan jadi HOLD karena BTC Gate mendeteksi Bitcoin sedang rawan koreksi.

---

## 4. Manajemen Risiko & Posisi (Menjaga Uang Kamu)

### Floating PnL vs Realized PnL
* **Arti:** Keuntungan/kerugian mengambang vs nyata.
  * **Floating PnL:** Laba/rugi yang ada di layar selagi koin belum dijual. Contoh: -3.02% (-Rp 906) pada TIA kamu. Angka ini belum permanen, masih bisa berubah.
  * **Realized PnL:** Laba/rugi yang sudah sah dikunci saat kamu mengeksekusi jual (`/sell`). Duitnya sudah resmi masuk kembali ke kantong.

### Target Profit (TP)
* **Arti:** Titik target keluar untuk mengantongi keuntungan.
* **Maksudnya:** Harga tujuan yang sudah ditentukan sejak awal sebelum beli. Di bot kita, default TP dipatok realistis sekitar **+10% s/d +15%** (rata-rata +12%).
* **Kenapa di Bot:** Menghilangkan rasa serakah. Saat target tercapai, bot menyarankan jual agar profit tidak menguap kembali.

### Stop Loss (SL) & Invalidation Point (Titik Invalidasi)
* **Arti:** Batas proteksi memotong kerugian / titik gugurnya analisa.
* **Maksudnya:** "Kalau harga turun sampai angka X, berarti analisa saya salah, saya harus keluar sekarang sebelum rugi lebih besar."
* **Kenapa di Bot:** Benteng pertahanan hidup seorang trader. Lebih baik rugi terukur 3–5% daripada uang amblas 50% karena berharap keajaiban.

### Swing Low
* **Arti:** Titik harga terendah dari ayunan terakhir (misal 14 hari ke belakang).
* **Maksudnya:** Lembah terakhir di grafik. Di dalam tren naik, harga seharusnya TIDAK PERNAH menembus ke bawah lembah sebelumnya. Kalau lembah ini ditembus, berarti tren naik resmi hancur.
* **Kenapa di Bot:** Dipakai sebagai patokan Stop Loss objektif berdasarkan struktur grafik koin, bukan tebak-tebakan.

### Trailing Stop & BEP (Break Even Point)
* **Arti:** Menggeser Stop Loss mengikuti kenaikan harga.
  * **BEP (Modal Balik):** Menggeser level Stop Loss ke harga modal beli. Jadi kalaupun harga tiba-tiba jatuh, kita tidak rugi sepeser pun.
  * **Trailing Stop:** Kalau harga sudah naik +10%, kita pasang pengaman di +6%. Kalau harga naik ke +15%, pengaman ikut digeser ke +11%.
* **Kenapa di Bot:** Bot di `/stat` akan memberikan peringatan *"AMANKAN MODAL (PASANG TRAILING STOP)"* jika koinmu sudah floating profit > +6%.

### Position Sizing & Risk Management
* **Arti:** Menakar ukuran modal per transaksi.
* **Maksudnya:** Jangan memasukkan semua uang ke dalam satu keranjang koin (*All-in*). Batasi risiko per transaksi (misal tiap koin hanya dialokasikan Rp 30.000 – Rp 150.000 sesuai kapasitas).
* **Kenapa di Bot:** Perintah `/buy tia 30k` memungkinkan kamu mengontrol modal presisi per koin agar portofolio tetap sehat.

### Drawdown
* **Arti:** Penurunan puncak modal ke titik terendah.
* **Maksudnya:** Pengurangan total nilai portofolio kamu saat mengalami rangkaian transaksi rugi beruntun.
* **Kenapa Penting:** Bot yang bagus bukan yang profitnya 1000% dalam semalam, tapi yang punya *drawdown* kecil sehingga modal trader tetap selamat di segala kondisi pasar.

### Backtesting & Paper Trading
* **Arti:** Uji coba masa lalu & simulasi tanpa uang asli.
  * **Backtesting:** Menguji aturan bot memakai data grafik beberapa tahun ke belakang untuk melihat apakah strateginya menguntungkan.
  * **Paper Trading:** Mencatat transaksi simulasi menggunakan catatan di bot (seperti database SQLite di bot Luna) tanpa mempertaruhkan uang sungguhan dulu sampai terbiasa.

---

## 5. Saham & Fundamental

### Ticker
* **Arti:** Kode singkat saham, misalnya `AAPL` atau `NVDA`.
* **Kenapa di Bot:** Menjadi identitas input `/stock`. Ticker berbeda dari nama perusahaan dan dapat mengandung titik atau tanda hubung.

### IEX vs SIP
* **IEX:** Satu bursa saham AS yang datanya tersedia pada paket gratis Alpaca Basic.
* **SIP:** Consolidated tape yang menggabungkan transaksi seluruh bursa utama AS.
* **Kenapa Penting:** Feed IEX gratis bukan gambaran volume/price discovery seluruh pasar. Luna menandai laporan saham sebagai `DELAYED` dan tidak menyamarkannya sebagai SIP.

### SEC EDGAR / Company Facts
* **Arti:** Database publik laporan emiten AS. Company Facts menyajikan fakta XBRL dari 10-K/10-Q dalam JSON.
* **Kenapa di Bot:** Sumber revenue, net income, arus kas, aset, liabilitas, ekuitas, kas, utang, dan saham beredar untuk perhitungan fundamental manual.

### Free Cash Flow (FCF)
* **Arti:** Kas operasi yang tersisa setelah belanja modal.
* **Formula Luna:** `FCF = Operating Cash Flow - |Capital Expenditure|`.
* **Kenapa di Bot:** Dipakai untuk FCF margin, FCF yield, dan DCF.

### DCF (Discounted Cash Flow)
* **Arti:** Model yang mengubah proyeksi arus kas masa depan menjadi nilai hari ini menggunakan discount rate.
* **Kenapa di Bot:** Luna menampilkan skenario bear/base/bull yang transparan. Hasilnya indikatif karena kualitas tag XBRL dan asumsi pertumbuhan berbeda antar-emiten.

### Relative Strength vs SPY
* **Arti:** Selisih return 20 hari saham terhadap ETF SPY.
* **Kenapa di Bot:** Membedakan saham yang naik karena pasar secara umum dari saham yang benar-benar mengungguli benchmark.

### Recommendation Universe
* **Arti:** Daftar saham yang memang diizinkan masuk proses screening.
* **Kenapa di Bot:** `/rec stock` tidak mengklaim memindai seluruh bursa. Luna memeriksa maksimal 20 ticker dari `STOCK_REC_UNIVERSE`, sehingga cakupan, biaya request, dan hasilnya transparan.

---

## 6. Perpetual Futures

### Perpetual Futures
* **Arti:** Kontrak derivatif tanpa tanggal jatuh tempo yang mengikuti harga aset acuan melalui mekanisme funding.
* **Kenapa di Bot:** `/futures` menganalisis kontrak Binance USD-M berquote USDT. Fitur ini hanya analisis dan tidak mengirim order.

### Mark Price & Index Price
* **Index Price:** Harga acuan gabungan pasar spot.
* **Mark Price:** Harga referensi bursa untuk perhitungan unrealized PnL dan mekanisme liquidation.
* **Kenapa di Bot:** Selisih keduanya dihitung sebagai basis; Luna tidak mengganti mark price dengan harga spot biasa.

### Basis
* **Arti:** Selisih relatif mark price terhadap index price.
* **Formula:** `Basis% = (Mark / Index - 1) × 100`.
* **Interpretasi:** Basis positif berarti kontrak berada di atas indeks; basis negatif berarti di bawah indeks.

### Funding Rate
* **Arti:** Pembayaran berkala antara pemegang posisi long dan short agar harga perpetual tetap dekat indeks.
* **Kenapa di Bot:** Luna membandingkan funding terbaru dengan histori melalui percentile dan z-score untuk mendeteksi posisi pasar yang terlalu padat.

### Open Interest (OI)
* **Arti:** Total kontrak futures yang masih terbuka.
* **Kenapa di Bot:** Perubahan OI dibaca bersama perubahan harga. Harga naik + OI naik berbeda makna dari harga naik + OI turun.

### Liquidity Prefilter
* **Arti:** Memilih kontrak dengan quote volume terbesar sebelum menjalankan indikator yang lebih mahal.
* **Kenapa di Bot:** `/rec futures` hanya mengambil chart dan histori OI untuk maksimal 12 pair USD-M paling likuid, bukan melakukan puluhan request untuk seluruh kontrak.

### Crowding
* **Arti:** Kondisi ketika terlalu banyak pelaku condong ke arah yang sama.
* **Kenapa di Bot:** Sinyal long/short yang searah crowding funding ekstrem diturunkan menjadi `HOLD`, karena risiko unwind atau squeeze meningkat.

### LONG, SHORT, dan NEUTRAL
* **LONG:** Bias mendapat keuntungan bila harga naik.
* **SHORT:** Bias mendapat keuntungan bila harga turun.
* **NEUTRAL:** Tidak ada keunggulan arah yang cukup kuat.
* **Kenapa di Bot:** Ketiganya adalah enum kanonikal untuk mencegah inkonsistensi istilah. Verdict histori tetap `BUY`, `SELL`, atau `HOLD`.

### Liquidation Price
* **Arti:** Perkiraan level saat margin posisi tidak lagi cukup menurut aturan bursa.
* **Kenapa Tidak Dihitung Luna:** Nilainya memerlukan maintenance-margin tier, fee, wallet balance, posisi silang/isolated, dan aturan bursa aktual. Tanpa semua input itu, angka liquidation akan menyesatkan.
