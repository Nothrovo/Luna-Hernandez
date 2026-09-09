import { writeFileSync, copyFileSync } from 'node:fs';

// ═══════════════════════════════════════════════════════════════
// KODE HELPER MATEMATIKA TEKNIKAL
// ═══════════════════════════════════════════════════════════════
const TECH_SHARED = String.raw`
const clamp = (x, lo = -1, hi = 1) => Math.max(lo, Math.min(hi, x));
const mean = v => v.reduce((s, x) => s + x, 0) / v.length;
const std = v => { const m = mean(v); return Math.sqrt(v.reduce((s, x) => s + (x - m) ** 2, 0) / v.length); };
function ema(vals, period) {
  const out = Array(vals.length).fill(null);
  if (vals.length < period) return out;
  let cur = mean(vals.slice(0, period)); out[period - 1] = cur;
  const k = 2 / (period + 1);
  for (let i = period; i < vals.length; i++) { cur = vals[i] * k + cur * (1 - k); out[i] = cur; }
  return out;
}
function rsiWilder(vals, period = 14) {
  if (vals.length <= period) return 50;
  let g = 0, l = 0;
  for (let i = 1; i <= period; i++) { const d = vals[i] - vals[i - 1]; g += Math.max(d, 0); l += Math.max(-d, 0); }
  let ag = g / period, al = l / period;
  for (let i = period + 1; i < vals.length; i++) {
    const d = vals[i] - vals[i - 1];
    ag = (ag * (period - 1) + Math.max(d, 0)) / period;
    al = (al * (period - 1) + Math.max(-d, 0)) / period;
  }
  return al === 0 ? 100 : 100 - 100 / (1 + ag / al);
}
function macdCalc(vals) {
  const n = vals.length;
  const slow = Math.min(26, Math.floor(n * 0.4)), fast = Math.min(12, Math.floor(slow * 0.46)), sig = Math.min(9, Math.floor(fast * 0.75));
  const fe = ema(vals, fast), se = ema(vals, slow);
  const line = vals.map((_, i) => fe[i] != null && se[i] != null ? fe[i] - se[i] : null).filter(v => v != null);
  if (line.length < sig) return { line: 0, signal: 0, histogram: 0 };
  const sl = ema(line, sig);
  return { line: line.at(-1), signal: sl.at(-1), histogram: line.at(-1) - sl.at(-1) };
}
function bollingerCalc(vals) {
  const p = Math.min(20, vals.length);
  const w = vals.slice(-p), mid = mean(w), dev = std(w);
  return { middle: mid, upper: mid + 2 * dev, lower: mid - 2 * dev };
}
function annualVol(vals) {
  const r = []; for (let i = 1; i < vals.length; i++) r.push(Math.log(vals[i] / vals[i - 1]));
  return std(r) * Math.sqrt(365);
}
function sma(vals, period) {
  if (!vals || vals.length < period) return null;
  return vals.slice(-period).reduce((s, x) => s + x, 0) / period;
}
function atr(highs, lows, closes, period = 14) {
  if (!highs || highs.length < 2) return (closes.at(-1) || 0) * 0.03;
  const trs = [];
  for (let i = 1; i < highs.length; i++) {
    trs.push(Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i-1]), Math.abs(lows[i] - closes[i-1])));
  }
  const p = Math.min(period, trs.length);
  return trs.slice(-p).reduce((s, x) => s + x, 0) / p;
}
function adx(highs, lows, closes, period = 14) {
  if (!highs || highs.length < period + 2) return 0;
  const plusDM = [], minusDM = [], trs = [];
  for (let i = 1; i < highs.length; i++) {
    const up = highs[i] - highs[i-1], dn = lows[i-1] - lows[i];
    plusDM.push(up > dn && up > 0 ? up : 0);
    minusDM.push(dn > up && dn > 0 ? dn : 0);
    trs.push(Math.max(highs[i]-lows[i], Math.abs(highs[i]-closes[i-1]), Math.abs(lows[i]-closes[i-1])));
  }
  let sTR = trs.slice(0, period).reduce((s,x)=>s+x,0);
  let sPDM = plusDM.slice(0, period).reduce((s,x)=>s+x,0);
  let sMDM = minusDM.slice(0, period).reduce((s,x)=>s+x,0);
  const dx = [];
  for (let i = period; i < trs.length; i++) {
    sTR = sTR - sTR/period + trs[i];
    sPDM = sPDM - sPDM/period + plusDM[i];
    sMDM = sMDM - sMDM/period + minusDM[i];
    const pDI = sTR > 0 ? 100*sPDM/sTR : 0, mDI = sTR > 0 ? 100*sMDM/sTR : 0;
    const dSum = pDI + mDI;
    dx.push(dSum > 0 ? 100*Math.abs(pDI-mDI)/dSum : 0);
  }
  if (!dx.length) return 0;
  let adxV = dx.slice(0, Math.min(period, dx.length)).reduce((s,x)=>s+x,0) / Math.min(period, dx.length);
  for (let i = period; i < dx.length; i++) adxV = (adxV*(period-1)+dx[i])/period;
  return adxV;
}
`;

const TECH_CALC = String.raw`
// Parse daily OHLC
const daily = new Map();
for (const row of (rawPrices || [])) {
  if (!Array.isArray(row) || row.length < 2) continue;
  const ts = Number(row[0]), price = Number(row[1]);
  if (!Number.isFinite(ts) || !Number.isFinite(price) || price <= 0) continue;
  const d = new Date(ts).toISOString().slice(0, 10);
  if (!daily.has(d)) {
    daily.set(d, { ts, open: price, high: price, low: price, price });
  } else {
    const item = daily.get(d);
    item.high = Math.max(item.high, price);
    item.low = Math.min(item.low, price);
    item.price = price;
  }
}
const series = [...daily.values()].sort((a, b) => a.ts - b.ts);
const prices = series.map(p => p.price);
const highs = series.map(p => p.high);
const lows = series.map(p => p.low);
if (prices.length < 14) throw new Error(assetSymbol + ': data tidak cukup (min 14 titik harian)');

const rsiPeriod = Math.min(14, prices.length - 1);
const currentPrice = prices.at(-1);
const rsi = rsiWilder(prices, rsiPeriod);
const macdVal = macdCalc(prices);
const bands = bollingerCalc(prices);
const bw = Math.max(bands.upper - bands.lower, 1e-6);
const percentB = clamp((currentPrice - bands.lower) / bw, 0, 1);
const vol = annualVol(prices);

const sma20val = sma(prices, Math.min(20, prices.length));
const adxVal = adx(highs, lows, prices, Math.min(14, prices.length - 2));
const atrVal = atr(highs, lows, prices, Math.min(14, prices.length - 1));

const trendUp = sma20val !== null && currentPrice > sma20val && macdVal.histogram > 0;
const trendDown = sma20val !== null && currentPrice < sma20val && macdVal.histogram < 0;
const trendDir = trendUp ? 1 : trendDown ? -1 : 0;

let rsiScore = (50 - rsi) / 50;
if (trendUp && rsi >= 40 && rsi <= 55) {
  rsiScore = 0.50;
} else if (trendDown && rsi >= 45 && rsi <= 60) {
  rsiScore = -0.50;
}

const macdNorm = (macdVal.histogram / currentPrice) * 100;
const macdScore = clamp(macdNorm / 2, -1, 1);

let bbScore = 1 - 2 * percentB;
if (trendUp && percentB >= 0.15 && percentB <= 0.40) {
  bbScore = 0.60;
}

const volScore = -clamp((vol - 0.55) / 0.55, -1, 1);

const adxMult = adxVal > 25 ? 1.0 : adxVal > 15 ? 0.6 : 0.2;
const trendScore = trendDir * adxMult;

const weights = $('Config').first().json.technicalWeights;
const scores = { rsi: rsiScore, macd: macdScore, bollinger: bbScore, volatility: volScore, trend: trendScore };
const contribs = Object.fromEntries(Object.keys(weights).map(k => [k, weights[k] * scores[k]]));
const technicalScore = Object.values(contribs).reduce((s, x) => s + x, 0);

const topInd = Object.keys(contribs).reduce((a, b) => Math.abs(contribs[a]) > Math.abs(contribs[b]) ? a : b);
const reasons = {
  rsi: rsi < 30 ? 'RSI oversold (' + rsi.toFixed(0) + ')' : rsi > 70 ? 'RSI overbought (' + rsi.toFixed(0) + ')' : (trendUp && rsi <= 55 ? 'RSI pullback sehat di uptrend (' + rsi.toFixed(0) + ')' : 'RSI netral (' + rsi.toFixed(0) + ')'),
  macd: macdVal.histogram > 0 ? 'momentum MACD bullish' : 'momentum MACD bearish',
  bollinger: percentB < 0.2 ? 'harga dekat lower Bollinger Band' : percentB > 0.8 ? 'harga dekat upper Bollinger Band' : 'harga di area tengah Bollinger',
  volatility: vol > 0.8 ? 'volatilitas sangat tinggi' : vol > 0.55 ? 'volatilitas tinggi' : 'volatilitas moderat',
  trend: trendUp ? 'uptrend terkonfirmasi SMA20 (ADX ' + adxVal.toFixed(0) + ')' : trendDown ? 'downtrend SMA20 terkonfirmasi' : 'tren tidak jelas/sideways',
};
const topReasons = Object.keys(contribs).sort((a, b) => Math.abs(contribs[b]) - Math.abs(contribs[a])).slice(0, 2).map(k => reasons[k]);

// Swing low 14 hari terakhir → level invalidasi tren
const swingLow14 = Math.min(...lows.slice(-14));

const techResult = {
  currentPrice, dataPoints: prices.length,
  priceTimestamp: new Date(series.at(-1).ts).toISOString(),
  technicalScore: Number(technicalScore.toFixed(6)),
  topIndicator: topInd, topReasons,
  indicators: { rsi14: Number(rsi.toFixed(2)), macdHistogram: Number(macdVal.histogram.toFixed(6)), bollingerPercentB: Number(percentB.toFixed(4)), historicalVolatilityAnnualized: Number(vol.toFixed(4)) },
  indicatorScores: scores, indicatorContributions: contribs,
  trendDir, adxVal: Number(adxVal.toFixed(1)),
  sma20: sma20val ? Number(sma20val.toFixed(2)) : null,
  atrVal: Number(atrVal.toFixed(2)),
  swingLow14: Number(swingLow14.toFixed(2)),
  bands: { upper: Number(bands.upper.toFixed(2)), lower: Number(bands.lower.toFixed(2)), middle: Number(bands.middle.toFixed(2)) },
};
`;

// ═══════════════════════════════════════════════════════════════
// CODE NODE DI WORKFLOW
// ═══════════════════════════════════════════════════════════════
const code = {
  config: String.raw`return [{
  json: {
    timezone: 'Asia/Jakarta',
    telegramChatId: '1536791393',
    botToken: '8739615976:AAHKY58pJU_-zniOHvRz93-7H-9neg3TL-Y',
    ollamaBaseUrl: 'http://host.docker.internal:11434',
    ollamaModel: 'qwen3.5:2b',
    sqlitePath: '/home/node/.n8n/crypto_decision_support.sqlite',
    geminiApiKey: 'AQ.Ab8RN6Jvs4yGhGg8RsBHTIvEhaF88qWdX7pXWoH5b--AspiBsw',
    geminiModel: 'gemini-3.5-flash-lite',
    quoteCurrency: 'idr',
    marketDays: 60,
    technicalWeights: { rsi: 0.25, macd: 0.30, bollinger: 0.25, volatility: 0.10, trend: 0.10 },
    decisionWeights: { sentiment: 0.40, technical: 0.60 },
    thresholds: { buy: 0.20, sell: -0.20 },
  },
}];`,

  parseWebhook: String.raw`const cfg = $('Config').first().json;
const raw = $('Telegram Webhook').first().json;

// Ekstrak pesan Telegram dari berbagai struktur webhook n8n
const body = raw.body || raw;
const msg = body.message || body.channel_post || body.edited_message || raw;

if (!msg || !msg.text) {
  return [{ json: { hasCommand: false, command: '__none__' } }];
}

// Cek chat ID pengirim (hanya izinkan chat terdaftar)
const senderChatId = msg.chat ? msg.chat.id : (raw.chat ? raw.chat.id : null);
if (String(senderChatId) !== String(cfg.telegramChatId)) {
  return [{ json: { hasCommand: false, command: '__none__' } }];
}

const text = msg.text.trim();
let command = '__none__', args = '';

if (text.startsWith('/')) {
  const parts = text.slice(1).split(/\s+/);
  command = parts[0].toLowerCase().split('@')[0];
  args = parts.slice(1).join(' ').trim();
} else {
  // Jika user mengetik pesan biasa tanpa tanda '/', otomatis anggap sebagai /ask
  command = 'ask';
  args = text;
}

// Alias command
if (command === 'signal' || command === 'signals' || command === 'porto') command = 'portfolio';
if (command === 'recommendation' || command === 'rekomendasi') command = 'rec';
if (command === 'status') command = 'stat';

let coinArg = '', modalArg = 100000;
if (args) {
  const parts = args.split(/\s+/);
  coinArg = parts[0] ? parts[0].trim().toUpperCase() : '';
  if (parts[1]) {
    let m = parts[1].toLowerCase().replace(/[,._]/g, '');
    if (m.endsWith('k')) m = parseFloat(m) * 1000;
    else if (m.endsWith('jt') || m.endsWith('m') || m.endsWith('juta')) m = parseFloat(m) * 1000000;
    else m = parseFloat(m);
    if (Number.isFinite(m) && m > 0) modalArg = m;
  }
}

return [{ json: {
  command,
  args,
  coinArg,
  modalArg,
  from: (msg.from && msg.from.first_name) || 'Trader',
  chatId: senderChatId,
  hasCommand: command !== '__none__',
  rawText: text,
  botToken: cfg.botToken,
} }];`,

  // ── ONBOARDING GUIDE (/start) ──
  buildStart: String.raw`const update = $('Parse Incoming Message').first().json;
const cfg = $('Config').first().json;
const userName = update.from || 'Trader';

const msg = [
  '👋 <b>Halo ' + userName + '! Gue Luna Hernandez.</b>',
  'Asisten decision support & riset crypto personal lo.',
  '',
  'Gue di sini buat bantu lo menganalisis pasar sebelum eksekusi, baik koin besar (BTC/ETH) maupun koin gorengan/altcoin cepat.',
  '',
  '🚀 <b>Fitur Utama Luna Hernandez Bot:</b>',
  '',
  '1️⃣ <b>Deep Analysis Koin</b> <code>/coin &lt;simbol&gt;</code>',
  'Hitung teknikal komprehensif (RSI, MACD, BB, ADX, SMA20), <b>browsing 10 berita Google News live</b>, histori SQLite, & dirangkum AI Gemini.',
  '👉 <i>Coba:</i> <code>/coin sol</code>, <code>/coin aero</code>, <code>/coin btc</code>',
  '',
  '2️⃣ <b>Riset Bebas Live + Memori</b> <code>/ask &lt;pertanyaan&gt;</code>',
  'Tanya kondisi pasar atau sentimen. Bot <b>browsing Google News live</b> + <b>ingat percakapan sebelumnya</b>.',
  '👉 <i>Coba:</i> <code>/ask bagaimana peluang swing trading minggu ini?</code>',
  '',
  '3️⃣ <b>Radar Pasar & Rekomendasi</b>',
  '• <code>/rec</code> — 3 rekomendasi koin pullback sehat untuk swing entry',
  '• <code>/market</code> — Top 5 gainers & losers 24 jam dalam IDR',
  '',
  '4️⃣ <b>Manajemen Posisi & Portofolio</b>',
  '• <code>/buy &lt;simbol&gt; [modal]</code> — Catat beli & pantau ketat (e.g. <code>/buy sol 150k</code>)',
  '• <code>/stat &lt;simbol&gt;</code> — Evaluasi posisi: PnL, rekomendasi Hold/TP/SL/DCA',
  '• <code>/sell &lt;simbol&gt;</code> — Tutup posisi, hitung PnL, & unlist dari pantauan',
  '• <code>/portfolio</code> — Ringkasan koin aktif, total modal, & PnL portofolio',
  '• <code>/history &lt;simbol&gt;</code> — Cek riwayat analisis tersimpan',
  '',
  '🔔 <i>Auto-Alert: Bot otomatis cek setiap 2 jam dan kirim notifikasi saat TP/SL tersentuh!</i>',
  '⚠️ <i>Decision support only, bukan saran finansial.</i>',
  '',
  'Ketik <code>/help</code> kapan saja untuk melihat ringkasan perintah.',
].join('\n');

return [{ json: { telegramMessage: msg, chatId: cfg.telegramChatId, botToken: cfg.botToken } }];`,

  // ── HELP MENU (/help) ──
  buildHelp: String.raw`const msg = [
  '📖 <b>Daftar Perintah Luna Hernandez Bot</b>',
  '',
  '🎯 <b>Riset & Rekomendasi:</b>',
  '• <code>/rec</code> — Rekomendasi 3 koin pullback sehat untuk swing entry',
  '• <code>/coin &lt;simbol&gt;</code> — Deep analysis: RSI, MACD, Tren, Berita Live, & AI',
  '• <code>/ask &lt;pertanyaan&gt;</code> — Riset bebas Google News Live + Memori obrolan',
  '• <code>/market</code> — Top 5 gainers & losers 24 jam (IDR)',
  '',
  '💼 <b>Portofolio & Posisi Aktif:</b>',
  '• <code>/buy &lt;simbol&gt; [modal]</code> — Catat beli & pantau ketat (e.g. <code>/buy sol 150k</code>)',
  '• <code>/stat &lt;simbol&gt;</code> — Evaluasi posisi: PnL, rekomendasi Hold/TP/SL/DCA',
  '• <code>/sell &lt;simbol&gt;</code> — Tutup posisi, hitung PnL, keluarkan dari pantauan',
  '• <code>/portfolio</code> — Ringkasan koin aktif, total modal, & PnL portofolio',
  '• <code>/history [simbol]</code> — Riwayat analisis tersimpan di database lokal',
  '• <code>/start</code> — Panduan interaktif & tutorial lengkap',
  '',
  '🔔 <i>Auto-Alert: Bot otomatis cek berkala dan kirim alert jika menyentuh TP/SL!</i>',
  '⚠️ <i>Decision support only. Bukan saran finansial.</i>',
].join('\n');
const cfg = $('Config').first().json;
return [{ json: { telegramMessage: msg, chatId: cfg.telegramChatId, botToken: cfg.botToken } }];`,

  // ── /coin ──
  extractCoinId: String.raw`const data = $input.first().json;
const update = $('Parse Incoming Message').first().json;
const cfg = $('Config').first().json;
const query = update.args.toLowerCase().trim();
const coins = data.coins || [];
let coin = coins.find(c => c.symbol?.toLowerCase() === query);
if (!coin) coin = coins.find(c => c.name?.toLowerCase() === query);
if (!coin && coins.length > 0) coin = coins[0];
if (!coin) {
  return [{ json: {
    __error: true,
    telegramMessage: '❌ Koin <b>' + query.toUpperCase() + '</b> tidak ditemukan.\nCoba: /coin sol, /coin aero, /coin btc',
    chatId: cfg.telegramChatId, botToken: cfg.botToken,
  }}];
}
return [{ json: {
  coinId: coin.id, coinSymbol: coin.symbol.toUpperCase(), coinName: coin.name,
  command: update.command, args: update.args, chatId: cfg.telegramChatId, botToken: cfg.botToken,
}}];`,

  coinTechnical: TECH_SHARED + String.raw`
const rawPrices = $('CoinGecko Market Chart').first().json.prices || [];
const assetSymbol = $('Extract Coin ID').first().json.coinSymbol;
` + TECH_CALC + String.raw`
const btcGate = $('BTC Gate').first().json;
const coinCtx = $('Extract Coin ID').first().json;
return [{ json: { ...coinCtx, ...techResult, asset: coinCtx.coinSymbol, btcGate } }];`,

  parseNews: String.raw`const xml = ($input.first().json.data || '').toString();
const itemBlocks = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];
const articles = itemBlocks.slice(0, 10).map(m => {
  const c = m[1];
  const title = (c.match(/<title><!\[CDATA\[([\s\S]*?)\]\]>/) || c.match(/<title>([\s\S]*?)<\/title>/))?.[1] || '';
  const pubDate = c.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || '';
  return {
    title: title.replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').trim(),
    pubDate: pubDate.slice(0, 16),
  };
}).filter(a => a.title.length > 5);
const coinCtx = $('Extract Coin ID').first().json;
return [{ json: { ...coinCtx, newsArticles: articles, newsCount: articles.length } }];`,

  // ── BTC Gate Signal (Makro filter untuk altcoin) ──
  btcGate: TECH_SHARED + String.raw`
const rawPrices = $input.first().json.prices || [];
const assetSymbol = 'BTC';
const dailyBtc = new Map();
for (const row of rawPrices) {
  if (!Array.isArray(row) || row.length < 2) continue;
  const ts = Number(row[0]), price = Number(row[1]);
  if (!Number.isFinite(ts) || !Number.isFinite(price) || price <= 0) continue;
  const d = new Date(ts).toISOString().slice(0, 10);
  if (!dailyBtc.has(d)) {
    dailyBtc.set(d, { ts, open: price, high: price, low: price, price });
  } else {
    const item = dailyBtc.get(d);
    item.high = Math.max(item.high, price);
    item.low = Math.min(item.low, price);
    item.price = price;
  }
}
const seriesBtc = [...dailyBtc.values()].sort((a, b) => a.ts - b.ts);
const pricesBtc = seriesBtc.map(p => p.price);
if (pricesBtc.length < 14) return [{ json: { btcGate: 'neutral', btcPrice: 0, btcRsi: 50, btcMacdH: 0, btcVsSma: 0 } }];
const btcClose = pricesBtc.at(-1);
const btcMacd = macdCalc(pricesBtc);
const btcRsi = rsiWilder(pricesBtc, Math.min(14, pricesBtc.length - 1));
const btcSma20 = sma(pricesBtc, Math.min(20, pricesBtc.length));
const isBull = btcSma20 !== null && btcClose > btcSma20 && btcMacd.histogram > 0;
const isBear = btcSma20 !== null && btcClose < btcSma20 && btcMacd.histogram < 0;
const gate = isBull ? 'bullish' : isBear ? 'bearish' : 'neutral';
const vsSma = btcSma20 ? Number(((btcClose - btcSma20) / btcSma20 * 100).toFixed(1)) : 0;
return [{ json: { btcGate: gate, btcPrice: btcClose, btcRsi: Number(btcRsi.toFixed(1)), btcMacdH: btcMacd.histogram, btcVsSma: vsSma } }];`,

  readPrevAnalysis: String.raw`const sym = $('Extract Coin ID').first().json.coinSymbol.replace(/'/g,"''");
const p = $('Config').first().json.sqlitePath;
const sql = "SELECT tanggal, waktu, keputusan, harga, skor_teknikal, ringkasan FROM coin_sessions WHERE simbol='" + sym + "' AND tipe='coin' ORDER BY tanggal DESC, id DESC LIMIT 5;";
const dbCmd = "sqlite3 -separator '|' '" + p.replace(/'/g,"'\"'\"'") + "' \"" + sql + "\"";
return [{ json: { dbCmd } }];`,

  parsePrevAnalysis: String.raw`const raw = ($input.first().json.stdout || '').trim();
const lines = raw.split('\n').filter(Boolean);
const sessions = lines.map(line => {
  const [tanggal, waktu, keputusan, harga, skor, ringkasan] = line.split('|');
  return { tanggal, waktu, keputusan, harga: parseFloat(harga) || 0, skor: parseFloat(skor) || 0, ringkasan: ringkasan || '' };
}).filter(s => s.tanggal);
const coinCtx = $('Extract Coin ID').first().json;
return [{ json: { ...coinCtx, previousSessions: sessions } }];`,

  prepareGeminiCoinPrompt: String.raw`const tech = $('Coin Technical').first().json;
const newsCtx = $('Parse News').first().json;
const prevCtx = $('Parse Previous Analysis').first().json;
const cfg = $('Config').first().json;
const btcG = tech.btcGate || { btcGate: 'neutral', btcRsi: 50, btcVsSma: 0 };

const ts = tech.technicalScore;
const decision = ts > cfg.thresholds.buy ? 'BUY' : ts < cfg.thresholds.sell ? 'SELL' : 'HOLD';
const price = new Intl.NumberFormat('id-ID').format(tech.currentPrice);
const trendLabel = tech.trendDir > 0 ? 'UPTREND (SMA20 + MACD bullish)' : tech.trendDir < 0 ? 'DOWNTREND (SMA20 + MACD bearish)' : 'SIDEWAYS/TIDAK JELAS';
const adxLabel = (tech.adxVal || 0) > 25 ? 'KUAT (' + tech.adxVal + ')' : (tech.adxVal || 0) > 15 ? 'MODERAT (' + tech.adxVal + ')' : 'LEMAH/SIDEWAYS (' + (tech.adxVal || 0) + ')';
const btcLabel = btcG.btcGate === 'bullish' ? '✅ BULLISH (mendukung altcoin)' : btcG.btcGate === 'bearish' ? '⚠️ BEARISH (menekan altcoin)' : '⬜ NETRAL';

const newsText = (newsCtx.newsArticles || []).length > 0
  ? newsCtx.newsArticles.map((a, i) => (i + 1) + '. ' + a.title + (a.pubDate ? ' (' + a.pubDate + ')' : '')).join('\n')
  : 'Tidak ada berita yang ditemukan.';

const prevText = (prevCtx.previousSessions || []).length > 0
  ? prevCtx.previousSessions.slice(0, 3).map(s => {
      const priceChg = tech.currentPrice > 0 && s.harga > 0
        ? ' | Harga berubah: ' + ((tech.currentPrice - s.harga) / s.harga * 100).toFixed(1) + '%'
        : '';
      return '- ' + s.tanggal + (s.waktu ? ' ' + s.waktu : '') + ': ' + (s.keputusan || '-') + ' (skor ' + s.skor.toFixed(2) + ')' + priceChg + (s.ringkasan ? ' — ' + s.ringkasan.slice(0, 80) : '');
    }).join('\n')
  : 'Belum ada riwayat analisis untuk koin ini.';

const prompt = [
  'Kamu adalah analis crypto profesional untuk swing trader Indonesia (target profit mingguan-bulanan).',
  '',
  '═══ DATA KOIN ═══',
  'Koin: ' + tech.coinName + ' (' + tech.coinSymbol + ')',
  'Harga sekarang: Rp ' + price + ' | Data: ' + tech.dataPoints + ' hari',
  '',
  '═══ TEKNIKAL (HYBRID TREND-PULLBACK) ═══',
  'Skor gabungan: ' + ts.toFixed(3) + ' → sinyal algoritma: ' + decision,
  'Tren (SMA20+MACD): ' + trendLabel,
  'Kekuatan tren (ADX): ' + adxLabel,
  'RSI(14): ' + tech.indicators.rsi14 + (tech.indicators.rsi14 < 30 ? ' ⚠️ OVERSOLD' : tech.indicators.rsi14 > 70 ? ' ⚠️ OVERBOUGHT' : ' (netral)'),
  'Bollinger %B: ' + tech.indicators.bollingerPercentB.toFixed(2) + (tech.indicators.bollingerPercentB < 0.3 ? ' (dekat lower band — potensi pullback entry)' : tech.indicators.bollingerPercentB > 0.85 ? ' (dekat upper band — harga kejauhan)' : ' (area tengah/aman)'),
  'Volatilitas: ' + (tech.indicators.historicalVolatilityAnnualized * 100).toFixed(1) + '%/tahun',
  'Swing Low 14h: Rp ' + new Intl.NumberFormat("id-ID").format(tech.swingLow14 || 0) + ' (level invalidasi tren)',
  'Driver: ' + (tech.topReasons || []).join(', '),
  '',
  '═══ KONTEKS MAKRO BTC ═══',
  'BTC Gate: ' + btcLabel,
  'BTC RSI: ' + btcG.btcRsi + ' | BTC vs SMA20: ' + (btcG.btcVsSma > 0 ? '+' : '') + btcG.btcVsSma + '%',
  '',
  '═══ BERITA LIVE TERBARU (GOOGLE NEWS) ═══',
  newsText,
  '',
  '═══ HISTORI ANALISIS BOT SEBELUMNYA ═══',
  prevText,
  '',
  '═══ INSTRUKSI ANALISIS ═══',
  'Tulis analisis singkat, padat, actionable (maksimal 700 karakter):',
  '1. KESIMPULAN: BUY / HOLD / SELL — jelaskan alasan utamanya (tren + pullback + sentimen berita).',
  '2. RISIKO: Jika BTC Gate bearish, ingatkan risiko koreksi altcoin meski setup bagus.',
  '3. STRATEGI SWING: Sebutkan target profit realistis (+10% s/d +15%) dan batas stop loss / invalidasi tren.',
  '4. Bahasa Indonesia santai profesional, langsung ke poin, TANPA disclaimer panjang di akhir.',
].join('\n');

const geminiBody = {
  contents: [{ parts: [{ text: prompt }] }],
  generationConfig: { maxOutputTokens: 2000, temperature: 0.3, thinkingConfig: { thinkingBudget: 512 } },
};

return [{ json: { geminiBody, coinSymbol: tech.coinSymbol, chatId: cfg.telegramChatId, botToken: cfg.botToken } }];`,

  buildCoinReport: String.raw`const resp = $input.first().json;
const tech = $('Coin Technical').first().json;
const newsCtx = $('Parse News').first().json;
const prevCtx = $('Parse Previous Analysis').first().json;
const ctx = $('Prepare Gemini Coin Prompt').first().json;
const cfg = $('Config').first().json;
const btcGate = tech.btcGate || { btcGate: 'neutral', btcRsi: 50, btcVsSma: 0 };

let aiAnalysis = '';
if (resp.error) {
  const m = resp.error.message || '';
  aiAnalysis = m.includes('quota') ? '⏳ Gemini rate-limited. Coba lagi dalam 1 menit.' : '⚠️ Gemini error: ' + m.slice(0, 100);
} else {
  const parts = resp.candidates?.[0]?.content?.parts || [];
  aiAnalysis = parts.map(p => p.text || '').join('').trim();
  if (!aiAnalysis) aiAnalysis = '⚠️ Tidak ada respons dari Gemini.';
  // Hilangkan tanda bintang markdown
  aiAnalysis = aiAnalysis
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\*/g, '');
}

const ts = tech.technicalScore;
let decisionText = ts > cfg.thresholds.buy ? 'BUY' : ts < cfg.thresholds.sell ? 'SELL' : 'HOLD';
let decisionIcon = ts > cfg.thresholds.buy ? '🟢' : ts < cfg.thresholds.sell ? '🔴' : '🟡';

let btcWarning = '';
if (decisionText === 'BUY' && btcGate.btcGate === 'bearish') {
  decisionText = 'HOLD (BTC BEARISH)';
  decisionIcon = '⚠️';
  btcWarning = '\n⚠️ <i>Signal BUY diturunkan ke HOLD karena makro BTC sedang bearish (harga di bawah SMA-20 & MACD negatif). Tunggu BTC stabil sebelum entry altcoin!</i>';
}

const conf = Math.round(Math.abs(ts) * 100);
const price = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(tech.currentPrice);

let prevLine = '';
if ((prevCtx.previousSessions || []).length > 0) {
  const last = prevCtx.previousSessions[0];
  const lastPriceFmt = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(last.harga);
  const diffPct = last.harga > 0 ? ((tech.currentPrice - last.harga) / last.harga * 100).toFixed(1) : '0';
  prevLine = '\n📋 Analisis lalu (' + last.tanggal + '): ' + (last.keputusan || '-') + ' di ' + lastPriceFmt + ' (' + (diffPct >= 0 ? '+' : '') + diffPct + '%)';
}

const newsLine = (newsCtx.newsCount || 0) > 0
  ? '📰 Berita Live: ' + newsCtx.newsCount + ' artikel dianalisis'
  : '📰 Berita: tidak ada berita baru';

const trendIcon = tech.trendDir > 0 ? '📈' : tech.trendDir < 0 ? '📉' : '↔️';
const adxTag = (tech.adxVal || 0) > 25 ? 'ADX ' + tech.adxVal + ' (Kuat)' : 'ADX ' + (tech.adxVal || 0) + ' (Moderat)';
const btcIcon = btcGate.btcGate === 'bullish' ? '🟢' : btcGate.btcGate === 'bearish' ? '🔴' : '⚪';

const tpTarget = tech.currentPrice ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(tech.currentPrice * 1.12) : '-';
const slTarget = tech.swingLow14 ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(tech.swingLow14) : '-';
const exitGuide = '\n🎯 <b>Panduan Exit:</b> Target TP (+12%): ~' + tpTarget + ' | Level Invalidasi/SL: ' + slTarget;

const msg = [
  decisionIcon + ' <b>' + tech.coinName + ' (' + tech.coinSymbol + ') — ' + decisionText + '</b>',
  'Teknikal: ' + conf + '% | Data: ' + tech.dataPoints + ' hari' + prevLine,
  '',
  '💰 Harga: ' + price,
  '📈 RSI: ' + tech.indicators.rsi14 + (tech.indicators.rsi14 < 30 ? ' ⬇️' : tech.indicators.rsi14 > 70 ? ' ⬆️' : ' →'),
  '📊 MACD: ' + (tech.indicators.macdHistogram > 0 ? '▲ bullish' : '▼ bearish') +
    ' | %B: ' + tech.indicators.bollingerPercentB.toFixed(2) +
    ' | Vol: ' + (tech.indicators.historicalVolatilityAnnualized * 100).toFixed(1) + '%',
  trendIcon + ' Tren: ' + (tech.trendDir > 0 ? 'Uptrend' : tech.trendDir < 0 ? 'Downtrend' : 'Sideways') +
    ' (' + adxTag + ') | ' + btcIcon + ' BTC: ' + btcGate.btcGate,
  btcWarning,
  newsLine,
  '',
  '🤖 <b>Analisis AI (Berdasarkan Berita Live):</b>',
  aiAnalysis,
  exitGuide,
  '',
  '💡 <i>Ketik <code>/buy ' + tech.coinSymbol.toLowerCase() + ' 150k</code> untuk mencatat beli & memantau koin ini.</i>\n' +
  '⚠️ <i>Decision support only.</i>',
].join('\n');

const shortSummary = (aiAnalysis.slice(0, 150)).replace(/'/g, "''");
const safeMsg = msg.slice(0, 400).replace(/'/g, "''");

return [{ json: {
  telegramMessage: msg, chatId: ctx.chatId, botToken: ctx.botToken,
  sqlSymbol: tech.coinSymbol, sqlName: tech.coinName, sqlHarga: tech.currentPrice,
  sqlKeputusan: decisionText, sqlSkor: tech.technicalScore,
  sqlRingkasan: shortSummary, sqlKonten: safeMsg,
} }];`,

  saveCoinAnalysis: String.raw`const d = $('Build Coin Report').first().json;
const p = $('Config').first().json.sqlitePath;
const now = new Date();
const tanggal = now.toISOString().slice(0, 10);
const waktu = now.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' });
const sql = "INSERT INTO coin_sessions (tanggal, waktu, simbol, tipe, harga, keputusan, skor_teknikal, ringkasan, konten) " +
  "VALUES ('" + tanggal + "','" + waktu + "','" + (d.sqlSymbol || '').replace(/'/g, "''") + "','coin'," +
  (d.sqlHarga || 0) + ",'" + (d.sqlKeputusan || '') + "'," + (d.sqlSkor || 0) + ",'" + (d.sqlRingkasan || '') + "','" + (d.sqlKonten || '') + "');";
const dbCmd = "sqlite3 '" + p.replace(/'/g, "'\"'\"'") + "' \"" + sql + "\"";
return [{ json: { ...d, dbCmd } }];`,

  // ── /ask (with Live Google News search + SQLite memory) ──
  parseAskNews: String.raw`const xml = ($input.first().json.data || '').toString();
const itemBlocks = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];
const articles = itemBlocks.slice(0, 6).map(m => {
  const c = m[1];
  const title = (c.match(/<title><!\[CDATA\[([\s\S]*?)\]\]>/) || c.match(/<title>([\s\S]*?)<\/title>/))?.[1] || '';
  const pubDate = c.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || '';
  return {
    title: title.replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').trim(),
    pubDate: pubDate.slice(0, 16),
  };
}).filter(a => a.title.length > 5);

const update = $('Parse Incoming Message').first().json;
return [{ json: { ...update, askNews: articles } }];`,

  readRecentSessions: String.raw`const p = $('Config').first().json.sqlitePath;
const sql = "SELECT tanggal, waktu, simbol, tipe, keputusan, skor_teknikal, ringkasan FROM coin_sessions ORDER BY tanggal DESC, id DESC LIMIT 15;";
const dbCmd = "sqlite3 -separator '|' '" + p.replace(/'/g, "'\"'\"'") + "' \"" + sql + "\"";
return [{ json: { dbCmd } }];`,

  buildAskWithContext: String.raw`const raw = ($input.first().json.stdout || '').trim();
const lines = raw.split('\n').filter(Boolean);
const sessions = lines.map(line => {
  const [tanggal, waktu, simbol, tipe, keputusan, skor, ringkasan] = line.split('|');
  return { tanggal, waktu, simbol, tipe, keputusan, skor: parseFloat(skor) || 0, ringkasan: ringkasan || '' };
}).filter(s => s.tanggal);

const askCtx = $('Parse Ask News').first().json;
const cfg = $('Config').first().json;
const question = askCtx.args || 'Bagaimana kondisi pasar crypto hari ini?';

const newsText = (askCtx.askNews || []).length > 0
  ? askCtx.askNews.map((a, i) => (i + 1) + '. ' + a.title + (a.pubDate ? ' (' + a.pubDate + ')' : '')).join('\n')
  : 'Tidak ada berita live spesifik yang ditemukan.';

const historyText = sessions.length > 0
  ? sessions.slice(0, 8).map(s =>
      '- ' + s.tanggal + (s.waktu ? ' ' + s.waktu : '') + ' [' + (s.simbol || '?') + '/' + (s.tipe || '?') + ']: ' +
      (s.keputusan ? s.keputusan + ' skor=' + s.skor.toFixed(2) : '') +
      (s.ringkasan ? ' — ' + s.ringkasan.slice(0, 100) : '')
    ).join('\n')
  : 'Belum ada riwayat analisis.';

const prompt = [
  'Kamu adalah asisten riset crypto personal untuk trader Indonesia.',
  'Kamu dibekali hasil pencarian Google News LIVE hari ini dan riwayat analisis percakapan sebelumnya.',
  '',
  '═══ HASIL BROWSING GOOGLE NEWS LIVE HARI INI ═══',
  newsText,
  '',
  '═══ RIWAYAT ANALISIS DI DATABASE SQLITE ═══',
  historyText,
  '',
  '═══ PERTANYAAN USER ═══',
  question,
  '',
  '═══ INSTRUKSI ═══',
  '1. Jawab dalam Bahasa Indonesia, maksimal 650 karakter, fokus actionable.',
  '2. Utamakan fakta dari BERITA LIVE hari ini untuk menjawab pertanyaan user.',
  '3. Jika pertanyaan berkaitan dengan koin di riwayat, sambungkan dengan konteks sebelumnya.',
  '4. Akhiri dengan kesimpulan / sentiment.',
].join('\n');

const geminiBody = {
  contents: [{ parts: [{ text: prompt }] }],
  generationConfig: { maxOutputTokens: 2000, temperature: 0.2, thinkingConfig: { thinkingBudget: 512 } },
};

return [{ json: {
  geminiBody, question, askNews: askCtx.askNews || [], sessions,
  chatId: cfg.telegramChatId, botToken: cfg.botToken
} }];`,

  formatAsk: String.raw`const resp = $input.first().json;
const ctx = $('Build Ask With Context').first().json;

let answer = '';
if (resp.error) {
  const m = resp.error.message || '';
  answer = m.includes('quota') ? '⏳ AI rate-limited. Coba lagi dalam 1 menit.' : '❌ Error: ' + m.slice(0, 120);
} else {
  const parts = resp.candidates?.[0]?.content?.parts || [];
  answer = parts.map(p => p.text || '').join('').trim().slice(0, 3000);
  if (!answer) answer = '⚠️ Tidak ada respons dari AI.';
  // Hilangkan tanda bintang markdown
  answer = answer
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\*/g, '');
}

const newsNote = (ctx.askNews || []).length > 0
  ? '\n\n📰 <i>Disintesis dari ' + ctx.askNews.length + ' berita Google News live terbaru.</i>'
  : '';

const msg = [
  '🤖 <b>Luna Hernandez AI Research</b>',
  '<i>❓ ' + ctx.question.slice(0, 400) + '</i>',
  '',
  answer,
  newsNote,
].join('\n');

return [{ json: {
  telegramMessage: msg, chatId: ctx.chatId, botToken: ctx.botToken,
  sqlQuestion: (ctx.question || '').slice(0, 200).replace(/'/g, "''"),
  sqlAnswer: answer.slice(0, 300).replace(/'/g, "''"),
} }];`,

  saveAskSession: String.raw`const d = $('Format Ask Answer').first().json;
const p = $('Config').first().json.sqlitePath;
const now = new Date();
const tanggal = now.toISOString().slice(0, 10);
const waktu = now.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' });
const sql = "INSERT INTO coin_sessions (tanggal, waktu, simbol, tipe, ringkasan, konten) VALUES ('" +
  tanggal + "','" + waktu + "','ASK','ask','" + (d.sqlQuestion || '') + "','" + (d.sqlAnswer || '') + "');";
const dbCmd = "sqlite3 '" + p.replace(/'/g, "'\"'\"'") + "' \"" + sql + "\"";
return [{ json: { ...d, dbCmd } }];`,

  // ── /portfolio (Dynamic Upgrade) ──
  prepareListPositions: String.raw`const cfg = $('Config').first().json;
const dbCmd = "node /home/node/.n8n/manage_positions.mjs list-active";
return [{ json: { dbCmd, chatId: cfg.telegramChatId, botToken: cfg.botToken } }];`,

  processPortfolioCheck: String.raw`const raw = ($input.first().json.stdout || '').trim();
const cfg = $('Config').first().json;

let res = null;
try {
  res = JSON.parse(raw);
} catch (e) {}

const positions = res?.positions || [];

if (!positions.length) {
  const msg = [
    '💼 <b>Portofolio Swing Luna Hernandez</b>',
    '',
    '<i>Belum ada posisi koin yang sedang dipantau aktif.</i>',
    '',
    '👉 <b>Cara mulai memantau koin:</b>',
    '• Ketik <code>/buy &lt;simbol&gt; [modal]</code>',
    '  <i>Contoh:</i> <code>/buy sol 150k</code> atau <code>/buy btc 200000</code>',
    '• Ketik <code>/rec</code> untuk melihat radar koin siap entry',
  ].join('\n');
  return [{ json: { hasPositions: false, telegramMessage: msg, chatId: cfg.telegramChatId, botToken: cfg.botToken } }];
}

const coinIds = [...new Set(positions.map(p => p.coin_id))].join(',');

return [{ json: {
  hasPositions: true,
  positions,
  coinIds,
  chatId: cfg.telegramChatId,
  botToken: cfg.botToken,
}}];`,

  formatDynamicPortfolio: String.raw`const priceData = $input.first().json;
const posCtx = $('Process Portfolio Check').first().json;
const cfg = $('Config').first().json;
const positions = posCtx.positions || [];

const fmt = v => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);

let totalModal = 0, totalNilai = 0;
const positionRows = [];

positions.forEach((pos, idx) => {
  const buyPrice = Number(pos.harga_beli);
  const modal = Number(pos.modal_idr);
  const currPrice = priceData[pos.coin_id]?.idr || buyPrice;
  const pnlPct = Number(((currPrice - buyPrice) / buyPrice * 100).toFixed(2));
  const pnlIdr = Math.round(modal * (pnlPct / 100));
  const currVal = modal + pnlIdr;

  totalModal += modal;
  totalNilai += currVal;

  const isProfit = pnlPct >= 0;
  const icon = isProfit ? '🟢' : '🔴';

  positionRows.push([
    (idx + 1) + '️⃣ <b>' + pos.simbol + ' (' + pos.nama + ')</b>',
    '• Beli: ' + fmt(buyPrice) + ' | Sekarang: ' + fmt(currPrice),
    '• Modal: ' + fmt(modal) + ' (Nilai: ' + fmt(currVal) + ')',
    '• PnL: ' + icon + ' ' + (isProfit ? '+' : '') + pnlPct + '% (' + (isProfit ? '+' : '') + fmt(pnlIdr) + ')',
    '• TP: ' + fmt(pos.target_profit) + ' | SL: ' + fmt(pos.stop_loss),
  ].join('\n'));
});

const totalPnlPct = totalModal > 0 ? Number(((totalNilai - totalModal) / totalModal * 100).toFixed(2)) : 0;
const totalPnlIdr = totalNilai - totalModal;
const isTotProfit = totalPnlIdr >= 0;
const totIcon = isTotProfit ? '🟢' : '🔴';

// BTC Macro info
const btcPrice = priceData.bitcoin?.idr;
const btcChg = priceData.bitcoin?.idr_24h_change;
const btcText = btcPrice
  ? '🌐 <b>BTC Makro:</b> ' + fmt(btcPrice) + ' (' + (btcChg >= 0 ? '▲ +' : '▼ ') + (btcChg ? btcChg.toFixed(2) : 0) + '% 24h)'
  : '';

const now = new Intl.DateTimeFormat('id-ID', { timeZone: cfg.timezone, dateStyle: 'medium', timeStyle: 'short' }).format(new Date());

const msg = [
  '💼 <b>Portofolio Swing Luna Hernandez</b>',
  '<i>' + now + ' WIB</i>',
  '',
  '🪙 <b>Posisi Aktif (' + positions.length + ' Koin):</b>',
  '',
  positionRows.join('\n\n'),
  '',
  '────────────────────',
  '💵 <b>Total Modal:</b> ' + fmt(totalModal),
  '📊 <b>Estimasi Nilai:</b> ' + fmt(totalNilai),
  '📈 <b>Total Floating PnL:</b> ' + totIcon + ' ' + (isTotProfit ? '+' : '') + totalPnlPct + '% (' + (isTotProfit ? '+' : '') + fmt(totalPnlIdr) + ')',
  '',
  btcText,
  '',
  '💡 <i>Ketik <code>/stat [SIMBOL]</code> untuk evaluasi mendalam.</i>\n' +
  '<i>Ketik <code>/sell [SIMBOL]</code> untuk menutup posisi.</i>',
].filter(Boolean).join('\n');

return [{ json: { telegramMessage: msg, chatId: cfg.telegramChatId, botToken: cfg.botToken } }];`,

  // ── /market ──
  formatMarket: String.raw`const cfg = $('Config').first().json;
const coins = $input.all().map(i => i.json);

if (!coins.length) return [{ json: { telegramMessage: '❌ Gagal ambil data market.', chatId: cfg.telegramChatId, botToken: cfg.botToken } }];
const sorted = [...coins].sort((a, b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0));
const gainers = sorted.slice(0, 5), losers = sorted.slice(-5).reverse();
function fmt(c) {
  const pct = ((c.price_change_percentage_24h || 0)).toFixed(2);
  const price = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(c.current_price || 0);
  return (pct >= 0 ? '▲' : '▼') + ' <b>' + c.symbol.toUpperCase() + '</b> ' + price + ' (' + (pct >= 0 ? '+' : '') + pct + '%)';
}
const now = new Intl.DateTimeFormat('id-ID', { timeZone: cfg.timezone, timeStyle: 'short' }).format(new Date());
const msg = ['📈 <b>Market IDR — Top Gainers & Losers 24h</b>', '<i>' + now + ' WIB</i>', '', '🟢 <b>Gainers:</b>', ...gainers.map(fmt), '', '🔴 <b>Losers:</b>', ...losers.map(fmt), '', '<i>Dari 100 koin terbesar</i>'].join('\n');
return [{ json: { telegramMessage: msg, chatId: cfg.telegramChatId, botToken: cfg.botToken } }];`,

  // ── /history ──
  buildHistory: String.raw`const update = $('Parse Incoming Message').first().json;
const cfg = $('Config').first().json;
const raw = ($input.first().json.stdout || '').trim();
const sym = update.args.toUpperCase().trim() || 'semua';
const lines = raw.split('\n').filter(Boolean);
if (!lines.length) {
  const msg = '📋 Belum ada riwayat analisis' + (update.args ? ' untuk ' + sym : '') + '.\n\nGunakan /coin [simbol] untuk memulai analisis.';
  return [{ json: { telegramMessage: msg, chatId: cfg.telegramChatId, botToken: cfg.botToken } }];
}
const sessions = lines.map(line => {
  const [tanggal, waktu, simbol, tipe, keputusan, skor, ringkasan] = line.split('|');
  return { tanggal, waktu, simbol, tipe, keputusan, skor: parseFloat(skor) || 0, ringkasan: ringkasan || '' };
});
const header = '📋 <b>Riwayat Analisis' + (update.args ? ' ' + sym : '') + '</b>\n\n';
const rows = sessions.slice(0, 10).map(s =>
  s.tanggal + (s.waktu ? ' ' + s.waktu : '') + ' <b>' + s.simbol + '</b> [' + s.tipe + '] ' +
  (s.keputusan ? '→ ' + (s.keputusan === 'BUY' ? '🟢 ' : s.keputusan === 'SELL' ? '🔴 ' : '🟡 ') + s.keputusan : '') +
  (s.ringkasan ? '\n  <i>' + s.ringkasan.slice(0, 80) + '</i>' : '')
).join('\n\n');
return [{ json: { telegramMessage: header + rows, chatId: cfg.telegramChatId, botToken: cfg.botToken } }];`,

  // ── /buy ──
  extractBuyCoin: String.raw`const data = $input.first().json;
const update = $('Parse Incoming Message').first().json;
const cfg = $('Config').first().json;
const query = (update.coinArg || '').toLowerCase().trim();

if (!query) {
  return [{ json: {
    found: false,
    telegramMessage: '❌ Masukkan simbol koin yang ingin dibeli.\nContoh: <code>/buy SOL 150k</code> atau <code>/buy BTC</code>',
    chatId: cfg.telegramChatId, botToken: cfg.botToken,
  }}];
}

const coins = data.coins || [];
let coin = coins.find(c => c.symbol?.toLowerCase() === query);
if (!coin) coin = coins.find(c => c.name?.toLowerCase() === query);
if (!coin && coins.length > 0) coin = coins[0];

if (!coin) {
  return [{ json: {
    found: false,
    telegramMessage: '❌ Koin <b>' + query.toUpperCase() + '</b> tidak ditemukan di pasar.\nCoba periksa kembali simbol koinnya (contoh: SOL, SUI, AERO, BTC).',
    chatId: cfg.telegramChatId, botToken: cfg.botToken,
  }}];
}

return [{ json: {
  found: true,
  coinId: coin.id,
  coinSymbol: coin.symbol.toUpperCase(),
  coinName: coin.name,
  modalArg: update.modalArg || 100000,
  chatId: cfg.telegramChatId,
  botToken: cfg.botToken,
}}];`,

  prepareBuyExec: String.raw`const chartData = $input.first().json;
const prices = chartData.prices || [];
const buyCtx = $('Extract Buy Coin').first().json;
const cfg = $('Config').first().json;

if (!prices.length) {
  return [{ json: {
    hasPrice: false,
    telegramMessage: '❌ Gagal mengambil data harga pasar untuk <b>' + buyCtx.coinSymbol + '</b>. Silakan coba sesaat lagi.',
    chatId: buyCtx.chatId, botToken: buyCtx.botToken,
  }}];
}

const lastPrice = Math.round(prices.at(-1)[1]);
const tpPrice = Math.round(lastPrice * 1.12);
const slPrice = Math.round(lastPrice * 0.94);
const sym = buyCtx.coinSymbol;
const coinId = buyCtx.coinId;
const name = (buyCtx.coinName || sym).replace(/'/g, "");
const modal = buyCtx.modalArg || 100000;

const dbCmd = "node /home/node/.n8n/manage_positions.mjs buy " + sym + " " + coinId + " '" + name + "' " + lastPrice + " " + modal + " " + tpPrice + " " + slPrice;

return [{ json: {
  dbCmd,
  coinSymbol: sym,
  coinName: buyCtx.coinName,
  modal,
  chatId: buyCtx.chatId,
  botToken: buyCtx.botToken,
}}];`,

  formatBuyResponse: String.raw`const raw = ($input.first().json.stdout || '').trim();
const cfg = $('Config').first().json;
let res = null;
try {
  res = JSON.parse(raw);
} catch (e) {
  return [{ json: {
    telegramMessage: '❌ Terjadi kesalahan saat mencatat posisi: ' + raw.slice(0, 100),
    chatId: cfg.telegramChatId, botToken: cfg.botToken,
  }}];
}

if (!res || !res.success) {
  return [{ json: {
    telegramMessage: '❌ Gagal mencatat posisi: ' + (res?.error || 'Unknown error'),
    chatId: cfg.telegramChatId, botToken: cfg.botToken,
  }}];
}

const fmt = v => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);

let msg = '';
if (res.action === 'dca') {
  msg = [
    '🔵 <b>DCA Ditambahkan: ' + res.simbol + ' (' + res.nama + ')</b>',
    '',
    '💰 Entry Baru: ' + fmt(res.entryBaru),
    '⚖️ <b>Harga Rata-Rata (Avg Down):</b> ' + fmt(res.avgPrice),
    '💵 Modal Ditambahkan: ' + fmt(res.modalBaru),
    '💼 <b>Total Modal Terakumulasi:</b> ' + fmt(res.totalModal),
    '',
    '🎯 Target Profit Baru (+12%): ' + fmt(res.tpPrice),
    '🛑 Stop Loss Baru (-6%): ' + fmt(res.slPrice),
    '',
    '<i>Posisi diperbarui otomatis di /portfolio & dipantau cron alert!</i>',
  ].join('\n');
} else {
  msg = [
    '🟢 <b>Posisi Baru Terbuka: ' + res.simbol + ' (' + res.nama + ')</b>',
    '',
    '💰 Harga Beli: ' + fmt(res.avgPrice),
    '💵 Modal Alokasi: ' + fmt(res.totalModal),
    '🎯 Target Profit (+12%): ' + fmt(res.tpPrice),
    '🛑 Stop Loss (-6%): ' + fmt(res.slPrice),
    '',
    '<i>Koin kini aktif dipantau di /portfolio dan cron alert berkala.</i>\n' +
    '<i>Ketik <code>/stat ' + res.simbol + '</code> kapan saja untuk evaluasi posisi.</i>',
  ].join('\n');
}

return [{ json: { telegramMessage: msg, chatId: cfg.telegramChatId, botToken: cfg.botToken } }];`,

  // ── /sell ──
  prepareSellQuery: String.raw`const update = $('Parse Incoming Message').first().json;
const cfg = $('Config').first().json;
const sym = (update.coinArg || '').toUpperCase().trim();

if (!sym) {
  const dbCmd = "node /home/node/.n8n/manage_positions.mjs get-active __NONE__";
  return [{ json: { sym: '', dbCmd, chatId: cfg.telegramChatId, botToken: cfg.botToken } }];
}

const dbCmd = "node /home/node/.n8n/manage_positions.mjs get-active " + sym;
return [{ json: { sym, dbCmd, chatId: cfg.telegramChatId, botToken: cfg.botToken } }];`,

  processSellCheck: String.raw`const raw = ($input.first().json.stdout || '').trim();
const sellInit = $('Prepare Sell Query').first().json;
const cfg = $('Config').first().json;

if (!sellInit.sym) {
  return [{ json: {
    found: false,
    telegramMessage: '❌ Masukkan simbol koin yang ingin ditutup.\nContoh: <code>/sell SOL</code>',
    chatId: cfg.telegramChatId, botToken: cfg.botToken,
  }}];
}

let res = null;
try {
  res = JSON.parse(raw);
} catch (e) {}

if (!res || !res.found || !res.position) {
  return [{ json: {
    found: false,
    telegramMessage: '❌ Kamu belum memiliki posisi aktif untuk <b>' + sellInit.sym + '</b>.\nKetik <code>/portfolio</code> untuk melihat koin yang sedang dipantau.',
    chatId: cfg.telegramChatId, botToken: cfg.botToken,
  }}];
}

return [{ json: {
  found: true,
  sym: sellInit.sym,
  coinId: res.position.coin_id,
  position: res.position,
  chatId: cfg.telegramChatId,
  botToken: cfg.botToken,
}}];`,

  prepareClosePosition: String.raw`const pData = $input.first().json;
const sellCtx = $('Process Sell Check').first().json;
const currPrice = pData[sellCtx.coinId]?.idr || sellCtx.position.harga_beli;
const dbCmd = "node /home/node/.n8n/manage_positions.mjs sell " + sellCtx.sym + " " + currPrice;
return [{ json: { dbCmd, currPrice, sym: sellCtx.sym, chatId: sellCtx.chatId, botToken: sellCtx.botToken } }];`,

  formatSellResponse: String.raw`const raw = ($input.first().json.stdout || '').trim();
const cfg = $('Config').first().json;
let res = null;
try {
  res = JSON.parse(raw);
} catch (e) {}

if (!res || !res.success) {
  return [{ json: {
    telegramMessage: '❌ Gagal menutup posisi: ' + (res?.error || raw.slice(0, 100)),
    chatId: cfg.telegramChatId, botToken: cfg.botToken,
  }}];
}

const fmt = v => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);
const isProfit = res.pnlPct >= 0;
const pnlIcon = isProfit ? '🟢' : '🔴';
const pnlWord = isProfit ? 'Untung' : 'Rugi';

const msg = [
  '🏁 <b>Posisi Ditutup: ' + res.simbol + ' (' + res.nama + ')</b>',
  '',
  '📅 Tanggal Masuk: ' + res.tanggalBeli,
  '💰 Harga Beli: ' + fmt(res.hargaBeli),
  '💵 Harga Jual: ' + fmt(res.hargaJual),
  '',
  '📊 <b>Hasil Realized PnL:</b>',
  pnlIcon + ' ' + (isProfit ? '+' : '') + res.pnlPct + '% (' + pnlWord + ' ' + fmt(Math.abs(res.pnlIdr)) + ')',
  '💵 <b>Total Dana Kembali:</b> ' + fmt(res.totalReturn) + ' (Modal ' + fmt(res.modalIdr) + ')',
  '',
  '<i>Koin telah dikeluarkan dari daftar pantauan aktif.</i>',
].join('\n');

return [{ json: { telegramMessage: msg, chatId: cfg.telegramChatId, botToken: cfg.botToken } }];`,

  // ── /stat ──
  prepareStatQuery: String.raw`const update = $('Parse Incoming Message').first().json;
const cfg = $('Config').first().json;
const sym = (update.coinArg || '').toUpperCase().trim();

if (!sym) {
  const dbCmd = "node /home/node/.n8n/manage_positions.mjs get-active __NONE__";
  return [{ json: { sym: '', dbCmd, chatId: cfg.telegramChatId, botToken: cfg.botToken } }];
}

const dbCmd = "node /home/node/.n8n/manage_positions.mjs get-active " + sym;
return [{ json: { sym, dbCmd, chatId: cfg.telegramChatId, botToken: cfg.botToken } }];`,

  processStatPosition: String.raw`const raw = ($input.first().json.stdout || '').trim();
const statInit = $('Prepare Stat Query').first().json;
const cfg = $('Config').first().json;

if (!statInit.sym) {
  return [{ json: {
    found: false,
    telegramMessage: '❌ Masukkan simbol koin yang ingin dicek.\nContoh: <code>/stat SOL</code>',
    chatId: cfg.telegramChatId, botToken: cfg.botToken,
  }}];
}

let res = null;
try {
  res = JSON.parse(raw);
} catch (e) {}

if (!res || !res.found || !res.position) {
  return [{ json: {
    found: false,
    telegramMessage: '❌ Kamu belum memiliki posisi aktif untuk <b>' + statInit.sym + '</b>.\n\nKetik <code>/buy ' + statInit.sym + ' [modal]</code> untuk mulai memantau koin ini.',
    chatId: cfg.telegramChatId, botToken: cfg.botToken,
  }}];
}

return [{ json: {
  found: true,
  sym: statInit.sym,
  coinId: res.position.coin_id,
  position: res.position,
  chatId: cfg.telegramChatId,
  botToken: cfg.botToken,
}}];`,

  buildStatReport: TECH_SHARED + String.raw`
const rawPrices = $('Fetch Stat Chart').first().json.prices || [];
const statCtx = $('Process Stat Position').first().json;
const assetSymbol = statCtx.sym;
` + TECH_CALC + String.raw`
const pos = statCtx.position;
const cfg = $('Config').first().json;

const entryPrice = Number(pos.harga_beli);
const modalIdr = Number(pos.modal_idr);
const tpPrice = Number(pos.target_profit);
const slPrice = Number(pos.stop_loss);
const currPrice = techResult.currentPrice;

const pnlPct = Number(((currPrice - entryPrice) / entryPrice * 100).toFixed(2));
const pnlIdr = Math.round(modalIdr * (pnlPct / 100));
const currVal = modalIdr + pnlIdr;

const distToTp = Number(((tpPrice - currPrice) / currPrice * 100).toFixed(1));
const distToSl = Number(((currPrice - slPrice) / currPrice * 100).toFixed(1));

const isProfit = pnlPct >= 0;
const pnlIcon = isProfit ? '🟢' : '🔴';
const fmt = v => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);

// Evaluasi Rekomendasi Khusus Holder
let recBadge = '', recDesc = '';
if (currPrice >= tpPrice) {
  recBadge = '🟢 TAKE PROFIT (TARGET TERCAPAI)';
  recDesc = 'Harga telah menyentuh target profit (' + (isProfit ? '+' : '') + pnlPct + '%). Sangat disarankan untuk mengeksekusi <code>/sell ' + statCtx.sym + '</code> untuk mengunci keuntungan penuh atau pasang trailing stop ketat.';
} else if (currPrice <= slPrice || (techResult.swingLow14 && currPrice < techResult.swingLow14 && pnlPct < -3)) {
  recBadge = '🔴 CUT LOSS (LEVEL PROTEKSI TERSENTUH)';
  recDesc = 'Harga telah menembus batas risiko (' + pnlPct + '%). Sangat disarankan eksekusi <code>/sell ' + statCtx.sym + '</code> untuk mengamankan sisa modal dan menunggu setup baru.';
} else if (pnlPct < -3 && techResult.trendDir > 0 && techResult.indicators.rsi14 < 45) {
  recBadge = '🔵 PERTIMBANGKAN DCA (PULLBACK SEHAT)';
  recDesc = 'Tren makro masih bullish namun harga terkoreksi di bawah harga modal. Sangat menarik untuk di-average down (<code>/buy ' + statCtx.sym + ' [modal]</code>) jika alokasi modal tersedia.';
} else if (pnlPct > 6 && techResult.indicators.rsi14 > 68) {
  recBadge = '🟡 AMANKAN MODAL (PASANG TRAILING STOP)';
  recDesc = 'Posisi sedang floating profit +' + pnlPct + '% dan indikator RSI mendekati jenuh beli. Pertimbangkan memindahkan stop loss mental ke harga modal (BEP).';
} else {
  recBadge = '🟡 HOLD (POSISI BERJALAN ON TRACK)';
  recDesc = 'Posisi berjalan normal di dalam koridor risiko dan tren masih mendukung. Tetap bersabar menunggu target profit tercapai.';
}

const trendTag = techResult.trendDir > 0 ? 'Uptrend ▲' : techResult.trendDir < 0 ? 'Downtrend ▼' : 'Sideways ↔';
const adxTag = (techResult.adxVal || 0) > 25 ? 'Kuat (' + techResult.adxVal + ')' : 'Moderat (' + (techResult.adxVal || 0) + ')';

const msg = [
  '📊 <b>Evaluasi Posisi: ' + statCtx.sym + ' (' + pos.nama + ')</b>',
  '',
  '💰 Harga Beli: ' + fmt(entryPrice),
  '📍 Harga Saat Ini: ' + fmt(currPrice),
  '💵 Alokasi Modal: ' + fmt(modalIdr) + ' (Estimasi Nilai: ' + fmt(currVal) + ')',
  '📈 <b>Floating PnL:</b> ' + pnlIcon + ' ' + (isProfit ? '+' : '') + pnlPct + '% (' + (isProfit ? '+' : '') + fmt(pnlIdr) + ')',
  '',
  '🎯 <b>Target Profit:</b> ' + fmt(tpPrice) + ' (sisa ' + (distToTp > 0 ? '+' : '') + distToTp + '%)',
  '🛑 <b>Stop Loss:</b> ' + fmt(slPrice) + ' (jarak toleransi ' + distToSl + '%)',
  '',
  '📐 <b>Kondisi Teknikal Saat Ini:</b>',
  '• RSI (14): ' + techResult.indicators.rsi14 + ' | MACD: ' + (techResult.indicators.macdHistogram > 0 ? '▲ Bullish' : '▼ Bearish'),
  '• Tren: ' + trendTag + ' | ADX: ' + adxTag,
  '• Swing Low (14h): ' + fmt(techResult.swingLow14 || 0),
  '',
  '💡 <b>Saran Keputusan:</b>',
  '<b>' + recBadge + '</b>',
  '<i>' + recDesc + '</i>',
  '',
  '⚠️ <i>Decision support only. Eksekusi jual/beli tetap di tangan kamu.</i>',
].join('\n');

return [{ json: { telegramMessage: msg, chatId: cfg.telegramChatId, botToken: cfg.botToken } }];`,

  // ── /rec (Pullback Screener) ──
  formatRecMessage: String.raw`const cfg = $('Config').first().json;
const coins = $input.all().map(i => i.json);

if (!coins.length || !coins[0] || !coins[0].id) {
  return [{ json: { telegramMessage: '⏳ Data pasar sedang padat. Silakan coba /rec beberapa saat lagi.', chatId: cfg.telegramChatId, botToken: cfg.botToken } }];
}

const stableSet = new Set(['usdt', 'usdc', 'dai', 'fdusd', 'usde', 'tusd', 'usdd', 'pyusd', 'bousd', 'wbtc', 'steth', 'weth', 'weeth', 'wsteth']);

// Filter koin likuid non-stable
const screened = coins.filter(c => {
  const sym = (c.symbol || '').toLowerCase();
  if (stableSet.has(sym)) return false;
  const p7d = c.price_change_percentage_7d_in_currency;
  const p24h = c.price_change_percentage_24h;
  if (typeof p7d !== 'number' || typeof p24h !== 'number') return false;
  // Uptrend 7d, koreksi sehat 24h (-8% s/d -0.5%)
  return p7d >= 2.5 && p24h <= -0.5 && p24h >= -8.5;
});

// Urutkan berdasarkan kekuatan tren 7d
screened.sort((a, b) => (b.price_change_percentage_7d_in_currency || 0) - (a.price_change_percentage_7d_in_currency || 0));

// Jika kurang dari 3, fallback ke koin tren positif dengan koreksi ringan
let picks = screened.slice(0, 3);
if (picks.length < 3) {
  const fallback = coins.filter(c => {
    const sym = (c.symbol || '').toLowerCase();
    if (stableSet.has(sym)) return false;
    if (picks.some(p => p.id === c.id)) return false;
    const p7d = c.price_change_percentage_7d_in_currency;
    const p24h = c.price_change_percentage_24h;
    return typeof p7d === 'number' && typeof p24h === 'number' && p7d >= 0 && p24h <= 1.0;
  });
  fallback.sort((a, b) => (b.price_change_percentage_7d_in_currency || 0) - (a.price_change_percentage_7d_in_currency || 0));
  picks = picks.concat(fallback.slice(0, 3 - picks.length));
}

const fmt = v => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);

const cards = picks.map((c, i) => {
  const price = c.current_price || 0;
  const p7d = (c.price_change_percentage_7d_in_currency || 0).toFixed(1);
  const p24h = (c.price_change_percentage_24h || 0).toFixed(1);
  const entryLow = fmt(Math.round(price * 0.98));
  const entryHigh = fmt(price);
  const tp = fmt(Math.round(price * 1.12));
  const sl = fmt(Math.round(price * 0.94));

  return [
    (i + 1) + '️⃣ <b>' + c.symbol.toUpperCase() + ' (' + c.name + ')</b>',
    '• Harga Sekarang: ' + fmt(price),
    '• Momentum: 📈 7d: +' + p7d + '% | 📉 24h: ' + p24h + '% (Diskon)',
    '• Area Entry Ideal: ' + entryLow + ' – ' + entryHigh,
    '• Target TP (+12%): ' + tp + ' | SL (-6%): ' + sl,
    '👉 <i>Beli & pantau:</i> <code>/buy ' + c.symbol.toLowerCase() + ' 150k</code>',
  ].join('\n');
});

const now = new Intl.DateTimeFormat('id-ID', { timeZone: cfg.timezone, timeStyle: 'short' }).format(new Date());

const msg = [
  '🎯 <b>Radar Rekomendasi Swing Entry Luna Hernandez</b>',
  '<i>' + now + ' WIB | Kriteria: Uptrend Mingguan + Pullback Sehat 24 Jam</i>',
  '',
  cards.join('\n\n'),
  '',
  '💡 <i>Ketik <code>/coin &lt;simbol&gt;</code> untuk bedah teknikal lengkap & berita live.</i>\n' +
  '<i>Ketik <code>/buy &lt;simbol&gt; [modal]</code> untuk langsung memasukkan ke portofolio.</i>\n' +
  '⚠️ <i>Decision support only. Bukan saran finansial.</i>',
].join('\n');

return [{ json: { telegramMessage: msg, chatId: cfg.telegramChatId, botToken: cfg.botToken } }];`,

  // ── Cron Alerts (Background Job) ──
  formatCronAlerts: String.raw`const raw = ($input.first().json.stdout || '').trim();
const cfg = $('Config Cron').first().json;

let res = null;
try {
  res = JSON.parse(raw);
} catch (e) {}

const alerts = res?.alerts || [];

if (!alerts.length) {
  return [{ json: { hasAlerts: false } }];
}

const fmt = v => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);

const alertItems = alerts.map(a => {
  if (a.type === 'TP_HIT') {
    return [
      '🟢 <b>TARGET PROFIT TERSENTUH: ' + a.simbol + ' (' + a.nama + ')</b>',
      '• Harga Sekarang: ' + fmt(a.currentPrice),
      '• Target TP: ' + fmt(a.targetProfit) + ' (' + (a.pnlPct >= 0 ? '+' : '') + a.pnlPct + '%)',
      '👉 <i>Ketik <code>/sell ' + a.simbol.toLowerCase() + '</code> untuk mengunci keuntungan sekarang!</i>',
    ].join('\n');
  } else {
    return [
      '🔴 <b>STOP LOSS TERSENTUH: ' + a.simbol + ' (' + a.nama + ')</b>',
      '• Harga Sekarang: ' + fmt(a.currentPrice),
      '• Batas SL: ' + fmt(a.stopLoss) + ' (' + a.pnlPct + '%)',
      '👉 <i>Ketik <code>/sell ' + a.simbol.toLowerCase() + '</code> untuk membatasi kerugian!</i>',
    ].join('\n');
  }
});

const msg = [
  '🔔 <b>LUNA HERNANDEZ AUTO-ALERT: Notifikasi Pergerakan Posisi</b>',
  '',
  alertItems.join('\n\n'),
  '',
  '⚠️ <i>Periksa detail status di <code>/stat &lt;simbol&gt;</code> atau <code>/portfolio</code>.</i>',
].join('\n');

return [{ json: {
  hasAlerts: true,
  telegramMessage: msg,
  chatId: cfg.telegramChatId,
  botToken: cfg.botToken,
}}];`,

  unknownCmd: String.raw`const update = $('Parse Incoming Message').first().json;
const cfg = $('Config').first().json;
const msg = '❓ Perintah <b>/' + update.command + '</b> tidak dikenal.\n\nKetik <code>/start</code> untuk panduan lengkap atau <code>/help</code> untuk daftar perintah.';
return [{ json: { telegramMessage: msg, chatId: cfg.telegramChatId, botToken: cfg.botToken } }];`,
};

// ═══════════════════════════════════════════════════════════════
// HELPER BUILDERS
// ═══════════════════════════════════════════════════════════════
function httpGet(id, name, url, x, y, extra = {}) {
  return {
    parameters: {
      url,
      sendHeaders: true,
      headerParameters: { parameters: [{ name: 'User-Agent', value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }] },
      options: { timeout: 30000, response: { response: { responseFormat: 'json' } } },
      ...extra.params,
    },
    id, name, type: 'n8n-nodes-base.httpRequest', typeVersion: 4.4, position: [x, y],
    retryOnFail: true, maxTries: 2, waitBetweenTries: 3000,
    ...(extra.onError ? { onError: extra.onError } : {}),
  };
}
function httpGetText(id, name, url, x, y) {
  return {
    parameters: {
      url,
      sendHeaders: true,
      headerParameters: { parameters: [{ name: 'User-Agent', value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }] },
      options: { timeout: 20000, response: { response: { responseFormat: 'text' } } },
    },
    id, name, type: 'n8n-nodes-base.httpRequest', typeVersion: 4.4, position: [x, y],
    retryOnFail: true, maxTries: 2, waitBetweenTries: 2000, onError: 'continueRegularOutput',
  };
}
function httpPost(id, name, urlExpr, bodyExpr, x, y, timeoutMs = 60000) {
  return {
    parameters: {
      method: 'POST', url: urlExpr,
      sendHeaders: true, headerParameters: { parameters: [{ name: 'Content-Type', value: 'application/json' }] },
      sendBody: true, specifyBody: 'json', jsonBody: bodyExpr,
      options: { timeout: timeoutMs, response: { response: { responseFormat: 'json' } } },
    },
    id, name, type: 'n8n-nodes-base.httpRequest', typeVersion: 4.4, position: [x, y],
    retryOnFail: true, maxTries: 2, waitBetweenTries: 3000, onError: 'continueRegularOutput',
  };
}
function codeNode(id, name, jsCode, x, y, notes) {
  const n = { parameters: { jsCode }, id, name, type: 'n8n-nodes-base.code', typeVersion: 2, position: [x, y] };
  if (notes) { n.notesInFlow = true; n.notes = notes; }
  return n;
}
function execNode(id, name, command, x, y, once = false) {
  return {
    parameters: { executeOnce: once, command },
    id, name, type: 'n8n-nodes-base.executeCommand', typeVersion: 1, position: [x, y],
    onError: 'continueRegularOutput',
  };
}
function tgSend(id, name, x, y) {
  return {
    parameters: {
      method: 'POST',
      url: "=https://api.telegram.org/bot{{ $json.botToken || $('Config').first().json.botToken }}/sendMessage",
      sendHeaders: true,
      headerParameters: { parameters: [{ name: 'Content-Type', value: 'application/json' }] },
      sendBody: true,
      specifyBody: 'json',
      jsonBody: '={{ JSON.stringify({ chat_id: $json.chatId || $(\'Config\').first().json.telegramChatId, text: $json.telegramMessage, parse_mode: "HTML", disable_web_page_preview: true }) }}',
      options: { timeout: 15000, response: { response: { responseFormat: 'json' } } },
    },
    id, name, type: 'n8n-nodes-base.httpRequest', typeVersion: 4.4, position: [x, y],
    retryOnFail: true, maxTries: 2, waitBetweenTries: 2000, onError: 'continueRegularOutput',
  };
}
function ifNode(id, name, conditionExpr, x, y) {
  return {
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
        conditions: [{ id: 'c1', leftValue: conditionExpr, rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }],
        combinator: 'and',
      },
    },
    id, name, type: 'n8n-nodes-base.if', typeVersion: 2.2, position: [x, y],
  };
}
function scheduleTrigger(id, name, expression, x, y) {
  return {
    parameters: {
      rule: {
        interval: [
          {
            field: 'cronExpression',
            expression,
          },
        ],
      },
    },
    id, name, type: 'n8n-nodes-base.scheduleTrigger', typeVersion: 1.3, position: [x, y],
  };
}

const GEMINI_URL = "={{ 'https://generativelanguage.googleapis.com/v1beta/models/' + $('Config').first().json.geminiModel + ':generateContent?key=' + $('Config').first().json.geminiApiKey }}";

const nodes = [
  // ── 1. Webhook Entrypoint (REALTIME 0 DELAY) ──
  {
    parameters: {
      httpMethod: 'POST',
      path: 'midas-bot',
      responseMode: 'onReceived',
      options: {},
    },
    id: 'W0001',
    name: 'Telegram Webhook',
    type: 'n8n-nodes-base.webhook',
    typeVersion: 2,
    position: [-1000, 0],
    webhookId: 'midas-bot',
  },

  // ── 2. Config & Parse ──
  codeNode('W0002', 'Config', code.config, -700, 0, 'Config bot token & chat ID.'),
  codeNode('W0005', 'Parse Incoming Message', code.parseWebhook, -400, 0),

  // ── 3. Has Command IF ──
  {
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
        conditions: [{ id: 'c1', leftValue: '={{ $json.hasCommand }}', rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }],
        combinator: 'and',
      },
    },
    id: 'W0006',
    name: 'Has Command?',
    type: 'n8n-nodes-base.if',
    typeVersion: 2.2,
    position: [-160, 0],
  },

  // ── 4. Command Router ──
  {
    parameters: {
      mode: 'rules',
      rules: {
        values: [
          { conditions: { conditions: [{ leftValue: '={{ $json.command }}', rightValue: 'coin', operator: { type: 'string', operation: 'equals' } }], combinator: 'and' }, renameOutput: true, outputKey: 'coin' },
          { conditions: { conditions: [{ leftValue: '={{ $json.command }}', rightValue: 'ask', operator: { type: 'string', operation: 'equals' } }], combinator: 'and' }, renameOutput: true, outputKey: 'ask' },
          { conditions: { conditions: [{ leftValue: '={{ $json.command }}', rightValue: 'portfolio', operator: { type: 'string', operation: 'equals' } }], combinator: 'and' }, renameOutput: true, outputKey: 'portfolio' },
          { conditions: { conditions: [{ leftValue: '={{ $json.command }}', rightValue: 'market', operator: { type: 'string', operation: 'equals' } }], combinator: 'and' }, renameOutput: true, outputKey: 'market' },
          { conditions: { conditions: [{ leftValue: '={{ $json.command }}', rightValue: 'history', operator: { type: 'string', operation: 'equals' } }], combinator: 'and' }, renameOutput: true, outputKey: 'history' },
          { conditions: { conditions: [{ leftValue: '={{ $json.command }}', rightValue: 'start', operator: { type: 'string', operation: 'equals' } }], combinator: 'and' }, renameOutput: true, outputKey: 'start' },
          { conditions: { conditions: [{ leftValue: '={{ $json.command }}', rightValue: 'help', operator: { type: 'string', operation: 'equals' } }], combinator: 'and' }, renameOutput: true, outputKey: 'help' },
          { conditions: { conditions: [{ leftValue: '={{ $json.command }}', rightValue: 'buy', operator: { type: 'string', operation: 'equals' } }], combinator: 'and' }, renameOutput: true, outputKey: 'buy' },
          { conditions: { conditions: [{ leftValue: '={{ $json.command }}', rightValue: 'sell', operator: { type: 'string', operation: 'equals' } }], combinator: 'and' }, renameOutput: true, outputKey: 'sell' },
          { conditions: { conditions: [{ leftValue: '={{ $json.command }}', rightValue: 'stat', operator: { type: 'string', operation: 'equals' } }], combinator: 'and' }, renameOutput: true, outputKey: 'stat' },
          { conditions: { conditions: [{ leftValue: '={{ $json.command }}', rightValue: 'rec', operator: { type: 'string', operation: 'equals' } }], combinator: 'and' }, renameOutput: true, outputKey: 'rec' },
        ],
      },
      fallbackOutput: 'extra',
    },
    id: 'W0007',
    name: 'Command Router',
    type: 'n8n-nodes-base.switch',
    typeVersion: 3.2,
    position: [100, 0],
  },

  // /start onboarding guide
  codeNode('B1000', 'Build Start', code.buildStart, 380, 550),
  tgSend('B1003', 'Send Start', 620, 550),

  // /help
  codeNode('B1001', 'Build Help', code.buildHelp, 380, 700),
  tgSend('B1002', 'Send Help', 620, 700),

  // /coin — deep analysis
  httpGet('B2001', 'CoinGecko Search', "=https://api.coingecko.com/api/v3/search?query={{ encodeURIComponent($json.args) }}", 380, -800, { onError: 'continueRegularOutput' }),
  codeNode('B2002', 'Extract Coin ID', code.extractCoinId, 620, -800),
  tgSend('B2008', 'Send Coin Error', 620, -960),
  httpGet('B2003', 'CoinGecko Market Chart',
    "=https://api.coingecko.com/api/v3/coins/{{ $json.coinId }}/market_chart?vs_currency={{ $('Config').first().json.quoteCurrency }}&days={{ $('Config').first().json.marketDays }}",
    860, -800, { onError: 'continueRegularOutput' }),
  httpGet('B2018', 'Fetch BTC Gate',
    "=https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency={{ $('Config').first().json.quoteCurrency }}&days={{ $('Config').first().json.marketDays }}",
    1100, -800, { onError: 'continueRegularOutput' }),
  codeNode('B2019', 'BTC Gate', code.btcGate, 1340, -800, 'Hitung BTC gate signal: bullish/bearish/neutral berdasarkan SMA20 + MACD'),
  codeNode('B2004', 'Coin Technical', code.coinTechnical, 1580, -800),

  // Real-time news via Google News RSS
  httpGetText('B2005', 'Fetch Google News',
    "={{ 'https://news.google.com/rss/search?q=' + encodeURIComponent($('Extract Coin ID').first().json.coinName + ' crypto') + '&hl=en&gl=US&ceid=US:en' }}",
    1340, -800),
  codeNode('B2006', 'Parse News', code.parseNews, 1580, -800, 'Parse Google News RSS, ambil 10 artikel terbaru.'),

  // SQLite history lookup
  codeNode('B2009', 'Prepare Read Prev', code.readPrevAnalysis, 1820, -800),
  execNode('B2010', 'Read Previous Analysis', '={{ $json.dbCmd }}', 2060, -800),
  codeNode('B2011', 'Parse Previous Analysis', code.parsePrevAnalysis, 2300, -800),

  // Gemini prompt synthesis
  codeNode('B2012', 'Prepare Gemini Coin Prompt', code.prepareGeminiCoinPrompt, 2540, -800, 'Prompt komprehensif: teknikal + berita + histori -> Gemini'),
  httpPost('B2013', 'Gemini Coin Research', GEMINI_URL, '={{ JSON.stringify($json.geminiBody) }}', 2780, -800, 60000),
  codeNode('B2014', 'Build Coin Report', code.buildCoinReport, 3020, -800),

  // Parallel send & save
  tgSend('B2017', 'Send Coin Report', 3260, -880),
  codeNode('B2015', 'Prepare Save Coin', code.saveCoinAnalysis, 3260, -720),
  execNode('B2016', 'Save Coin Analysis', '={{ $json.dbCmd }}', 3500, -720),

  // /ask — with LIVE Google News Search + SQLite memory
  httpGetText('B3000', 'Fetch Ask News',
    "={{ 'https://news.google.com/rss/search?q=' + encodeURIComponent($json.args + ' crypto') + '&hl=en&gl=US&ceid=US:en' }}",
    380, -400),
  codeNode('B3001', 'Parse Ask News', code.parseAskNews, 620, -400, 'Browsing Google News live untuk topik /ask.'),
  codeNode('B3002', 'Prepare Read Sessions', code.readRecentSessions, 860, -400),
  execNode('B3003', 'Read Recent Sessions', '={{ $json.dbCmd }}', 1100, -400),
  codeNode('B3004', 'Build Ask With Context', code.buildAskWithContext, 1340, -400, 'Kombinasi Berita Live + Riwayat SQLite -> Gemini.'),
  httpPost('B3005', 'Gemini Ask', GEMINI_URL, '={{ JSON.stringify($json.geminiBody) }}', 1580, -400, 60000),
  codeNode('B3006', 'Format Ask Answer', code.formatAsk, 1820, -400),

  // Parallel send & save for /ask
  tgSend('B3007', 'Send Ask', 2060, -480),
  codeNode('B3008', 'Prepare Save Ask', code.saveAskSession, 2060, -320),
  execNode('B3009', 'Save Ask Session', '={{ $json.dbCmd }}', 2300, -320),

  // /portfolio (Dynamic Upgrade)
  codeNode('B4001', 'Prepare List Positions', code.prepareListPositions, 380, 200),
  execNode('B4002', 'Query List Positions', '={{ $json.dbCmd }}', 620, 200),
  codeNode('B4003', 'Process Portfolio Check', code.processPortfolioCheck, 860, 200),
  ifNode('B4004', 'Has Active Positions?', '={{ $json.hasPositions }}', 1100, 200),
  tgSend('B4005', 'Send Empty Portfolio', 1340, 280),
  httpGet('B4006', 'Fetch Portfolio Prices',
    "=https://api.coingecko.com/api/v3/simple/price?ids={{ $json.coinIds }},bitcoin&vs_currencies=idr&include_24hr_change=true",
    1340, 120, { onError: 'continueRegularOutput' }),
  codeNode('B4007', 'Format Dynamic Portfolio', code.formatDynamicPortfolio, 1580, 120),
  tgSend('B4008', 'Send Dynamic Portfolio', 1820, 120),

  // /market
  httpGet('B5001', 'CoinGecko Markets',
    "=https://api.coingecko.com/api/v3/coins/markets?vs_currency={{ $('Config').first().json.quoteCurrency }}&order=market_cap_desc&per_page=100&page=1&price_change_percentage=24h",
    380, 400),
  codeNode('B5002', 'Format Market', code.formatMarket, 620, 400),
  tgSend('B5003', 'Send Market', 860, 400),

  // /history
  { parameters: { executeOnce: false, command: "={{ (() => { const p=$('Config').first().json.sqlitePath; const sym=($('Parse Incoming Message').first().json.args||'').toUpperCase().replace(/'/g,\"''\"); const where=sym?\"WHERE simbol='\"+sym+\"' AND tipe='coin'\":'WHERE tipe=\\'coin\\''; return \"sqlite3 -separator '|' '\" + p.replace(/'/g,\"'\\\\\"'\\\\\"'\") + \"' \\\\\"SELECT tanggal, waktu, simbol, tipe, keputusan, skor_teknikal, ringkasan FROM coin_sessions \"+where+\" ORDER BY tanggal DESC, id DESC LIMIT 10;\\\\\"\"; })() }}" },
    id: 'B6001', name: 'Read History', type: 'n8n-nodes-base.executeCommand', typeVersion: 1, position: [380, 850],
    onError: 'continueRegularOutput' },
  codeNode('B6002', 'Build History', code.buildHistory, 620, 850),
  tgSend('B6003', 'Send History', 860, 850),

  // unknown
  codeNode('B7001', 'Unknown Command', code.unknownCmd, 380, 1000),
  tgSend('B7002', 'Send Unknown', 620, 1000),

  // /buy
  httpGet('B8001', 'CoinGecko Search Buy',
    "=https://api.coingecko.com/api/v3/search?query={{ encodeURIComponent($('Parse Incoming Message').first().json.coinArg) }}",
    380, 1200, { onError: 'continueRegularOutput' }),
  codeNode('B8002', 'Extract Buy Coin', code.extractBuyCoin, 620, 1200),
  ifNode('B8003', 'Is Buy Found?', '={{ $json.found }}', 860, 1200),
  tgSend('B8004', 'Send Buy Error', 1100, 1280),
  httpGet('B8005', 'Fetch Buy Chart',
    "=https://api.coingecko.com/api/v3/coins/{{ $json.coinId }}/market_chart?vs_currency={{ $('Config').first().json.quoteCurrency }}&days=60",
    1100, 1120, { onError: 'continueRegularOutput' }),
  codeNode('B8006', 'Prepare Buy Exec', code.prepareBuyExec, 1340, 1120),
  execNode('B8007', 'Execute Buy DB', '={{ $json.dbCmd }}', 1580, 1120),
  codeNode('B8008', 'Format Buy Response', code.formatBuyResponse, 1820, 1120),
  tgSend('B8009', 'Send Buy Confirm', 2060, 1120),

  // /sell
  codeNode('B8101', 'Prepare Sell Query', code.prepareSellQuery, 380, 1450),
  execNode('B8102', 'Execute Sell Query', '={{ $json.dbCmd }}', 620, 1450),
  codeNode('B8103', 'Process Sell Check', code.processSellCheck, 860, 1450),
  ifNode('B8104', 'Is Sell Found?', '={{ $json.found }}', 1100, 1450),
  tgSend('B8105', 'Send Sell Error', 1340, 1530),
  httpGet('B8106', 'Fetch Sell Price',
    "=https://api.coingecko.com/api/v3/simple/price?ids={{ $json.coinId }}&vs_currencies=idr",
    1340, 1370, { onError: 'continueRegularOutput' }),
  codeNode('B8107', 'Prepare Close Position', code.prepareClosePosition, 1580, 1370),
  execNode('B8108', 'Execute Close Command', '={{ $json.dbCmd }}', 1820, 1370),
  codeNode('B8109', 'Format Sell Response', code.formatSellResponse, 2060, 1370),
  tgSend('B8110', 'Send Sell Report', 2300, 1370),

  // /stat
  codeNode('B8201', 'Prepare Stat Query', code.prepareStatQuery, 380, 1700),
  execNode('B8202', 'Execute Stat Query', '={{ $json.dbCmd }}', 620, 1700),
  codeNode('B8203', 'Process Stat Position', code.processStatPosition, 860, 1700),
  ifNode('B8204', 'Is Stat Found?', '={{ $json.found }}', 1100, 1700),
  tgSend('B8205', 'Send Stat Error', 1340, 1780),
  httpGet('B8206', 'Fetch Stat Chart',
    "=https://api.coingecko.com/api/v3/coins/{{ $json.coinId }}/market_chart?vs_currency={{ $('Config').first().json.quoteCurrency }}&days=60",
    1340, 1620, { onError: 'continueRegularOutput' }),
  codeNode('B8207', 'Build Stat Report', code.buildStatReport, 1580, 1620),
  tgSend('B8208', 'Send Stat Report', 1820, 1620),

  // /rec
  httpGet('B8301', 'CoinGecko Rec Markets',
    "=https://api.coingecko.com/api/v3/coins/markets?vs_currency={{ $('Config').first().json.quoteCurrency }}&order=market_cap_desc&per_page=100&page=1&price_change_percentage=24h,7d",
    380, 1950, { onError: 'continueRegularOutput' }),
  codeNode('B8302', 'Format Rec Message', code.formatRecMessage, 620, 1950),
  tgSend('B8303', 'Send Rec Message', 860, 1950),

  // Cron Alert (Runs every 2 hours in background)
  scheduleTrigger('C1001', 'Cron Every 2h', '0 */2 * * *', -1000, 2250),
  codeNode('C1002', 'Config Cron', code.config, -700, 2250, 'Config untuk cron execution'),
  execNode('C1003', 'Exec Check Alerts', 'node /home/node/.n8n/manage_positions.mjs check-alerts', -400, 2250),
  codeNode('C1004', 'Format Cron Alerts', code.formatCronAlerts, -160, 2250),
  ifNode('C1005', 'Has Alerts?', '={{ $json.hasAlerts }}', 80, 2250),
  tgSend('C1006', 'Send Cron Alert', 320, 2250),
];

const connections = {
  'Telegram Webhook':        { main: [[{ node: 'Config', type: 'main', index: 0 }]] },
  'Config':                  { main: [[{ node: 'Parse Incoming Message', type: 'main', index: 0 }]] },
  'Parse Incoming Message':  { main: [[{ node: 'Has Command?', type: 'main', index: 0 }]] },
  'Has Command?':            { main: [[{ node: 'Command Router', type: 'main', index: 0 }], []] },
  'Command Router':          { main: [
    [{ node: 'CoinGecko Search', type: 'main', index: 0 }],         // 0: coin
    [{ node: 'Fetch Ask News', type: 'main', index: 0 }],           // 1: ask
    [{ node: 'Prepare List Positions', type: 'main', index: 0 }],   // 2: portfolio
    [{ node: 'CoinGecko Markets', type: 'main', index: 0 }],        // 3: market
    [{ node: 'Read History', type: 'main', index: 0 }],             // 4: history
    [{ node: 'Build Start', type: 'main', index: 0 }],              // 5: start
    [{ node: 'Build Help', type: 'main', index: 0 }],               // 6: help
    [{ node: 'CoinGecko Search Buy', type: 'main', index: 0 }],     // 7: buy
    [{ node: 'Prepare Sell Query', type: 'main', index: 0 }],       // 8: sell
    [{ node: 'Prepare Stat Query', type: 'main', index: 0 }],       // 9: stat
    [{ node: 'CoinGecko Rec Markets', type: 'main', index: 0 }],    // 10: rec
    [{ node: 'Unknown Command', type: 'main', index: 0 }],          // 11: fallback
  ] },

  // /start
  'Build Start':             { main: [[{ node: 'Send Start', type: 'main', index: 0 }]] },
  // /help
  'Build Help':              { main: [[{ node: 'Send Help', type: 'main', index: 0 }]] },

  // /coin deep analysis
  'CoinGecko Search':        { main: [[{ node: 'Extract Coin ID', type: 'main', index: 0 }]] },
  'Extract Coin ID':         { main: [
    [{ node: 'CoinGecko Market Chart', type: 'main', index: 0 }],
    [{ node: 'Send Coin Error', type: 'main', index: 0 }],
  ] },
  'CoinGecko Market Chart':  { main: [[{ node: 'Fetch BTC Gate', type: 'main', index: 0 }]] },
  'Fetch BTC Gate':          { main: [[{ node: 'BTC Gate', type: 'main', index: 0 }]] },
  'BTC Gate':                { main: [[{ node: 'Coin Technical', type: 'main', index: 0 }]] },
  'Coin Technical':          { main: [[{ node: 'Fetch Google News', type: 'main', index: 0 }]] },
  'Fetch Google News':       { main: [[{ node: 'Parse News', type: 'main', index: 0 }]] },
  'Parse News':              { main: [[{ node: 'Prepare Read Prev', type: 'main', index: 0 }]] },
  'Prepare Read Prev':       { main: [[{ node: 'Read Previous Analysis', type: 'main', index: 0 }]] },
  'Read Previous Analysis':  { main: [[{ node: 'Parse Previous Analysis', type: 'main', index: 0 }]] },
  'Parse Previous Analysis': { main: [[{ node: 'Prepare Gemini Coin Prompt', type: 'main', index: 0 }]] },
  'Prepare Gemini Coin Prompt': { main: [[{ node: 'Gemini Coin Research', type: 'main', index: 0 }]] },
  'Gemini Coin Research':    { main: [[{ node: 'Build Coin Report', type: 'main', index: 0 }]] },
  'Build Coin Report':       { main: [
    [
      { node: 'Send Coin Report', type: 'main', index: 0 },
      { node: 'Prepare Save Coin', type: 'main', index: 0 }
    ]
  ] },
  'Prepare Save Coin':       { main: [[{ node: 'Save Coin Analysis', type: 'main', index: 0 }]] },

  // /ask with live google news + memory
  'Fetch Ask News':          { main: [[{ node: 'Parse Ask News', type: 'main', index: 0 }]] },
  'Parse Ask News':          { main: [[{ node: 'Prepare Read Sessions', type: 'main', index: 0 }]] },
  'Prepare Read Sessions':   { main: [[{ node: 'Read Recent Sessions', type: 'main', index: 0 }]] },
  'Read Recent Sessions':    { main: [[{ node: 'Build Ask With Context', type: 'main', index: 0 }]] },
  'Build Ask With Context':  { main: [[{ node: 'Gemini Ask', type: 'main', index: 0 }]] },
  'Gemini Ask':              { main: [[{ node: 'Format Ask Answer', type: 'main', index: 0 }]] },
  'Format Ask Answer':       { main: [
    [
      { node: 'Send Ask', type: 'main', index: 0 },
      { node: 'Prepare Save Ask', type: 'main', index: 0 }
    ]
  ] },
  'Prepare Save Ask':        { main: [[{ node: 'Save Ask Session', type: 'main', index: 0 }]] },

  // /portfolio (Dynamic)
  'Prepare List Positions':   { main: [[{ node: 'Query List Positions', type: 'main', index: 0 }]] },
  'Query List Positions':     { main: [[{ node: 'Process Portfolio Check', type: 'main', index: 0 }]] },
  'Process Portfolio Check':  { main: [[{ node: 'Has Active Positions?', type: 'main', index: 0 }]] },
  'Has Active Positions?':    { main: [
    [{ node: 'Fetch Portfolio Prices', type: 'main', index: 0 }],
    [{ node: 'Send Empty Portfolio', type: 'main', index: 0 }],
  ] },
  'Fetch Portfolio Prices':   { main: [[{ node: 'Format Dynamic Portfolio', type: 'main', index: 0 }]] },
  'Format Dynamic Portfolio': { main: [[{ node: 'Send Dynamic Portfolio', type: 'main', index: 0 }]] },

  // /market
  'CoinGecko Markets':       { main: [[{ node: 'Format Market', type: 'main', index: 0 }]] },
  'Format Market':           { main: [[{ node: 'Send Market', type: 'main', index: 0 }]] },

  // /history
  'Read History':            { main: [[{ node: 'Build History', type: 'main', index: 0 }]] },
  'Build History':           { main: [[{ node: 'Send History', type: 'main', index: 0 }]] },

  // unknown
  'Unknown Command':         { main: [[{ node: 'Send Unknown', type: 'main', index: 0 }]] },

  // /buy
  'CoinGecko Search Buy':     { main: [[{ node: 'Extract Buy Coin', type: 'main', index: 0 }]] },
  'Extract Buy Coin':         { main: [[{ node: 'Is Buy Found?', type: 'main', index: 0 }]] },
  'Is Buy Found?':            { main: [
    [{ node: 'Fetch Buy Chart', type: 'main', index: 0 }],
    [{ node: 'Send Buy Error', type: 'main', index: 0 }],
  ] },
  'Fetch Buy Chart':          { main: [[{ node: 'Prepare Buy Exec', type: 'main', index: 0 }]] },
  'Prepare Buy Exec':         { main: [[{ node: 'Execute Buy DB', type: 'main', index: 0 }]] },
  'Execute Buy DB':           { main: [[{ node: 'Format Buy Response', type: 'main', index: 0 }]] },
  'Format Buy Response':      { main: [[{ node: 'Send Buy Confirm', type: 'main', index: 0 }]] },

  // /sell
  'Prepare Sell Query':       { main: [[{ node: 'Execute Sell Query', type: 'main', index: 0 }]] },
  'Execute Sell Query':       { main: [[{ node: 'Process Sell Check', type: 'main', index: 0 }]] },
  'Process Sell Check':       { main: [[{ node: 'Is Sell Found?', type: 'main', index: 0 }]] },
  'Is Sell Found?':           { main: [
    [{ node: 'Fetch Sell Price', type: 'main', index: 0 }],
    [{ node: 'Send Sell Error', type: 'main', index: 0 }],
  ] },
  'Fetch Sell Price':         { main: [[{ node: 'Prepare Close Position', type: 'main', index: 0 }]] },
  'Prepare Close Position':   { main: [[{ node: 'Execute Close Command', type: 'main', index: 0 }]] },
  'Execute Close Command':    { main: [[{ node: 'Format Sell Response', type: 'main', index: 0 }]] },
  'Format Sell Response':      { main: [[{ node: 'Send Sell Report', type: 'main', index: 0 }]] },

  // /stat
  'Prepare Stat Query':       { main: [[{ node: 'Execute Stat Query', type: 'main', index: 0 }]] },
  'Execute Stat Query':       { main: [[{ node: 'Process Stat Position', type: 'main', index: 0 }]] },
  'Process Stat Position':    { main: [[{ node: 'Is Stat Found?', type: 'main', index: 0 }]] },
  'Is Stat Found?':           { main: [
    [{ node: 'Fetch Stat Chart', type: 'main', index: 0 }],
    [{ node: 'Send Stat Error', type: 'main', index: 0 }],
  ] },
  'Fetch Stat Chart':         { main: [[{ node: 'Build Stat Report', type: 'main', index: 0 }]] },
  'Build Stat Report':        { main: [[{ node: 'Send Stat Report', type: 'main', index: 0 }]] },

  // /rec
  'CoinGecko Rec Markets':    { main: [[{ node: 'Format Rec Message', type: 'main', index: 0 }]] },
  'Format Rec Message':       { main: [[{ node: 'Send Rec Message', type: 'main', index: 0 }]] },

  // Cron Alert
  'Cron Every 2h':            { main: [[{ node: 'Config Cron', type: 'main', index: 0 }]] },
  'Config Cron':              { main: [[{ node: 'Exec Check Alerts', type: 'main', index: 0 }]] },
  'Exec Check Alerts':        { main: [[{ node: 'Format Cron Alerts', type: 'main', index: 0 }]] },
  'Format Cron Alerts':       { main: [[{ node: 'Has Alerts?', type: 'main', index: 0 }]] },
  'Has Alerts?':              { main: [
    [{ node: 'Send Cron Alert', type: 'main', index: 0 }],
    [],
  ] },
};

const workflow = {
  id: 'RzqHFpZWsPL7CsM1',
  name: 'Luna Hernandez — Realtime Webhook Assistant',
  nodes,
  pinData: {},
  connections,
  active: false,
  settings: {
    executionOrder: 'v1',
    timezone: 'Asia/Jakarta',
    saveManualExecutions: true,
    saveExecutionProgress: false,
    saveDataErrorExecution: 'last',
    saveDataSuccessExecution: 'all',
  },
  versionId: 'B9000000-0000-4000-8000-000000000006',
  meta: { templateCredsSetupCompleted: true },
  tags: [],
};

const jsonOutput = JSON.stringify(workflow, null, 2) + '\n';
writeFileSync('/home/nothrovo/Projects/Midas/midas-bot.n8n.json', jsonOutput);
writeFileSync('/home/nothrovo/Projects/Midas/docker/n8n-data/midas-bot.n8n.json', jsonOutput);

console.log('midas-bot.n8n.json generated — ' + nodes.length + ' nodes, ' + Object.keys(connections).length + ' connections (Full Portfolio & Recommendation Suite)');
