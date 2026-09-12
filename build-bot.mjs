import { writeFileSync, copyFileSync } from 'node:fs';
import { parseIdrAmount } from './lib/parse-idr-amount.mjs';

const PARSE_IDR_AMOUNT_SOURCE = parseIdrAmount.toString();

// ═══════════════════════════════════════════════════════════════
// KODE HELPER MATEMATIKA TEKNIKAL
// ═══════════════════════════════════════════════════════════════
const TECH_SHARED = String.raw`
const clamp = (x, lo = -1, hi = 1) => Math.max(lo, Math.min(hi, x));
function fmtPrice(val) {
  if (val == null || !Number.isFinite(Number(val))) return 'Rp 0';
  const v = Number(val);
  const abs = Math.abs(v);
  let maxDigits = 0;
  if (abs < 0.0001) maxDigits = 8;
  else if (abs < 0.01) maxDigits = 6;
  else if (abs < 1) maxDigits = 4;
  else if (abs < 1000) maxDigits = 2;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: (maxDigits > 0 && abs < 1) ? 2 : 0,
    maximumFractionDigits: maxDigits,
  }).format(v);
}
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
  const fast = 12, slow = 26, sig = 9;
  if (vals.length < slow + sig) return { line: 0, signal: 0, histogram: 0 };
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
if (prices.length < 35) throw new Error(assetSymbol + ': data tidak cukup (min 35 titik harian)');

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

// Kalkulasi Dynamic TP dan SL berbasis ATR (Volatilitas) & R:R terukur
const atrPct = currentPrice > 0 ? (atrVal / currentPrice) * 100 : 3.0;
const dynSlPct = Number(Math.min(8.5, Math.max(4.5, 1.8 * atrPct)).toFixed(1));
const rrRatio = (trendDir > 0 && adxVal > 25) ? 2.5 : 2.0;
const dynTpPct = Number(Math.max(10.0, Math.min(25.0, dynSlPct * rrRatio)).toFixed(1));
const dynTpPrice = currentPrice * (1 + dynTpPct / 100);
const dynSlPrice = currentPrice * (1 - dynSlPct / 100);

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
  atrPct: Number(atrPct.toFixed(2)),
  dynSlPct,
  dynTpPct,
  dynTpPrice,
  dynSlPrice,
  rrRatio: Number(rrRatio.toFixed(1)),
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
    geminiApiKey: 'YOUR_GEMINI_API_KEY',
    geminiModel: 'gemini-3.5-flash-lite',
    quoteCurrency: 'idr',
    marketDays: 90,
    technicalWeights: { rsi: 0.25, macd: 0.30, bollinger: 0.25, volatility: 0.10, trend: 0.10 },
    thresholds: { buy: 0.20, sell: -0.20 },
  },
}];`,

  parseWebhook: String.raw`${PARSE_IDR_AMOUNT_SOURCE}

const cfg = $('Config').first().json;
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
if (command === 'berita' || command === 'kabar') command = 'news';
if (command === 'risk' || command === 'resiko') command = 'risk';

let coinArg = '', modalArg = 100000, porsiArg = '100%', invalidModal = null;
if (args) {
  const parts = args.split(/\s+/);
  coinArg = parts[0] ? parts[0].trim().toUpperCase() : '';
  if (parts[1]) {
    porsiArg = parts[1].trim();
    const parsedModal = parseIdrAmount(parts[1]);
    if (parsedModal != null) {
      modalArg = parsedModal;
    } else {
      invalidModal = parts[1].trim();
    }
  }
}

return [{ json: {
  command,
  args,
  coinArg,
  modalArg,
  porsiArg,
  invalidModal,
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
  'Asisten decision support & riset multi-market personal lo.',
  '',
  'Gue bantu lo menganalisis crypto spot, saham AS, dan Binance USD-M perpetual sebelum mengambil keputusan.',
  '',
  '🚀 <b>Fitur Utama Luna Hernandez Bot:</b>',
  '',
  '1️⃣ <b>Deep Analysis Koin</b> <code>/coin &lt;simbol&gt;</code>',
  'Hitung teknikal komprehensif (RSI, MACD, BB, ADX, SMA20), <b>browsing 10 berita Google News live</b>, histori SQLite, & dirangkum AI Gemini.',
  '👉 <i>Coba:</i> <code>/coin sol</code>, <code>/coin aero</code>, <code>/coin btc</code>',
  '',
  '2️⃣ <b>Analisis Saham AS</b> <code>/stock &lt;ticker&gt;</code>',
  'Multi-timeframe 1H/4H/1D/1W, relative strength vs SPY, fundamental SEC, DCF tiga skenario, dan berita 48 jam.',
  '👉 <i>Coba:</i> <code>/stock AAPL</code>, <code>/stock NVDA</code>',
  '',
  '3️⃣ <b>Analisis Futures Perpetual</b> <code>/futures &lt;pair&gt;</code>',
  'Multi-timeframe 15m/1H/4H/1D, mark/index basis, funding, open interest, dan crowding. <b>Analysis-only, tidak mengeksekusi order.</b>',
  '👉 <i>Coba:</i> <code>/futures BTCUSDT</code>, <code>/futures ETH</code>',
  '',
  '4️⃣ <b>Kalkulator Risiko & Tactical Sizing</b> <code>/risk &lt;simbol&gt; [modal]</code>',
  'Hitung skor risiko 1-10, downside ke SMA20/Lower BB, TP/SL dinamis (R:R min 1:2.0), & kalkulasi modal nominal untuk risk-taker.',
  '👉 <i>Coba:</i> <code>/risk sol 200k</code>, <code>/risk aero</code>',
  '',
  '5️⃣ <b>Riset Bebas Live + Memori</b> <code>/ask &lt;pertanyaan&gt;</code>',
  'Tanya kondisi pasar atau sentimen. Bot <b>browsing Google News live</b> + <b>ingat percakapan sebelumnya</b>.',
  '👉 <i>Coba:</i> <code>/ask bagaimana peluang swing trading minggu ini?</code>',
  '',
  '6️⃣ <b>Radar Pasar & Rekomendasi</b>',
  '• <code>/rec coin|stock|futures</code> — 3 kandidat deterministik per kelas aset',
  '• <code>/news &lt;simbol&gt;</code> — Headline berita live & analisis sentimen AI (e.g. <code>/news sol</code>)',
  '• <code>/market</code> — Top 5 gainers & losers 24 jam dalam IDR',
  '',
  '7️⃣ <b>Manajemen Posisi & Portofolio Crypto</b>',
  '• <code>/buy &lt;simbol&gt; [modal]</code> — Catat beli & pantau ketat (e.g. <code>/buy sol 150k</code>)',
  '• <code>/stat &lt;simbol&gt;</code> — Evaluasi posisi: PnL, rekomendasi Hold/TP/SL/DCA',
  '• <code>/sell &lt;simbol&gt;</code> — Tutup posisi, hitung PnL, & unlist dari pantauan',
  '• <code>/portfolio</code> — Ringkasan koin aktif, total modal, & PnL portofolio',
  '• <code>/history [simbol]</code> — Cek riwayat analisis semua kelas aset',
  '',
  '🔔 <i>Auto-Alert: Bot otomatis cek setiap 30 menit dan kirim notifikasi saat TP/SL tersentuh!</i>',
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
  '• <code>/rec coin|stock|futures</code> — Radar 3 kandidat per kelas aset (<code>/rec</code> = coin)',
  '• <code>/risk &lt;simbol&gt; [modal]</code> — Kalkulator risiko, downside, & sizing modal',
  '• <code>/news &lt;simbol&gt;</code> — Headline berita live terhangat & analisis sentimen AI',
  '• <code>/coin &lt;simbol&gt;</code> — Deep analysis: RSI, MACD, Tren, Berita Live, & AI',
  '• <code>/stock &lt;ticker&gt;</code> — Saham AS: multi-timeframe, SEC fundamental, DCF skenario, & berita',
  '• <code>/futures &lt;pair&gt;</code> — Binance perpetual: mark/index, funding, open interest, & multi-timeframe',
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

  // ── /stock and /futures (analysis-only) ──
  prepareMarketCommand: String.raw`const update = $('Parse Incoming Message').first().json;
const mode = String(update.command || '').toLowerCase();
const raw = String(update.args || '').trim();
if (!/^(stock|futures)$/.test(mode)) throw new Error('Unsupported market-analysis command');
// Bersihkan prefix bursa seperti "NASDAQ:", "NYSE:", dll jika ada
const cleaned = raw.replace(/^(?:NASDAQ|NYSE|AMEX|BATS|ARCA|IDX)\s*:\s*/i, '').trim();
let symbol = (cleaned.split(/\s+/)[0] || '').toUpperCase();
if (mode === 'futures') symbol = symbol.replace(/[\s/_-]/g, '');
const valid = mode === 'stock'
  ? /^[A-Z][A-Z0-9.-]{0,9}$/.test(symbol)
  : /^[A-Z0-9]{2,20}$/.test(symbol);
if (!valid) symbol = '';
const dbCmd = 'node /home/node/.n8n/market_analysis_cli.mjs ' + mode + ' ' + symbol;
return [{ json: {
  ...update,
  marketMode: mode,
  marketSymbol: symbol,
  dbCmd,
} }];`,

  parseMarketAnalysisResult: String.raw`const ctx = $('Prepare Market Command').first().json;
const rawInput = $input.first().json;
const rawText = String(rawInput.stdout || rawInput.error || rawInput.stderr || '').trim();
let parsed = null;
try {
  const match = rawText.match(/\{[\s\S]*\}/);
  if (match) parsed = JSON.parse(match[0]);
} catch {}
if (!parsed || typeof parsed !== 'object') {
  parsed = { ok: false, error: { code: 'INVALID_PROVIDER_RESPONSE', message: 'CLI tidak mengembalikan JSON yang valid.', retryable: false } };
}
return [{ json: {
  ...ctx,
  analysisOk: parsed?.ok === true && parsed?.analysis != null,
  analysis: parsed?.analysis || null,
  marketError: parsed?.error || null,
} }];`,

  prepareGeminiMarketPrompt: String.raw`const ctx = $('Parse Market Analysis Result').first().json;
const analysis = ctx.analysis;
const cfg = $('Config').first().json;
const isStock = analysis.assetClass === 'stock';
const newsText = (analysis.news || []).length
  ? analysis.news.map((item, index) => (index + 1) + '. ' + item.title + ' (' + item.publishedAt + ')').join('\n')
  : 'Tidak ada headline segar yang lolos filter 48 jam.';
const numericContext = isStock ? [
  'Technical score: ' + analysis.technical.score + '/100',
  'Fundamental score: ' + (analysis.fundamental.score == null ? 'N/A' : analysis.fundamental.score + '/100'),
  'Final score: ' + analysis.finalScore + '/100',
  'Verdict deterministik: ' + analysis.verdict,
  'Risk score: ' + analysis.riskScore + '/10',
  'MTF alignment: ' + analysis.technical.multiTimeframe.alignment,
  'Revenue growth: ' + (analysis.fundamental.revenueGrowthPct ?? 'N/A') + '%',
  'Net margin: ' + (analysis.fundamental.netMarginPct ?? 'N/A') + '%',
  'FCF margin: ' + (analysis.fundamental.freeCashFlowMarginPct ?? 'N/A') + '%',
  'Relative strength 20d vs SPY: ' + (analysis.technical.relativeStrength20d == null ? 'N/A' : (analysis.technical.relativeStrength20d * 100).toFixed(2) + '%'),
].join('\n') : [
  'Technical score: ' + analysis.technical.score + '/100',
  'Verdict deterministik: ' + analysis.verdict,
  'Direction enum: ' + analysis.direction,
  'Risk score: ' + analysis.riskScore + '/10',
  'MTF alignment: ' + analysis.technical.multiTimeframe.alignment,
  'Mark price: ' + analysis.derivatives.markPrice,
  'Index price: ' + analysis.derivatives.indexPrice,
  'Basis: ' + analysis.derivatives.basisPct + '%',
  'Funding: ' + analysis.derivatives.funding.latestRatePct + '% (percentile ' + analysis.derivatives.funding.percentile + ')',
  'OI regime: ' + analysis.derivatives.openInterest.regime + ' | OI change: ' + (analysis.derivatives.openInterest.changePct ?? 'N/A') + '%',
  'Crowding: ' + analysis.derivatives.crowding,
].join('\n');
const prompt = [
  'Kamu Luna Hernandez, analis pasar untuk trader Indonesia.',
  'Jenis aset: ' + analysis.assetClass + ' | Simbol: ' + analysis.symbol + ' | Provider: ' + analysis.provider,
  'Timestamp data: ' + analysis.asOf + ' | Delayed: ' + analysis.delayed,
  '',
  'DATA DETERMINISTIK (sumber kebenaran):',
  numericContext,
  '',
  'HEADLINE SEGAR:',
  newsText,
  '',
  'Tulis maksimal 650 karakter: hubungan berita dengan setup, risiko utama, dan satu skenario konservatif serta agresif.',
  'DILARANG mengubah angka, direction, score, level, atau verdict deterministik. Jangan menciptakan data yang tidak tersedia.',
  'Bahasa Indonesia santai-profesional. Tidak boleh memberi instruksi order otomatis.',
].join('\n');
const geminiBody = {
  contents: [{ parts: [{ text: prompt }] }],
  generationConfig: { maxOutputTokens: 1200, temperature: 0.2, thinkingConfig: { thinkingBudget: 384 } },
};
return [{ json: { ...ctx, geminiBody } }];`,

  buildMarketReport: String.raw`const response = $input.first().json;
const ctx = $('Prepare Gemini Market Prompt').first().json;
const analysis = ctx.analysis;
const cfg = $('Config').first().json;
const parts = response.candidates?.[0]?.content?.parts || [];
let aiAnalysis = response.error
  ? '⚠️ Narasi Gemini tidak tersedia; angka deterministik tetap valid.'
  : parts.map(part => part.text || '').join('').trim();
if (!aiAnalysis) aiAnalysis = '⚠️ Narasi Gemini tidak tersedia; angka deterministik tetap valid.';
aiAnalysis = aiAnalysis
  .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
  .replace(/\*([^*]+)\*/g, '$1')
  .replace(/\*/g, '')
  .slice(0, 1200);
const analysisVerdict = analysis.verdict;
const verdictIcon = analysisVerdict === 'BUY' ? '🟢' : analysisVerdict === 'SELL' ? '🔴' : '🟡';
const formatNumber = (value, digits = 2) => value == null || !Number.isFinite(Number(value)) ? 'N/A' : Number(value).toLocaleString('en-US', { maximumFractionDigits: digits });
let lines;
if (analysis.assetClass === 'stock') {
  const daily = analysis.technical.timeframes['1d'];
  const fundamental = analysis.fundamental || {};
  const dcf = fundamental.dcfScenarios;
  lines = [
    verdictIcon + ' <b>' + analysis.companyName + ' (' + analysis.symbol + ') — ' + analysisVerdict + '</b>',
    '💵 Harga: $' + formatNumber(analysis.price, 4) + ' | Data IEX: DELAYED | as-of ' + analysis.asOf,
    '📊 Skor: Teknikal ' + analysis.technical.score + '/100 | Fundamental ' + (fundamental.score ?? 'N/A') + '/100 | Final ' + analysis.finalScore + '/100',
    '🧭 MTF: ' + analysis.technical.multiTimeframe.alignment + ' | 1H ' + analysis.technical.timeframes['1h'].score + ' · 4H ' + analysis.technical.timeframes['4h'].score + ' · 1D ' + daily.score + ' · 1W ' + analysis.technical.timeframes['1w'].score,
    '📈 RSI ' + daily.indicators.rsi14 + ' | ADX ' + daily.indicators.adx14 + ' | ATR ' + daily.indicators.atrPct + '% | Vol ' + formatNumber(daily.indicators.historicalVolatilityAnnualized == null ? null : daily.indicators.historicalVolatilityAnnualized * 100, 1) + '%',
    '🎯 Support $' + formatNumber(daily.levels.support, 4) + ' | Resistance $' + formatNumber(daily.levels.resistance, 4) + ' | R:R 1:' + daily.levels.riskRewardRatio,
    '🏢 Revenue growth ' + formatNumber(fundamental.revenueGrowthPct) + '% | Net margin ' + formatNumber(fundamental.netMarginPct) + '% | FCF margin ' + formatNumber(fundamental.freeCashFlowMarginPct) + '%',
    '🧾 Current ratio ' + formatNumber(fundamental.currentRatio) + ' | Liabilities/Equity ' + formatNumber(fundamental.liabilitiesToEquity) + ' | P/E ' + formatNumber(fundamental.priceToEarnings),
    dcf ? '🧮 DCF indikatif: Bear $' + formatNumber(dcf.bear.fairValuePerShare, 2) + ' · Base $' + formatNumber(dcf.base.fairValuePerShare, 2) + ' · Bull $' + formatNumber(dcf.bull.fairValuePerShare, 2) : '🧮 DCF: N/A karena komponen SEC belum lengkap',
    '⚠️ Risk score: ' + analysis.riskScore + '/10 | Market open: ' + (analysis.marketSession.isOpen ? 'YA' : 'TIDAK'),
  ];
} else {
  const derivative = analysis.derivatives;
  const h4 = analysis.technical.timeframes['4h'];
  lines = [
    verdictIcon + ' <b>' + analysis.symbol + ' PERPETUAL — ' + analysisVerdict + '</b>',
    '💵 Mark ' + formatNumber(derivative.markPrice, 6) + ' | Index ' + formatNumber(derivative.indexPrice, 6) + ' USDT | as-of ' + analysis.asOf,
    '📊 Teknikal ' + analysis.technical.score + '/100 | Direction ' + analysis.direction + ' | Risk ' + analysis.riskScore + '/10',
    '🧭 MTF: ' + analysis.technical.multiTimeframe.alignment + ' | 15m ' + analysis.technical.timeframes['15m'].score + ' · 1H ' + analysis.technical.timeframes['1h'].score + ' · 4H ' + h4.score + ' · 1D ' + analysis.technical.timeframes['1d'].score,
    '📈 RSI 4H ' + h4.indicators.rsi14 + ' | ADX ' + h4.indicators.adx14 + ' | ATR ' + h4.indicators.atrPct + '%',
    '🧲 Basis ' + derivative.basisPct + '% | Funding ' + derivative.funding.latestRatePct + '% | Percentile ' + derivative.funding.percentile,
    '🏗 OI ' + derivative.openInterest.regime + ' | ΔOI ' + formatNumber(derivative.openInterest.changePct, 2) + '% | Crowding ' + derivative.crowding,
    '🎯 Support ' + formatNumber(h4.levels.support, 6) + ' | Resistance ' + formatNumber(h4.levels.resistance, 6) + ' | R:R 1:' + h4.levels.riskRewardRatio,
    '⛔ Analysis-only: tidak ada order atau estimasi liquidation palsu.',
  ];
}
const message = [
  ...lines,
  '',
  '🤖 <b>Sintesis berita (tidak mengubah angka):</b>',
  aiAnalysis,
  '',
  '⚠️ <i>Decision support only.</i>',
].join('\n');
const record = {
  assetClass: analysis.assetClass,
  provider: analysis.provider,
  symbol: analysis.symbol,
  exchange: analysis.exchange,
  currency: analysis.currency,
  timeframe: 'multi',
  asOf: analysis.asOf,
  delayed: analysis.delayed,
  technicalScore: analysis.technical.score,
  fundamentalScore: analysis.fundamental?.score ?? null,
  sentimentScore: analysis.sentiment?.score ?? 0,
  riskScore: analysis.riskScore,
  verdict: analysisVerdict,
  summary: aiAnalysis.slice(0, 500),
  payload: analysis,
};
return [{ json: {
  telegramMessage: message,
  chatId: cfg.telegramChatId,
  botToken: cfg.botToken,
  analysisRecord: record,
} }];`,

  prepareSaveMarket: String.raw`const input = $input.first().json;
const encoded = Buffer.from(JSON.stringify(input.analysisRecord)).toString('base64url');
const dbCmd = 'node /home/node/.n8n/market_analysis_cli.mjs save ' + encoded;
return [{ json: { ...input, dbCmd } }];`,

  buildMarketError: String.raw`const ctx = $('Parse Market Analysis Result').first().json;
const cfg = $('Config').first().json;
const error = ctx.marketError || {};
const messages = {
  INVALID_SYMBOL: 'Simbol tidak valid. Contoh: <code>/stock AAPL</code> atau <code>/futures BTCUSDT</code>.',
  CONFIG_MISSING: 'Konfigurasi Alpaca belum lengkap. Isi ALPACA_API_KEY_ID dan ALPACA_API_SECRET di file .env.',
  INSUFFICIENT_DATA: 'Candle tertutup belum cukup untuk menghitung indikator secara konsisten.',
  RATE_LIMITED: 'Provider sedang membatasi permintaan. Tunggu sebentar lalu coba lagi.',
  ALPACA_UNAVAILABLE: 'Data saham Alpaca sedang tidak tersedia.',
  BINANCE_UNAVAILABLE: 'Data Binance Futures sedang tidak tersedia.',
  PROVIDER_HTTP_ERROR: 'Provider menolak permintaan data. Periksa simbol atau coba lagi nanti.',
  PROVIDER_UNAVAILABLE: 'Respons provider tidak dapat diproses. Coba lagi setelah beberapa saat.',
};
const detail = messages[error.code] || 'Analisis gagal karena data provider tidak lengkap atau tidak valid.';
const retry = error.retryable ? '\n<i>Gangguan ini kemungkinan sementara.</i>' : '';
return [{ json: {
  telegramMessage: '❌ <b>Market analysis gagal</b> [' + (error.code || 'UNKNOWN') + ']\n' + detail + retry,
  chatId: cfg.telegramChatId,
  botToken: cfg.botToken,
} }];`,

  // ── /coin ──
  extractCoinId: String.raw`const data = $input.first().json;
const update = $('Parse Incoming Message').first().json;
const cfg = $('Config').first().json;
const query = update.args.toLowerCase().trim();
const coins = data.coins || [];

// Prioritaskan koin dengan market cap terbesar (anti-token scam/duplikat ticker)
coins.sort((a, b) => {
  const ra = (a.market_cap_rank != null && a.market_cap_rank > 0) ? a.market_cap_rank : 999999;
  const rb = (b.market_cap_rank != null && b.market_cap_rank > 0) ? b.market_cap_rank : 999999;
  return ra - rb;
});

let coin = coins.find(c => c.symbol?.toLowerCase() === query);
if (!coin) coin = coins.find(c => c.name?.toLowerCase() === query);

if (!coin) {
  return [{ json: {
    __error: true,
    telegramMessage: '❌ Koin <b>' + query.toUpperCase() + '</b> tidak ditemukan di pasar CoinGecko.\nPastikan simbol tepat (contoh: <code>/coin sol</code>, <code>/coin btc</code>, <code>/coin aero</code>).',
    chatId: cfg.telegramChatId, botToken: cfg.botToken,
  }}];
}
return [{ json: {
  coinId: coin.id,
  coinSymbol: coin.symbol.toUpperCase(),
  coinName: coin.name,
  marketCapRank: coin.market_cap_rank || 'N/A',
  command: update.command,
  args: update.args,
  chatId: cfg.telegramChatId,
  botToken: cfg.botToken,
}}];`,

  coinTechnical: TECH_SHARED + String.raw`
const marketChart = $('CoinGecko Market Chart').first().json || {};
const coinCtx = $('Extract Coin ID').first().json;
const assetSymbol = coinCtx.coinSymbol || 'Koin';
const cfg = $('Config').first().json;

if (coinCtx.__error) {
  return [{ json: {
    technicalOk: false,
    telegramMessage: coinCtx.telegramMessage,
    chatId: coinCtx.chatId || cfg.telegramChatId,
    botToken: coinCtx.botToken || cfg.botToken,
  } }];
}

const rawPrices = marketChart.prices || [];
if (!Array.isArray(rawPrices) || rawPrices.length === 0) {
  const isRateLimit = marketChart.status?.error_code === 429 || String(marketChart.error || '').toLowerCase().includes('rate');
  const msg = isRateLimit
    ? '⏳ Layanan data CoinGecko sedang padat (rate limit). Silakan tunggu sekitar 30 detik lalu coba lagi.'
    : '❌ Gagal mengambil riwayat harga untuk <b>' + assetSymbol + '</b> dari CoinGecko. Silakan coba lagi.';
  return [{ json: {
    technicalOk: false,
    telegramMessage: msg,
    chatId: cfg.telegramChatId,
    botToken: cfg.botToken,
  } }];
}

let calculated;
try {
  const runCalc = () => {
` + TECH_CALC + String.raw`
    return techResult;
  };
  calculated = runCalc();
} catch (err) {
  const isDataShort = err.message && err.message.includes('data tidak cukup');
  const msg = isDataShort
    ? '❌ Data candle harian <b>' + assetSymbol + '</b> belum cukup untuk dianalisis (minimal dibutuhkan 35 hari lilin harian untuk menghitung RSI, MACD, dan Bollinger Bands).'
    : '❌ Terjadi kesalahan saat menghitung teknikal <b>' + assetSymbol + '</b>: ' + err.message;
  return [{ json: {
    technicalOk: false,
    telegramMessage: msg,
    chatId: cfg.telegramChatId,
    botToken: cfg.botToken,
  } }];
}

const btcGate = $('BTC Gate').first().json;
return [{ json: { ...coinCtx, ...calculated, asset: coinCtx.coinSymbol, btcGate, technicalOk: true } }];`,

  parseNews: String.raw`const xml = ($input.first().json.data || '').toString();
const itemBlocks = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];
const now = Date.now();
const parsed = itemBlocks.map(m => {
  const c = m[1];
  const title = (c.match(/<title><!\[CDATA\[([\s\S]*?)\]\]>/) || c.match(/<title>([\s\S]*?)<\/title>/))?.[1] || '';
  const pubDateStr = c.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || '';
  const ts = pubDateStr ? new Date(pubDateStr).getTime() : 0;
  return {
    title: title.replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').trim(),
    pubDate: pubDateStr.slice(0, 16),
    ts: Number.isFinite(ts) ? ts : 0,
  };
}).filter(a => a.title.length > 5);

// Prioritaskan artikel terbaru (< 48 jam jika tersedia)
const recent = parsed.filter(a => a.ts > 0 && (now - a.ts) <= 48 * 3600 * 1000);
const older = parsed.filter(a => !(a.ts > 0 && (now - a.ts) <= 48 * 3600 * 1000));
const articles = [...recent, ...older].slice(0, 10);
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
let decision = ts > cfg.thresholds.buy ? 'BUY' : ts < cfg.thresholds.sell ? 'SELL' : 'HOLD';
if (decision === 'BUY' && btcG.btcGate === 'bearish') {
  decision = 'HOLD (BTC BEARISH)';
}
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
  'Target TP Dinamis (+' + (tech.dynTpPct || 12) + '%): Rp ' + new Intl.NumberFormat("id-ID").format(tech.dynTpPrice || 0),
  'Stop Loss Dinamis (-' + (tech.dynSlPct || 6) + '%): Rp ' + new Intl.NumberFormat("id-ID").format(tech.dynSlPrice || 0) + ' (Rasio R:R 1:' + (tech.rrRatio || 2.0) + ')',
  'Support Struktural: Rp ' + new Intl.NumberFormat("id-ID").format(tech.swingLow14 || 0) + ' (Swing Low 14 hari)',
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
  'Sinyal kuantitatif algoritma saat ini: ' + decision + ' (Skor: ' + ts.toFixed(2) + ', Tren: ' + trendLabel + ').',
  'Tulis analisis sentimen berita & validasi risiko untuk trader swing (maksimal 600 karakter):',
  '1. SENTIMEN BERITA: Jelaskan apakah berita live mendukung sinyal ' + decision + ' atau justru berlawanan/waspada.',
  '2. FAKTOR RISIKO: Sampaikan ancaman pasar objektif (BTC Gate, level overbought %B, atau katalis negatif).',
  '3. DUA SKENARIO SWING: Skenario Konservatif (tunggu konfirmasi support) vs Skenario Agresif (eksekusi terukur dengan SL ' + (tech.dynSlPct || 6) + '%).',
  '4. Bahasa Indonesia santai profesional, langsung ke poin, TANPA disclaimer panjang di akhir.',
].join('\n');

const geminiBody = {
  contents: [{ parts: [{ text: prompt }] }],
  generationConfig: { maxOutputTokens: 2000, temperature: 0.3, thinkingConfig: { thinkingBudget: 512 } },
};

return [{ json: { geminiBody, coinSymbol: tech.coinSymbol, chatId: cfg.telegramChatId, botToken: cfg.botToken } }];`,

  buildCoinReport: TECH_SHARED + String.raw`const resp = $input.first().json;
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

const signalStrength = Math.round(Math.abs(ts) * 100);
const price = fmtPrice(tech.currentPrice);

let prevLine = '';
if ((prevCtx.previousSessions || []).length > 0) {
  const last = prevCtx.previousSessions[0];
  const lastPriceFmt = fmtPrice(last.harga);
  const diffPct = last.harga > 0 ? ((tech.currentPrice - last.harga) / last.harga * 100).toFixed(1) : '0';
  prevLine = '\n📋 Analisis lalu (' + last.tanggal + '): ' + (last.keputusan || '-') + ' di ' + lastPriceFmt + ' (' + (diffPct >= 0 ? '+' : '') + diffPct + '%)';
}

const newsLine = (newsCtx.newsCount || 0) > 0
  ? '📰 Berita Live: ' + newsCtx.newsCount + ' artikel dianalisis'
  : '📰 Berita: tidak ada berita baru';

const trendIcon = tech.trendDir > 0 ? '📈' : tech.trendDir < 0 ? '📉' : '↔️';
const adxTag = (tech.adxVal || 0) > 25 ? 'ADX ' + tech.adxVal + ' (Kuat)' : 'ADX ' + (tech.adxVal || 0) + ' (Moderat)';
const btcIcon = btcGate.btcGate === 'bullish' ? '🟢' : btcGate.btcGate === 'bearish' ? '🔴' : '⚪';

const tpTarget = tech.dynTpPrice ? fmtPrice(tech.dynTpPrice) : '-';
const slTarget = tech.dynSlPrice ? fmtPrice(tech.dynSlPrice) : '-';
const rrText = tech.rrRatio ? tech.rrRatio.toFixed(1) : '2.0';
const exitGuide = '\n🎯 <b>Panduan Exit Dinamis (R:R 1:' + rrText + '):</b> Target TP (+' + (tech.dynTpPct || 12) + '%): ~' + tpTarget + ' | Stop Loss (-' + (tech.dynSlPct || 6) + '%): ~' + slTarget;

const msg = [
  decisionIcon + ' <b>' + tech.coinName + ' (' + tech.coinSymbol + ') — ' + decisionText + '</b>',
  'Kekuatan Sinyal: ' + signalStrength + '% | Data: ' + tech.dataPoints + ' hari' + prevLine,
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
  '🤖 <b>Sintesis Sentimen Berita & Narasi (AI):</b>',
  aiAnalysis,
  exitGuide,
  '',
  '💡 <i>Ketik <code>/risk ' + tech.coinSymbol.toLowerCase() + '</code> untuk kalkulator risiko & sizing modal.\n' +
  'Ketik <code>/buy ' + tech.coinSymbol.toLowerCase() + ' 150k</code> untuk mencatat beli & memantau koin ini.</i>\n' +
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

function fmt(val) {
  if (val == null || !Number.isFinite(Number(val))) return 'Rp 0';
  const v = Number(val);
  const abs = Math.abs(v);
  let maxDigits = 0;
  if (abs < 0.0001) maxDigits = 8;
  else if (abs < 0.01) maxDigits = 6;
  else if (abs < 1) maxDigits = 4;
  else if (abs < 1000) maxDigits = 2;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: (maxDigits > 0 && abs < 1) ? 2 : 0,
    maximumFractionDigits: maxDigits,
  }).format(v);
}

let totalModal = 0, pricedModal = 0, pricedNilai = 0, pricedCount = 0, hasStale = false;
const positionRows = [];

positions.forEach((pos, idx) => {
  const buyPrice = Number(pos.harga_beli);
  const modal = Number(pos.modal_idr);
  const livePrice = priceData[pos.coin_id]?.idr;
  const isLive = typeof livePrice === 'number' && livePrice > 0;

  totalModal += modal;

  if (isLive) {
    const currPrice = livePrice;
    const pnlPct = Number(((currPrice - buyPrice) / buyPrice * 100).toFixed(2));
    const pnlIdr = Math.round(modal * (pnlPct / 100));
    const currVal = modal + pnlIdr;

    pricedModal += modal;
    pricedNilai += currVal;
    pricedCount++;

    const isProfit = pnlPct >= 0;
    const icon = isProfit ? '🟢' : '🔴';

    positionRows.push([
      (idx + 1) + '️⃣ <b>' + pos.simbol + ' (' + pos.nama + ')</b>',
      '• Beli: ' + fmt(buyPrice) + ' | Sekarang: ' + fmt(currPrice) + ' <i>[LIVE]</i>',
      '• Modal: ' + fmt(modal) + ' (Nilai: ' + fmt(currVal) + ')',
      '• PnL: ' + icon + ' ' + (isProfit ? '+' : '') + pnlPct + '% (' + (isProfit ? '+' : '') + fmt(pnlIdr) + ')',
      '• TP: ' + fmt(pos.target_profit) + ' | SL: ' + fmt(pos.stop_loss),
    ].join('\n'));
  } else {
    hasStale = true;

    positionRows.push([
      (idx + 1) + '️⃣ <b>' + pos.simbol + ' (' + pos.nama + ')</b>',
      '• Beli: ' + fmt(buyPrice) + ' | Sekarang: ⚠️ <i>[Data API N/A]</i>',
      '• Modal: ' + fmt(modal),
      '• PnL: ⏳ <i>Menunggu pembaruan live feed</i>',
      '• TP: ' + fmt(pos.target_profit) + ' | SL: ' + fmt(pos.stop_loss),
    ].join('\n'));
  }
});

let summaryLines = [];
if (hasStale) {
  const pricedPnlPct = pricedModal > 0 ? Number(((pricedNilai - pricedModal) / pricedModal * 100).toFixed(2)) : 0;
  const pricedPnlIdr = pricedNilai - pricedModal;
  const isPricedProfit = pricedPnlIdr >= 0;
  const icon = isPricedProfit ? '🟢' : '🔴';

  summaryLines = [
    '────────────────────',
    '💵 <b>Total Modal Terdaftar:</b> ' + fmt(totalModal),
    '⚠️ <b>Status Valuasi:</b> Parsial (' + pricedCount + '/' + positions.length + ' koin live feed)',
    '📊 <b>Estimasi Nilai (Live Only):</b> ' + fmt(pricedNilai),
    '📈 <b>Floating PnL (Live Only):</b> ' + icon + ' ' + (isPricedProfit ? '+' : '') + pricedPnlPct + '% (' + (isPricedProfit ? '+' : '') + fmt(pricedPnlIdr) + ')',
    '⏳ <i>Catatan: Total PnL lengkap N/A karena harga ' + (positions.length - pricedCount) + ' koin sedang tidak tersedia dari feed API.</i>',
  ];
} else {
  const totalPnlPct = totalModal > 0 ? Number(((pricedNilai - pricedModal) / pricedModal * 100).toFixed(2)) : 0;
  const totalPnlIdr = pricedNilai - pricedModal;
  const isTotProfit = totalPnlIdr >= 0;
  const totIcon = isTotProfit ? '🟢' : '🔴';

  summaryLines = [
    '────────────────────',
    '💵 <b>Total Modal:</b> ' + fmt(totalModal),
    '📊 <b>Estimasi Nilai:</b> ' + fmt(pricedNilai),
    '📈 <b>Total Floating PnL:</b> ' + totIcon + ' ' + (isTotProfit ? '+' : '') + totalPnlPct + '% (' + (isTotProfit ? '+' : '') + fmt(totalPnlIdr) + ')',
  ];
}

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
  summaryLines.join('\n'),
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
let parsed;
try {
  parsed = JSON.parse(raw.split('\n').filter(Boolean).at(-1) || '{}');
} catch {
  parsed = { ok: false, sessions: [] };
}
const sessions = Array.isArray(parsed.sessions) ? parsed.sessions : [];
if (!sessions.length) {
  const msg = '📋 Belum ada riwayat analisis' + (update.args ? ' untuk ' + sym : '') + '.\n\nGunakan /coin, /stock, atau /futures untuk memulai analisis.';
  return [{ json: { telegramMessage: msg, chatId: cfg.telegramChatId, botToken: cfg.botToken } }];
}
const header = '📋 <b>Riwayat Analisis' + (update.args ? ' ' + sym : '') + '</b>\n\n';
const rows = sessions.slice(0, 10).map(s =>
  new Date(s.analyzedAt).toLocaleString('id-ID', { timeZone: cfg.timezone, dateStyle: 'short', timeStyle: 'short' }) +
  ' <b>' + s.symbol + '</b> [' + s.assetClass + '] ' +
  (s.verdict ? '→ ' + (s.verdict === 'BUY' ? '🟢 ' : s.verdict === 'SELL' ? '🔴 ' : '🟡 ') + s.verdict : '') +
  (s.technicalScore != null ? ' · T' + Number(s.technicalScore).toFixed(0) : '') +
  (s.summary ? '\n  <i>' + String(s.summary).slice(0, 80) + '</i>' : '')
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

if (update.invalidModal) {
  return [{ json: {
    found: false,
    telegramMessage: '❌ Nominal modal <b>' + update.invalidModal + '</b> tidak valid.\nContoh penggunaan: <code>/buy SOL 150k</code> atau <code>/buy BTC 200000</code>',
    chatId: cfg.telegramChatId, botToken: cfg.botToken,
  }}];
}

const coins = data.coins || [];

// Prioritaskan koin dengan market cap terbesar
coins.sort((a, b) => {
  const ra = (a.market_cap_rank != null && a.market_cap_rank > 0) ? a.market_cap_rank : 999999;
  const rb = (b.market_cap_rank != null && b.market_cap_rank > 0) ? b.market_cap_rank : 999999;
  return ra - rb;
});

let coin = coins.find(c => c.symbol?.toLowerCase() === query);
if (!coin) coin = coins.find(c => c.name?.toLowerCase() === query);

if (!coin) {
  return [{ json: {
    found: false,
    telegramMessage: '❌ Koin <b>' + query.toUpperCase() + '</b> tidak ditemukan di pasar CoinGecko.\nCoba periksa kembali simbol koinnya (contoh: SOL, SUI, AERO, BTC).',
    chatId: cfg.telegramChatId, botToken: cfg.botToken,
  }}];
}

return [{ json: {
  found: true,
  coinId: coin.id,
  coinSymbol: coin.symbol.toUpperCase(),
  coinName: coin.name,
  marketCapRank: coin.market_cap_rank || 'N/A',
  modalArg: update.modalArg || 100000,
  chatId: cfg.telegramChatId,
  botToken: cfg.botToken,
}}];`,

  prepareBuyExec: String.raw`const chartData = $input.first().json;
const rawPrices = chartData.prices || [];
const buyCtx = $('Extract Buy Coin').first().json;
const cfg = $('Config').first().json;

if (!rawPrices.length) {
  return [{ json: {
    hasPrice: false,
    telegramMessage: '❌ Gagal mengambil data harga pasar untuk <b>' + buyCtx.coinSymbol + '</b>. Silakan coba sesaat lagi.',
    chatId: buyCtx.chatId, botToken: buyCtx.botToken,
  }}];
}

const lastPrice = Number(rawPrices.at(-1)[1]);
if (!lastPrice || lastPrice <= 0 || !Number.isFinite(lastPrice)) {
  return [{ json: {
    hasPrice: false,
    telegramMessage: '❌ Harga pasar tidak valid atau 0 untuk <b>' + buyCtx.coinSymbol + '</b>.',
    chatId: buyCtx.chatId, botToken: buyCtx.botToken,
  }}];
}

// Hitung volatilitas harian & ATR dinamis
const daily = new Map();
for (const row of rawPrices) {
  if (!Array.isArray(row) || row.length < 2) continue;
  const ts = Number(row[0]), p = Number(row[1]);
  if (!Number.isFinite(ts) || !Number.isFinite(p) || p <= 0) continue;
  const d = new Date(ts).toISOString().slice(0, 10);
  if (!daily.has(d)) {
    daily.set(d, { high: p, low: p, close: p });
  } else {
    const it = daily.get(d);
    it.high = Math.max(it.high, p);
    it.low = Math.min(it.low, p);
    it.close = p;
  }
}
const series = [...daily.values()];
const highs = series.map(s => s.high);
const lows = series.map(s => s.low);
const closes = series.map(s => s.close);

let atrVal = lastPrice * 0.035;
if (highs.length >= 5) {
  const trs = [];
  for (let i = 1; i < highs.length; i++) {
    trs.push(Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i-1]), Math.abs(lows[i] - closes[i-1])));
  }
  const p = Math.min(14, trs.length);
  atrVal = trs.slice(-p).reduce((s, x) => s + x, 0) / p;
}

const atrPct = lastPrice > 0 ? (atrVal / lastPrice) * 100 : 3.5;
const slPct = Number(Math.min(8.5, Math.max(4.5, 1.8 * atrPct)).toFixed(1));
const tpPct = Number(Math.max(10.0, Math.min(25.0, slPct * 2.2)).toFixed(1));

const tpPrice = lastPrice * (1 + tpPct / 100);
const slPrice = lastPrice * (1 - slPct / 100);
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
  tpPct,
  slPct,
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
    telegramMessage: '❌ Gagal mencatat posisi: ' + (res?.message || res?.error || 'Unknown error'),
    chatId: cfg.telegramChatId, botToken: cfg.botToken,
  }}];
}

function fmt(val) {
  if (val == null || !Number.isFinite(Number(val))) return 'Rp 0';
  const v = Number(val);
  const abs = Math.abs(v);
  let maxDigits = 0;
  if (abs < 0.0001) maxDigits = 8;
  else if (abs < 0.01) maxDigits = 6;
  else if (abs < 1) maxDigits = 4;
  else if (abs < 1000) maxDigits = 2;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: (maxDigits > 0 && abs < 1) ? 2 : 0,
    maximumFractionDigits: maxDigits,
  }).format(v);
}

const tpP = res.tpPct || 12;
const slP = res.slPct || 6;
const rrText = (tpP / slP).toFixed(1);
const qtyText = res.totalQuantity ? (res.totalQuantity < 1 ? res.totalQuantity.toFixed(4) : res.totalQuantity.toLocaleString('id-ID', { maximumFractionDigits: 4 })) : '-';

let msg = '';
if (res.action === 'dca') {
  const isUp = res.actionType === 'DCA_AVERAGE_UP';
  const dcaLabel = isUp ? 'DCA Average Up (Pyramiding)' : 'DCA Average Down (Akumulasi Diskon)';
  msg = [
    '🔵 <b>' + dcaLabel + ': ' + res.simbol + ' (' + res.nama + ')</b>',
    '',
    '💰 Entry Baru: ' + fmt(res.entryBaru),
    '⚖️ <b>Harga Rata-Rata Baru:</b> ' + fmt(res.avgPrice),
    '📦 <b>Total Koin Dimiliki:</b> ' + qtyText + ' ' + res.simbol,
    '💵 Modal Ditambahkan: ' + fmt(res.modalBaru),
    '💼 <b>Total Modal Terakumulasi:</b> ' + fmt(res.totalModal),
    '',
    '🎯 Target Profit Baru (+' + tpP + '%): ' + fmt(res.tpPrice),
    '🛑 Stop Loss Baru (-' + slP + '%): ' + fmt(res.slPrice),
    '📐 Rasio R:R Baru: 1 : ' + rrText,
    '',
    '<i>Posisi diperbarui di /portfolio & dicatat ke ledger position_transactions!</i>',
  ].join('\n');
} else {
  msg = [
    '🟢 <b>Posisi Baru Terbuka: ' + res.simbol + ' (' + res.nama + ')</b>',
    '',
    '💰 Harga Beli: ' + fmt(res.avgPrice),
    '📦 <b>Koin Didapat:</b> ' + qtyText + ' ' + res.simbol,
    '💵 Modal Alokasi: ' + fmt(res.totalModal),
    '🎯 Target Profit Dinamis (+' + tpP + '%): ' + fmt(res.tpPrice),
    '🛑 Stop Loss Dinamis (-' + slP + '%): ' + fmt(res.slPrice),
    '📐 Rasio R:R Terukur: 1 : ' + rrText,
    '',
    'Koin kini aktif dipantau di /portfolio dan cron alert berkala.\nKetik <code>/stat ' + res.simbol + '</code> kapan saja untuk evaluasi posisi.',
  ].join('\n');
}

return [{ json: { telegramMessage: msg, chatId: cfg.telegramChatId, botToken: cfg.botToken } }];`,

  // ── /sell ──
  prepareSellQuery: String.raw`const update = $('Parse Incoming Message').first().json;
const cfg = $('Config').first().json;
const sym = (update.coinArg || '').toUpperCase().trim();
const porsiArg = update.porsiArg || '100%';

if (!sym) {
  const dbCmd = "node /home/node/.n8n/manage_positions.mjs get-active __NONE__";
  return [{ json: { sym: '', porsiArg, dbCmd, chatId: cfg.telegramChatId, botToken: cfg.botToken } }];
}

const dbCmd = "node /home/node/.n8n/manage_positions.mjs get-active " + sym;
return [{ json: { sym, porsiArg, dbCmd, chatId: cfg.telegramChatId, botToken: cfg.botToken } }];`,

  processSellCheck: String.raw`const raw = ($input.first().json.stdout || '').trim();
const sellInit = $('Prepare Sell Query').first().json;
const cfg = $('Config').first().json;

if (!sellInit.sym) {
  return [{ json: {
    found: false,
    telegramMessage: '❌ Masukkan simbol koin yang ingin ditutup.\nContoh: <code>/sell SOL</code> atau <code>/sell SOL 50%</code>',
    chatId: cfg.telegramChatId, botToken: cfg.botToken,
  }}];
}

let res = null;
try {
  res = JSON.parse(raw);
} catch (e) {}

if (res && res.ambiguous) {
  const list = (res.positions || []).map(p => '• <code>' + p.coin_id + '</code> (' + p.nama + ')').join('\n');
  return [{ json: {
    found: false,
    telegramMessage: '⚠️ <b>Simbol Ambigu: ' + sellInit.sym + '</b>\n\nDitemukan lebih dari 1 posisi aktif dengan simbol ini:\n' + list + '\n\nSilakan jalankan perintah dengan <code>coin_id</code> spesifik:\nContoh: <code>/sell ' + (res.positions[0]?.coin_id || 'coin_id') + ' ' + (sellInit.porsiArg || '') + '</code>',
    chatId: cfg.telegramChatId, botToken: cfg.botToken,
  }}];
}

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
  porsiArg: sellInit.porsiArg || '100%',
  coinId: res.position.coin_id,
  position: res.position,
  chatId: cfg.telegramChatId,
  botToken: cfg.botToken,
}}];`,

  prepareClosePosition: String.raw`const pData = $input.first().json;
const sellCtx = $('Process Sell Check').first().json;
const livePrice = pData[sellCtx.coinId]?.idr;
const porsi = sellCtx.porsiArg || '100%';

// Validasi harga live pasar — tolak eksekusi jika API gagal demi mencegah penutupan di harga stale
const validPrice = (typeof livePrice === 'number' && livePrice > 0) ? livePrice : 0;
const dbCmd = "node /home/node/.n8n/manage_positions.mjs sell " + sellCtx.sym + " " + validPrice + " " + porsi + " " + (sellCtx.coinId || '');
return [{ json: { dbCmd, currPrice: validPrice, sym: sellCtx.sym, coinId: sellCtx.coinId, porsi, chatId: sellCtx.chatId, botToken: sellCtx.botToken } }];`,

  formatSellResponse: String.raw`const raw = ($input.first().json.stdout || '').trim();
const cfg = $('Config').first().json;
let res = null;
try {
  res = JSON.parse(raw);
} catch (e) {}

if (!res || !res.success) {
  return [{ json: {
    telegramMessage: '⚠️ <b>Gagal Menutup Posisi</b>: ' + (res?.message || res?.error || raw.slice(0, 100)),
    chatId: cfg.telegramChatId, botToken: cfg.botToken,
  }}];
}

function fmt(val) {
  if (val == null || !Number.isFinite(Number(val))) return 'Rp 0';
  const v = Number(val);
  const abs = Math.abs(v);
  let maxDigits = 0;
  if (abs < 0.0001) maxDigits = 8;
  else if (abs < 0.01) maxDigits = 6;
  else if (abs < 1) maxDigits = 4;
  else if (abs < 1000) maxDigits = 2;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: (maxDigits > 0 && abs < 1) ? 2 : 0,
    maximumFractionDigits: maxDigits,
  }).format(v);
}

const isProfit = res.pnlPct >= 0;
const pnlIcon = isProfit ? '🟢' : '🔴';
const pnlWord = isProfit ? 'Untung' : 'Rugi';

let msg = '';
if (res.isPartial) {
  msg = [
    '✂️ <b>Take Profit Sebagian (Partial Close ' + res.portionPct + '%): ' + res.simbol + ' (' + res.nama + ')</b>',
    '',
    '📅 Tanggal Masuk: ' + res.tanggalBeli,
    '💰 Harga Beli Rata-rata: ' + fmt(res.hargaBeli),
    '💵 Harga Eksekusi Jual: ' + fmt(res.hargaJual),
    '',
    '📊 <b>Hasil Realized PnL Porsi Ini:</b>',
    pnlIcon + ' ' + (isProfit ? '+' : '') + res.pnlPct + '% (' + pnlWord + ' ' + fmt(Math.abs(res.pnlIdr)) + ')',
    '💵 <b>Dana Cair:</b> ' + fmt(res.totalReturn) + ' (Modal dicairkan ' + fmt(res.modalTerjual) + ')',
    '💼 <b>Sisa Modal Aktif:</b> ' + fmt(res.modalSisa) + ' (Tetap dipantau bot)',
    '',
    '<i>Catatan transaksi telah disimpan ke ledger position_transactions.</i>',
  ].join('\n');
} else {
  msg = [
    '🏁 <b>Posisi Ditutup Penuh: ' + res.simbol + ' (' + res.nama + ')</b>',
    '',
    '📅 Tanggal Masuk: ' + res.tanggalBeli,
    '💰 Harga Beli: ' + fmt(res.hargaBeli),
    '💵 Harga Jual: ' + fmt(res.hargaJual),
    '',
    '📊 <b>Hasil Realized PnL:</b>',
    pnlIcon + ' ' + (isProfit ? '+' : '') + res.pnlPct + '% (' + pnlWord + ' ' + fmt(Math.abs(res.pnlIdr)) + ')',
    '💵 <b>Total Dana Kembali:</b> ' + fmt(res.totalReturn) + ' (Modal ' + fmt(res.modalIdr || res.modalAwal) + ')',
    '',
    '<i>Koin telah dikeluarkan dari daftar pantauan aktif dan disimpan ke ledger audit.</i>',
  ].join('\n');
}

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

if (res && res.ambiguous) {
  const list = (res.positions || []).map(p => '• <code>' + p.coin_id + '</code> (' + p.nama + ')').join('\n');
  return [{ json: {
    found: false,
    telegramMessage: '⚠️ <b>Simbol Ambigu: ' + statInit.sym + '</b>\n\nDitemukan lebih dari 1 posisi aktif dengan simbol ini:\n' + list + '\n\nSilakan jalankan perintah dengan <code>coin_id</code> spesifik:\nContoh: <code>/stat ' + (res.positions[0]?.coin_id || 'coin_id') + '</code>',
    chatId: cfg.telegramChatId, botToken: cfg.botToken,
  }}];
}

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
const fmt = v => fmtPrice(v);

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

  // ── /rec coin|stock|futures ──
  prepareRecommendation: String.raw`const update = $('Parse Incoming Message').first().json;
const cfg = $('Config').first().json;
const requested = (String(update.args || '').trim().split(/\s+/)[0].toLowerCase() || 'coin');
const recommendationMode = /^(coin|stock|futures)$/.test(requested) ? requested : 'invalid';
const dbCmd = recommendationMode === 'stock' || recommendationMode === 'futures'
  ? 'node /home/node/.n8n/market_analysis_cli.mjs recommend-' + recommendationMode
  : '';
const telegramMessage = recommendationMode === 'invalid'
  ? '❌ Format tidak dikenal. Gunakan <code>/rec coin</code>, <code>/rec stock</code>, atau <code>/rec futures</code>.\n\n<code>/rec</code> tanpa argumen tetap sama dengan <code>/rec coin</code>.'
  : '';
return [{ json: {
  ...update,
  recommendationMode,
  dbCmd,
  telegramMessage,
  chatId: update.chatId || cfg.telegramChatId,
  botToken: cfg.botToken,
} }];`,

  parseMarketRecommendations: String.raw`const ctx = $('Prepare Recommendation').first().json;
const rawInput = $input.first().json;
const rawText = String(rawInput.stdout || rawInput.error || rawInput.stderr || '').trim();
let parsed = null;
try {
  const match = rawText.match(/\{[\s\S]*\}/);
  if (match) parsed = JSON.parse(match[0]);
} catch {}
if (!parsed || typeof parsed !== 'object') {
  parsed = { ok: false, error: { code: 'INVALID_PROVIDER_RESPONSE', message: 'CLI tidak mengembalikan JSON rekomendasi yang valid.', retryable: false } };
}
return [{ json: {
  ...ctx,
  recommendationOk: parsed?.ok === true && parsed?.recommendations != null,
  recommendations: parsed?.recommendations || null,
  recommendationError: parsed?.error || null,
} }];`,

  formatMarketRecommendations: String.raw`const ctx = $('Parse Market Recommendations').first().json;
const cfg = $('Config').first().json;
const result = ctx.recommendations;
const candidates = Array.isArray(result.candidates) ? result.candidates : [];
const fmt = (value, digits = 2) => value == null || !Number.isFinite(Number(value))
  ? 'N/A'
  : Number(value).toLocaleString('en-US', { maximumFractionDigits: digits });
let message;
if (!candidates.length) {
  message = [
    '🟡 <b>Belum ada setup ' + ctx.recommendationMode.toUpperCase() + ' yang lolos filter</b>',
    'Universe diperiksa: ' + (result.universeCount ?? result.evaluatedCount ?? 0) + '.',
    'Tidak ada kandidat yang memenuhi tren, kualitas pullback, dan batas crowding saat ini.',
    '',
    '⚠️ <i>Filter tidak dilonggarkan hanya untuk memaksa munculnya rekomendasi.</i>',
  ].join('\n');
} else if (result.assetClass === 'stock') {
  const cards = candidates.map((candidate, index) => [
    (index + 1) + '️⃣ <b>' + candidate.symbol + ' — ' + candidate.setup + '</b>',
    '• Harga: $' + fmt(candidate.price, 4) + ' | Rank ' + fmt(candidate.rankScore, 1) + '/100',
    '• Teknikal ' + fmt(candidate.factors.technicalScore, 1) + ' | RS20 vs SPY ' + fmt(candidate.factors.relativeStrength20d * 100, 2) + '%',
    '• RSI ' + fmt(candidate.factors.rsi14, 1) + ' | ADX ' + fmt(candidate.factors.adx14, 1) + ' | %B ' + fmt(candidate.factors.bollingerPercentB, 2),
    '• Support $' + fmt(candidate.factors.support, 4) + ' | Resistance $' + fmt(candidate.factors.resistance, 4),
    '👉 <code>/stock ' + candidate.symbol + '</code>',
  ].join('\n')).join('\n\n');
  message = [
    '📈 <b>Radar Rekomendasi Saham AS</b>',
    '<i>Alpaca IEX delayed | ' + result.successfulSymbols + '/' + result.universeCount + ' simbol terbaca</i>',
    '',
    cards,
    '',
    '⚠️ <i>Screening teknikal cepat; buka /stock untuk fundamental SEC dan DCF. Decision support only.</i>',
  ].join('\n');
} else {
  const cards = candidates.map((candidate, index) => {
    const sideIcon = candidate.side === 'LONG' ? '🟢' : '🔴';
    const noExecution = candidate.executionAllowed === false ? 'analysis-only' : 'status tidak valid';
    return [
      (index + 1) + '️⃣ ' + sideIcon + ' <b>' + candidate.symbol + ' — ' + candidate.side + ' ' + candidate.setup + '</b>',
      '• Mark: ' + fmt(candidate.price, 6) + ' USDT | Rank ' + fmt(candidate.rankScore, 1) + '/100',
      '• Teknikal ' + fmt(candidate.factors.technicalScore, 1) + ' | RSI ' + fmt(candidate.factors.rsi14, 1) + ' | ADX ' + fmt(candidate.factors.adx14, 1),
      '• Funding ' + fmt(candidate.factors.fundingRatePct, 5) + '% | ΔOI ' + fmt(candidate.factors.oiChangePct, 2) + '% | ' + candidate.factors.oiRegime,
      '• Support ' + fmt(candidate.factors.support, 6) + ' | Resistance ' + fmt(candidate.factors.resistance, 6),
      '👉 <code>/futures ' + candidate.symbol + '</code> | ' + noExecution,
    ].join('\n');
  }).join('\n\n');
  message = [
    '🧲 <b>Radar Rekomendasi Binance USD-M Futures</b>',
    '<i>' + result.scannedCount + ' pair paling likuid dipindai | market data publik</i>',
    '',
    cards,
    '',
    '⛔ <i>Tidak ada order otomatis atau estimasi liquidation. Decision support only.</i>',
  ].join('\n');
}
return [{ json: { telegramMessage: message, chatId: cfg.telegramChatId, botToken: cfg.botToken } }];`,

  buildRecommendationError: String.raw`const ctx = $('Parse Market Recommendations').first().json;
const cfg = $('Config').first().json;
const error = ctx.recommendationError || {};
const messages = {
  CONFIG_MISSING: 'Konfigurasi Alpaca belum lengkap. Isi ALPACA_API_KEY_ID dan ALPACA_API_SECRET untuk memakai <code>/rec stock</code>.',
  RATE_LIMITED: 'Provider sedang membatasi request screener. Tunggu sebentar lalu coba lagi.',
  ALPACA_UNAVAILABLE: 'Universe saham belum bisa diambil dari Alpaca.',
  BINANCE_UNAVAILABLE: 'Universe futures belum bisa diambil dari Binance.',
  PROVIDER_UNAVAILABLE: 'Respons provider tidak dapat diproses.',
  INVALID_PROVIDER_RESPONSE: 'Format data provider berubah atau belum lengkap. Tidak ada rekomendasi yang dipaksakan.',
  INSUFFICIENT_DATA: 'Candle tertutup belum cukup untuk menjalankan screener.',
};
return [{ json: {
  telegramMessage: '❌ <b>Recommendation screener gagal</b> [' + (error.code || 'UNKNOWN') + ']\n' + (messages[error.code] || 'Data kandidat tidak lengkap atau tidak valid.'),
  chatId: cfg.telegramChatId,
  botToken: cfg.botToken,
} }];`,

  formatRecMessage: String.raw`const cfg = $('Config').first().json;
const coins = $input.all().map(i => i.json);

if (!coins.length || !coins[0] || !coins[0].id) {
  return [{ json: { telegramMessage: '⏳ Data pasar sedang padat. Silakan coba /rec beberapa saat lagi.', chatId: cfg.telegramChatId, botToken: cfg.botToken } }];
}

const stableSet = new Set(['usdt', 'usdc', 'dai', 'fdusd', 'usde', 'tusd', 'usdd', 'pyusd', 'bousd', 'wbtc', 'steth', 'weth', 'weeth', 'wsteth']);

function fmt(val) {
  if (val == null || !Number.isFinite(Number(val))) return 'Rp 0';
  const v = Number(val);
  const abs = Math.abs(v);
  let maxDigits = 0;
  if (abs < 0.0001) maxDigits = 8;
  else if (abs < 0.01) maxDigits = 6;
  else if (abs < 1) maxDigits = 4;
  else if (abs < 1000) maxDigits = 2;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: (maxDigits > 0 && abs < 1) ? 2 : 0,
    maximumFractionDigits: maxDigits,
  }).format(v);
}

// 1. Filter koin likuid non-stable yang memenuhi kriteria utama (Uptrend 7d + Koreksi Sehat 24h)
const screened = coins.filter(c => {
  const sym = (c.symbol || '').toLowerCase();
  if (stableSet.has(sym)) return false;
  const p7d = c.price_change_percentage_7d_in_currency;
  const p24h = c.price_change_percentage_24h;
  if (typeof p7d !== 'number' || typeof p24h !== 'number') return false;
  return p7d >= 2.5 && p24h <= -0.5 && p24h >= -8.5;
});

screened.sort((a, b) => (b.price_change_percentage_7d_in_currency || 0) - (a.price_change_percentage_7d_in_currency || 0));

let picks = screened.slice(0, 3).map(c => ({ ...c, _isFallback: false }));

// 2. Fallback jika kurang dari 3: ambil koin tren positif dengan momentum netral/konsolidasi
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
  picks = picks.concat(fallback.slice(0, 3 - picks.length).map(c => ({ ...c, _isFallback: true })));
}

const btc = coins.find(c => c.id === 'bitcoin' || (c.symbol || '').toLowerCase() === 'btc');
const btc24h = btc ? (btc.price_change_percentage_24h || 0) : 0;
const isBtcWeak = btc24h < -1.0;

const cards = picks.map((c, i) => {
  const price = c.current_price || 0;
  const p7d = Number((c.price_change_percentage_7d_in_currency || 0).toFixed(1));
  const p24h = Number((c.price_change_percentage_24h || 0).toFixed(1));
  const entryLow = fmt(price * 0.98);
  const entryHigh = fmt(price);

  let momText = '';
  if (p24h <= -0.5) {
    momText = '📉 24h: ' + p24h + '% (Diskon / Pullback)';
  } else if (p24h <= 0) {
    momText = '📉 24h: ' + p24h + '% (Konsolidasi Tipis)';
  } else {
    momText = '📈 24h: +' + p24h + '% (Konsolidasi / Akumulasi)';
  }

  // Estimasi momentum TP/SL awal
  let slPct = 6.0;
  let tpPct = 12.0;
  if (p7d > 35 || Math.abs(p24h) > 6) {
    slPct = 7.5;
    tpPct = 18.0;
  } else if (p7d < 15 && Math.abs(p24h) < 3) {
    slPct = 5.0;
    tpPct = 10.0;
  }
  const tp = fmt(price * (1 + tpPct / 100));
  const sl = fmt(price * (1 - slPct / 100));
  const rrText = (tpPct / slPct).toFixed(1);

  const cardHeader = (i + 1) + '️⃣ <b>' + (c._isFallback ? '⚡ ' : '🎯 ') + c.symbol.toUpperCase() + ' (' + c.name + ')' + (c._isFallback ? ' — [Watchlist Alternatif]' : ' — [Pullback Sehat]') + '</b>';

  return [
    cardHeader,
    '• Harga Sekarang: ' + fmt(price),
    '• Momentum: 📈 7d: +' + p7d + '% | ' + momText,
    '• Area Entry Ideal: ' + entryLow + ' – ' + entryHigh,
    '• Estimasi TP (+' + tpPct + '%): ' + tp + ' | SL (-' + slPct + '%): ' + sl + ' (R:R 1:' + rrText + ')',
    '👉 <i>Beli & pantau:</i> <code>/buy ' + c.symbol.toLowerCase() + ' 150k</code> | <code>/risk ' + c.symbol.toLowerCase() + '</code>',
  ].join('\n');
});

const now = new Intl.DateTimeFormat('id-ID', { timeZone: cfg.timezone, timeStyle: 'short' }).format(new Date());

const btcNote = isBtcWeak
  ? '\n⚠️ <i>Catatan Makro: BTC sedang tertekan (' + btc24h.toFixed(1) + '% 24h). Gunakan koin di bawah sebagai Watchlist Pantau Pullback dengan alokasi defensif.</i>\n'
  : '';

const msg = [
  '🎯 <b>Radar Rekomendasi Crypto Spot Luna Hernandez</b>',
  '<i>' + now + ' WIB | Kriteria: Uptrend Mingguan + Pullback / Akumulasi</i>',
  btcNote,
  cards.join('\n\n'),
  '',
  '💡 <i>Catatan: <code>/rec</code> sama dengan <code>/rec coin</code>. Level TP/SL di atas adalah estimasi momentum awal. Ketik <code>/risk &lt;simbol&gt;</code> untuk kalkulator ATR dinamis & sizing terukur.</i>\n' +
  '<i>Ketik <code>/buy &lt;simbol&gt; [modal]</code> untuk langsung memasukkan ke portofolio.</i>\n' +
  '⚠️ <i>Decision support only. Bukan saran finansial.</i>',
].filter(Boolean).join('\n');

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

const ackCmd = alerts.map(a => 'node /home/node/.n8n/manage_positions.mjs ack-alert ' + a.positionId + ' ' + a.type).join(' && ');

return [{ json: {
  hasAlerts: true,
  telegramMessage: msg,
  chatId: cfg.telegramChatId,
  botToken: cfg.botToken,
  ackCmd: ackCmd || 'echo ok',
}}];`,

  // ── /news (Live News Headlines & AI Sentiment) ──
  resolveNewsTarget: String.raw`const data = $input.first().json;
const update = $('Parse Incoming Message').first().json;
const rawArgs = (update.args || '').trim();
const coinArg = (update.coinArg || '').trim();

let coinName = 'Crypto Market Global';
let coinSymbol = 'MARKET';
let searchQuery = 'crypto market bitcoin altcoin';
let isGeneral = false;

if (!rawArgs) {
  isGeneral = true;
} else {
  const coins = data.coins || [];
  const qLower = coinArg.toLowerCase() || rawArgs.toLowerCase();
  let coin = coins.find(c => c.symbol?.toLowerCase() === qLower);
  if (!coin) coin = coins.find(c => c.name?.toLowerCase() === qLower);
  if (!coin && coins.length > 0) coin = coins[0];

  if (coin) {
    coinName = coin.name;
    coinSymbol = coin.symbol.toUpperCase();
    searchQuery = coin.name + ' crypto';
  } else {
    coinName = rawArgs;
    coinSymbol = rawArgs.toUpperCase();
    searchQuery = rawArgs + ' crypto';
  }
}

const newsQueryUrl = 'https://news.google.com/rss/search?q=' + encodeURIComponent(searchQuery) + '&hl=en&gl=US&ceid=US:en';

return [{ json: {
  coinName,
  coinSymbol,
  searchQuery,
  isGeneral,
  newsQueryUrl,
  chatId: update.chatId,
  botToken: update.botToken,
} }];`,

  parseNewsFeed: String.raw`const xml = ($input.first().json.data || '').toString();
const target = $('Resolve News Target').first().json;

function decodeHtml(str) {
  return (str || '')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function timeAgo(pubDateStr) {
  try {
    const d = new Date(pubDateStr);
    if (isNaN(d.getTime())) return pubDateStr ? pubDateStr.slice(0, 16) : '';
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Baru saja';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return diffMin + ' mnt lalu';
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return diffHours + ' jam lalu';
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays <= 7) return diffDays + ' hari lalu';
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  } catch (e) {
    return pubDateStr ? pubDateStr.slice(0, 16) : '';
  }
}

const itemBlocks = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];
const articles = [];

const maxAgeMs = 48 * 60 * 60 * 1000;
const nowMs = Date.now();
for (const m of itemBlocks.slice(0, 30)) {
  const c = m[1];
  let rawTitle = (c.match(/<title><!\[CDATA\[([\s\S]*?)\]\]>/) || c.match(/<title>([\s\S]*?)<\/title>/))?.[1] || '';
  rawTitle = decodeHtml(rawTitle);

  let source = (c.match(/<source[^>]*>([\s\S]*?)<\/source>/))?.[1] || '';
  source = decodeHtml(source);

  if (rawTitle.includes(' - ')) {
    const lastDash = rawTitle.lastIndexOf(' - ');
    if (!source) source = rawTitle.slice(lastDash + 3).trim();
    rawTitle = rawTitle.slice(0, lastDash).trim();
  }

  const pubDate = (c.match(/<pubDate>([\s\S]*?)<\/pubDate>/))?.[1] || '';
  const publishedAt = new Date(pubDate).getTime();
  const ageMs = nowMs - publishedAt;
  if (!Number.isFinite(publishedAt) || ageMs < -10 * 60 * 1000 || ageMs > maxAgeMs) continue;
  const timeLabel = timeAgo(pubDate);

  if (rawTitle.length > 5) {
    articles.push({
      title: rawTitle,
      source: source || 'Media Crypto',
      pubDate,
      timeLabel,
    });
  }
  if (articles.length >= 7) break;
}

return [{ json: {
  ...target,
  articles,
  articleCount: articles.length,
} }];`,

  prepareGeminiNewsPrompt: String.raw`const feed = $('Parse News Feed').first().json;
const cfg = $('Config').first().json;

let prompt = '';
if (feed.articleCount === 0) {
  prompt = 'Analisis kondisi sentimen pasar crypto terkini untuk ' + feed.coinName + ' (' + feed.coinSymbol + '). Berikan ringkasan sentimen, risiko makro, dan arahan untuk swing trader.';
} else {
  const newsListText = feed.articles.map((a, i) => (i + 1) + '. ' + a.title + ' [' + a.source + ' - ' + a.timeLabel + ']').join('\n');
  prompt = [
    'Kamu adalah analis sentimen dan intelijen berita crypto profesional untuk swing trader Indonesia.',
    'Analisis berita live terbaru berikut untuk: ' + feed.coinName + ' (' + feed.coinSymbol + ').',
    '',
    'DAFTAR BERITA LIVE TERBARU:',
    newsListText,
    '',
    'INSTRUKSI ANALISIS (JAWAB DALAM BAHASA INDONESIA, SINGKAT & PADAT):',
    '1. KESIMPULAN SENTIMEN: Tentukan sentimen pasar (BULLISH / BEARISH / NETRAL) dan berikan Skor Sentimen (1 sampai 10).',
    '2. KATALIS UTAMA: Rangkum 2-3 poin berita paling berdampak atau narasi pasar utama (apa yang sebenarnya terjadi di balik berita).',
    '3. DAMPAK KE SWING TRADING: Jelaskan apakah berita ini mendukung aksi beli/re-entry, pertanda potensi koreksi (sell the news), atau sekadar rumor/volatilitas jangka pendek.',
    '',
    'ATURAN FORMAT:',
    '- JANGAN gunakan tanda bintang ganda tebal (**), gunakan penomoran atau bullet bersih.',
    '- Maksimal 150 kata total agar pas dibaca cepat di Telegram mobile.',
  ].join('\n');
}

const geminiBody = {
  contents: [{ parts: [{ text: prompt }] }],
  generationConfig: { maxOutputTokens: 1000, temperature: 0.2, thinkingConfig: { thinkingBudget: 512 } },
};

return [{ json: {
  ...feed,
  geminiBody,
  chatId: feed.chatId,
  botToken: feed.botToken,
} }];`,

  formatNewsReport: String.raw`const resp = $input.first().json;
const feed = $('Parse News Feed').first().json;
const cfg = $('Config').first().json;

if (feed.articleCount === 0) {
  const msg = [
    '📰 <b>Berita Crypto: ' + feed.coinName + ' (' + feed.coinSymbol + ')</b>',
    '',
    '⚠️ Tidak ditemukan berita terbaru dalam 24-48 jam terakhir untuk koin/topik ini.',
    'Coba gunakan simbol lain, misalnya: <code>/news sol</code>, <code>/news btc</code>, <code>/news eth</code>',
  ].join('\n');
  return [{ json: { telegramMessage: msg, chatId: feed.chatId, botToken: feed.botToken } }];
}

let aiAnalysis = '';
if (resp.error) {
  const m = resp.error.message || '';
  aiAnalysis = m.includes('quota') ? '⏳ AI rate-limited. Coba lagi dalam 1 menit.' : '⚠️ AI error: ' + m.slice(0, 100);
} else {
  const parts = resp.candidates?.[0]?.content?.parts || [];
  aiAnalysis = parts.map(p => p.text || '').join('').trim();
  if (!aiAnalysis) aiAnalysis = '⚠️ Tidak ada rangkuman dari AI.';
  aiAnalysis = aiAnalysis
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\*/g, '');
}

const numberIcons = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
const headlineList = feed.articles.map((a, i) => {
  const icon = numberIcons[i] || '•';
  return icon + ' <b>' + a.title + '</b>\n   🏢 <i>' + a.source + ' • ' + a.timeLabel + '</i>';
}).join('\n\n');

const actionTips = feed.coinSymbol !== 'MARKET' && feed.coinSymbol !== 'CRYPTO'
  ? '💡 <i>Ketik <code>/coin ' + feed.coinSymbol.toLowerCase() + '</code> untuk bedah teknikal atau <code>/buy ' + feed.coinSymbol.toLowerCase() + ' 150k</code> untuk entry.</i>\n'
  : '💡 <i>Ketik <code>/rec</code> untuk rekomendasi swing entry atau <code>/market</code> untuk top mover.</i>\n';

const msg = [
  '📰 <b>Berita Live & Sentimen: ' + feed.coinName + ' (' + feed.coinSymbol + ')</b>',
  '<i>' + feed.articleCount + ' artikel Google News terbaru dianalisis secara real-time</i>',
  '',
  '🤖 <b>Analisis Sentimen & Katalis AI:</b>',
  aiAnalysis,
  '',
  '🗞️ <b>Headline Berita Terkait:</b>',
  headlineList,
  '',
  actionTips +
  '⚠️ <i>Decision support only. Bukan saran finansial.</i>',
].join('\n');

return [{ json: {
  telegramMessage: msg,
  chatId: feed.chatId,
  botToken: feed.botToken,
} }];`,

  // ── /risk (Tactical Risk Calculator & Position Sizing) ──
  extractRiskCoin: String.raw`const data = $input.first().json;
const update = $('Parse Incoming Message').first().json;
const cfg = $('Config').first().json;
const query = (update.coinArg || update.args || '').toLowerCase().trim();

if (!query) {
  return [{ json: {
    found: false,
    telegramMessage: [
      '⚡ <b>Kalkulator Risiko & Tactical Sizing Luna Hernandez</b>',
      '',
      'Format: <code>/risk &lt;simbol&gt; [modal]</code>',
      '',
      '📌 <b>Contoh Penggunaan:</b>',
      '• <code>/risk sol</code> — Hitung skor risiko koin SOL (default alokasi 100rb)',
      '• <code>/risk sol 500k</code> — Hitung risiko SOL dengan asumsi modal 500rb',
      '• <code>/risk btc 1jt</code> — Hitung risiko BTC dengan modal 1 juta',
      '',
      '<i>Fitur ini mengukur Skor Risiko 1-10, Downside SMA20/Lower BB, Dynamic TP/SL (R:R min 1:2.0), & Skenario Agresif bagi Risk-Takers.</i>',
    ].join('\n'),
    chatId: update.chatId || cfg.telegramChatId,
    botToken: cfg.botToken,
  }}];
}

if (update.invalidModal) {
  return [{ json: {
    found: false,
    telegramMessage: '❌ Nominal modal <b>' + update.invalidModal + '</b> tidak valid.\nContoh penggunaan: <code>/risk SOL 150k</code> atau <code>/risk BTC 500000</code>',
    chatId: update.chatId || cfg.telegramChatId,
    botToken: cfg.botToken,
  }}];
}

const coins = data.coins || [];

// Prioritaskan koin dengan market cap terbesar
coins.sort((a, b) => {
  const ra = (a.market_cap_rank != null && a.market_cap_rank > 0) ? a.market_cap_rank : 999999;
  const rb = (b.market_cap_rank != null && b.market_cap_rank > 0) ? b.market_cap_rank : 999999;
  return ra - rb;
});

let coin = coins.find(c => c.symbol?.toLowerCase() === query);
if (!coin) coin = coins.find(c => c.name?.toLowerCase() === query);

if (!coin) {
  return [{ json: {
    found: false,
    telegramMessage: '❌ Koin <b>' + query.toUpperCase() + '</b> tidak ditemukan di CoinGecko.\nContoh: <code>/risk sol</code>, <code>/risk btc 500k</code>, <code>/risk aero</code>',
    chatId: update.chatId || cfg.telegramChatId,
    botToken: cfg.botToken,
  }}];
}

return [{ json: {
  found: true,
  coinId: coin.id,
  coinSymbol: coin.symbol.toUpperCase(),
  coinName: coin.name,
  marketCapRank: coin.market_cap_rank || 'N/A',
  modalArg: update.modalArg || 100000,
  chatId: update.chatId || cfg.telegramChatId,
  botToken: cfg.botToken,
}}];`,

  calculateRiskMetrics: TECH_SHARED + String.raw`
const coinCtx = $('Extract Risk Coin').first().json;
const rawPrices = $('CoinGecko Risk Market Chart').first().json.prices || [];
const btcPrices = $('Fetch BTC Gate Risk').first().json.prices || [];
const cfg = $('Config').first().json;

if (!rawPrices.length) {
  return [{ json: {
    telegramMessage: '❌ Gagal memuat data chart harga untuk koin <b>' + coinCtx.coinSymbol + '</b>. Silakan coba sesaat lagi.',
    chatId: coinCtx.chatId,
    botToken: coinCtx.botToken,
  }}];
}

// 1. Parsing candlestick harian koin
const daily = new Map();
for (const row of rawPrices) {
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
if (series.length < 35) {
  return [{ json: {
    telegramMessage: '⚠️ Data candle historis untuk <b>' + coinCtx.coinSymbol + ' (' + coinCtx.coinName + ')</b> hanya tersedia ' + series.length + ' hari (minimal 35 hari diperlukan untuk kalkulasi RSI, MACD, Bollinger Bands, dan ATR).\n\nSilakan analisa koin dengan riwayat pasar yang lebih matang.',
    chatId: coinCtx.chatId,
    botToken: coinCtx.botToken,
  }}];
}
const prices = series.map(p => p.price);
const highs = series.map(p => p.high);
const lows = series.map(p => p.low);
const currentPrice = prices.at(-1);

const rsi = rsiWilder(prices, Math.min(14, prices.length - 1));
const macdVal = macdCalc(prices);
const bands = bollingerCalc(prices);
const bw = Math.max(bands.upper - bands.lower, 1e-6);
const percentB = clamp((currentPrice - bands.lower) / bw, 0, 1);
const vol = annualVol(prices);
const sma20val = sma(prices, Math.min(20, prices.length));
const adxVal = adx(highs, lows, prices, Math.min(14, prices.length - 2));
const atrVal = atr(highs, lows, prices, Math.min(14, prices.length - 1));

// 2. Evaluasi Makro BTC
let btcTrend = 'Neutral';
let btc24hPct = 0;
if (btcPrices.length >= 14) {
  const btcDaily = new Map();
  for (const row of btcPrices) {
    if (!Array.isArray(row) || row.length < 2) continue;
    const ts = Number(row[0]), p = Number(row[1]);
    if (!Number.isFinite(ts) || !Number.isFinite(p) || p <= 0) continue;
    const d = new Date(ts).toISOString().slice(0, 10);
    if (!btcDaily.has(d)) btcDaily.set(d, { ts, price: p });
    else btcDaily.get(d).price = p;
  }
  const btcSeries = [...btcDaily.values()].sort((a, b) => a.ts - b.ts);
  const bCloses = btcSeries.map(x => x.price);
  const btcCur = bCloses.at(-1);
  const btcPrev = bCloses.length >= 2 ? bCloses.at(-2) : btcCur;
  btc24hPct = btcPrev > 0 ? ((btcCur - btcPrev) / btcPrev) * 100 : 0;
  const btcSma20 = sma(bCloses, Math.min(20, bCloses.length));
  const btcMacd = macdCalc(bCloses);
  if (btcSma20 && btcCur < btcSma20 && btcMacd.histogram < 0) btcTrend = 'Bearish';
  else if (btcSma20 && btcCur > btcSma20 && btcMacd.histogram > 0) btcTrend = 'Bullish';
}

// 3. Kalkulasi Skor Risiko (1.0 - 10.0)
let riskScore = 5.0;
const riskFactors = [];
const mitigatingFactors = [];

if (btcTrend === 'Bearish') {
  riskScore += 2.0;
  riskFactors.push('Makro BTC sedang Downtrend/Bearish (hambatan pasar umum)');
} else if (btcTrend === 'Bullish') {
  riskScore -= 1.0;
  mitigatingFactors.push('Makro BTC kondusif/Bullish mendukung momentum');
}

if (percentB >= 0.85) {
  riskScore += 2.0;
  riskFactors.push('Harga mendekati Upper Bollinger Band (%B: ' + percentB.toFixed(2) + '), rawan aksi ambil untung');
} else if (percentB <= 0.20 && rsi < 35) {
  riskScore += 1.5;
  riskFactors.push('Harga anjlok tajam mendekati Lower Band (%B: ' + percentB.toFixed(2) + '), waspada pisau jatuh');
} else if (percentB >= 0.25 && percentB <= 0.50) {
  riskScore -= 1.0;
  mitigatingFactors.push('Harga berada di zona pullback wajar (%B: ' + percentB.toFixed(2) + ')');
}

if (rsi > 70) {
  riskScore += 1.5;
  riskFactors.push('RSI Overbought (' + rsi.toFixed(1) + '), probabilitas koreksi tinggi');
} else if (rsi >= 40 && rsi <= 55 && currentPrice > (sma20val || 0)) {
  riskScore -= 1.0;
  mitigatingFactors.push('RSI sehat di zona pullback (' + rsi.toFixed(1) + ')');
}

if (vol > 0.85) {
  riskScore += 1.5;
  riskFactors.push('Volatilitas tahunan sangat tinggi (' + (vol * 100).toFixed(0) + '%), ayunan harga lebar');
} else if (vol < 0.45) {
  riskScore -= 0.5;
  mitigatingFactors.push('Volatilitas relatif stabil (' + (vol * 100).toFixed(0) + '%) [Skor -0.5]');
}

const isTrendBullish = currentPrice > (sma20val || 0) && macdVal.histogram > 0;
if (isTrendBullish && adxVal > 25) {
  riskScore -= 1.5;
  mitigatingFactors.push('Tren naik sangat kokoh didukung kekuatan ADX (' + adxVal.toFixed(1) + ')');
} else if (currentPrice < (sma20val || 0) && macdVal.histogram < 0) {
  riskScore += 1.5;
  riskFactors.push('Harga di bawah SMA20 & histogram MACD negatif');
}

riskScore = Math.max(1.0, Math.min(10.0, Number(riskScore.toFixed(1))));

let riskLabel = 'Moderat 🟡';
let maxAllocPct = '10% – 15%';
if (riskScore >= 8.0) {
  riskLabel = 'Sangat Tinggi 🔴🔴';
  maxAllocPct = '3% – 5%';
} else if (riskScore >= 6.0) {
  riskLabel = 'Tinggi 🔴';
  maxAllocPct = '5% – 10%';
} else if (riskScore <= 3.5) {
  riskLabel = 'Rendah (Kondusif) 🟢';
  maxAllocPct = '15% – 25%';
}

// 4. Perhitungan Potensi Downside
const smaDiffPct = sma20val ? Number((((sma20val - currentPrice) / currentPrice) * 100).toFixed(1)) : 0;
const lowerBbDiffPct = bands.lower ? Number((((bands.lower - currentPrice) / currentPrice) * 100).toFixed(1)) : 0;

// 5. Dynamic TP & SL berbasis ATR
const atrPct = currentPrice > 0 ? (atrVal / currentPrice) * 100 : 3.5;
const dynSlPct = Number(Math.min(8.5, Math.max(4.5, 1.8 * atrPct)).toFixed(1));
const rrRatio = (isTrendBullish && adxVal > 25) ? 2.5 : 2.0;
const dynTpPct = Number(Math.max(10.0, Math.min(25.0, dynSlPct * rrRatio)).toFixed(1));

const dynTpPrice = currentPrice * (1 + dynTpPct / 100);
const dynSlPrice = currentPrice * (1 - dynSlPct / 100);

// 6. Kalkulasi Nominal Modal & Implied Portfolio Sizing (Van Tharp)
const modal = coinCtx.modalArg || 100000;
const maxLossNominal = Math.round(modal * (dynSlPct / 100));
const potentialGainNominal = Math.round(modal * (dynTpPct / 100));
const impliedEquity1Pct = Math.round(maxLossNominal / 0.01);
const impliedEquity2Pct = Math.round(maxLossNominal / 0.02);

const fmt = v => fmtPrice(v);

// 7. Format Output Telegram HTML
const msg = [
  '⚡ <b>Kalkulator Risiko & Simulasi Alokasi: ' + coinCtx.coinName + ' (' + coinCtx.coinSymbol + ')</b>',
  '',
  '📊 <b>Profil Risiko Pasar:</b>',
  '• <b>Skor Risiko: ' + riskScore.toFixed(1) + ' / 10 (' + riskLabel + ')</b>',
  '• Status Tren Makro BTC: ' + (btcTrend === 'Bearish' ? '📉 Bearish (' + btc24hPct.toFixed(1) + '%)' : btcTrend === 'Bullish' ? '📈 Bullish (+' + btc24hPct.toFixed(1) + '%)' : '↔️ Netral'),
  '• Posisi Bollinger Band: %B ' + percentB.toFixed(2) + ' (RSI: ' + rsi.toFixed(1) + ')',
  '• Volatilitas Harian (ATR): ' + atrPct.toFixed(1) + '% | Tahunan: ' + (vol * 100).toFixed(0) + '%',
  '',
  '📉 <b>Potensi Downside (Koreksi):</b>',
  '• Jarak ke Mean Reversion (SMA20): ' + (smaDiffPct > 0 ? '+' + smaDiffPct : smaDiffPct) + '% (' + fmt(sma20val || currentPrice) + ')',
  '• Jarak ke Worst-Case (Lower BB): ' + lowerBbDiffPct + '% (' + fmt(bands.lower) + ')',
  '',
  '🎯 <b>Level Eksekusi Dinamis (R:R 1:' + rrRatio.toFixed(1) + '):</b>',
  '• Target TP Dinamis (+' + dynTpPct + '%): ' + fmt(dynTpPrice),
  '• Stop Loss Dinamis (-' + dynSlPct + '%): ' + fmt(dynSlPrice),
  '',
  '💵 <b>Simulasi Alokasi Terpilih (Modal ' + fmt(modal) + '):</b>',
  '• Toleransi Rugi jika SL: <b>-' + fmt(maxLossNominal) + '</b> (-' + dynSlPct + '%)',
  '• Potensi Untung jika TP: <b>+' + fmt(potentialGainNominal) + '</b> (+' + dynTpPct + '%)',
  '',
  '📐 <b>Panduan Position Sizing Portofolio (Van Tharp):</b>',
  '• Porsi Alokasi Maksimal: <b>' + maxAllocPct + '</b> dari total modal portofolio trading lo',
  '• Implikasi Modal Portofolio: Jika risiko transaksi ini dibatasi Rp ' + fmt(maxLossNominal) + ', total portofolio trading lo idealnya minimal <b>' + fmt(impliedEquity2Pct) + '</b> (aturan risiko 2%) s/d <b>' + fmt(impliedEquity1Pct) + '</b> (aturan risiko 1%).',
  '',
  '🛡️ <b>Sudut Pandang Risk-Taker (Skenario Agresif):</b>',
  (riskFactors.length ? '⚠️ <i>Peringatan Risiko:</i>\n' + riskFactors.map(f => '  - ' + f).join('\n') + '\n' : ''),
  (mitigatingFactors.length ? '✅ <i>Faktor Pendukung:</i>\n' + mitigatingFactors.map(m => '  - ' + m).join('\n') + '\n' : ''),
  '💡 <b>Taktik Eksekusi Jika Tetap Entry:</b>',
  '1. Gunakan Stop Loss ketat di <b>' + fmt(dynSlPrice) + ' (-' + dynSlPct + '%)</b> tanpa kompromi.',
  '2. Jangan all-in sekaligus; bagi modal jadi 2–3 tahap entry (cicil DCA).',
  '3. Kunci profit bertahap saat R:R 1:1 tercapai dan geser SL ke Break Even.',
  '',
  '👉 <i>Eksekusi beli & pantau bot:</i> <code>/buy ' + coinCtx.coinSymbol.toLowerCase() + ' ' + (modal >= 1000 ? Math.round(modal / 1000) + 'k' : modal) + '</code>',
  '⚠️ <i>Decision support only. Segala risiko trading berada di tangan Anda.</i>',
].filter(x => x !== undefined && x !== null && x !== '').join('\n');

return [{ json: {
  telegramMessage: msg,
  chatId: coinCtx.chatId,
  botToken: coinCtx.botToken,
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

const GEMINI_URL = "={{ 'https://generativelanguage.googleapis.com/v1beta/models/' + $('Config').first().json.geminiModel + ':generateContent?key=' + ($env.GEMINI_API_KEY || $('Config').first().json.geminiApiKey) }}";

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
          { conditions: { conditions: [{ leftValue: '={{ $json.command }}', rightValue: 'stock', operator: { type: 'string', operation: 'equals' } }], combinator: 'and' }, renameOutput: true, outputKey: 'stock' },
          { conditions: { conditions: [{ leftValue: '={{ $json.command }}', rightValue: 'futures', operator: { type: 'string', operation: 'equals' } }], combinator: 'and' }, renameOutput: true, outputKey: 'futures' },
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
          { conditions: { conditions: [{ leftValue: '={{ $json.command }}', rightValue: 'news', operator: { type: 'string', operation: 'equals' } }], combinator: 'and' }, renameOutput: true, outputKey: 'news' },
          { conditions: { conditions: [{ leftValue: '={{ $json.command }}', rightValue: 'risk', operator: { type: 'string', operation: 'equals' } }], combinator: 'and' }, renameOutput: true, outputKey: 'risk' },
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
  ifNode('B2020', 'Coin Found?', '={{ !$json.__error }}', 740, -800),
  tgSend('B2008', 'Send Coin Error', 740, -960),
  httpGet('B2003', 'CoinGecko Market Chart',
    "=https://api.coingecko.com/api/v3/coins/{{ $json.coinId }}/market_chart?vs_currency={{ $('Config').first().json.quoteCurrency }}&days={{ $('Config').first().json.marketDays }}",
    860, -800, { onError: 'continueRegularOutput' }),
  httpGet('B2018', 'Fetch BTC Gate',
    "=https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency={{ $('Config').first().json.quoteCurrency }}&days={{ $('Config').first().json.marketDays }}",
    1100, -800, { onError: 'continueRegularOutput' }),
  codeNode('B2019', 'BTC Gate', code.btcGate, 1340, -800, 'Hitung BTC gate signal: bullish/bearish/neutral berdasarkan SMA20 + MACD'),
  codeNode('B2004', 'Coin Technical', code.coinTechnical, 1580, -800),
  ifNode('B2021', 'Coin Technical OK?', '={{ $json.technicalOk }}', 1700, -800),

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

  // /stock and /futures — deterministic analysis + one narrative-only Gemini pass
  codeNode('M1001', 'Prepare Market Command', code.prepareMarketCommand, 380, -1080),
  execNode('M1002', 'Execute Market Analysis', '={{ $json.dbCmd }}', 620, -1080),
  codeNode('M1003', 'Parse Market Analysis Result', code.parseMarketAnalysisResult, 860, -1080),
  ifNode('M1004', 'Market Analysis OK?', '={{ $json.analysisOk }}', 1100, -1080),
  codeNode('M1005', 'Prepare Gemini Market Prompt', code.prepareGeminiMarketPrompt, 1340, -1160),
  httpPost('M1006', 'Gemini Market Research', GEMINI_URL, '={{ JSON.stringify($json.geminiBody) }}', 1580, -1160, 60000),
  codeNode('M1007', 'Build Market Report', code.buildMarketReport, 1820, -1160),
  tgSend('M1008', 'Send Market Report', 2060, -1240),
  codeNode('M1009', 'Prepare Save Market', code.prepareSaveMarket, 2060, -1080),
  execNode('M1010', 'Save Market Analysis', '={{ $json.dbCmd }}', 2300, -1080),
  codeNode('M1011', 'Build Market Error', code.buildMarketError, 1340, -1000),
  tgSend('M1012', 'Send Market Error', 1580, -1000),

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
  codeNode('B4001', 'Prepare List Positions', code.prepareListPositions, 380, 200),
  execNode('B4002', 'Query List Positions', '={{ $json.dbCmd }}', 620, 200),
  codeNode('B4003', 'Process Portfolio Check', code.processPortfolioCheck, 860, 200),
  ifNode('B4004', 'Has Active Positions?', '={{ $json.hasPositions }}', 1100, 200),
  tgSend('B4005', 'Send Empty Portfolio', 1340, 280),
  httpGet('B4006', 'Fetch Portfolio Prices', "=https://api.coingecko.com/api/v3/simple/price?ids={{ $json.coinIds }},bitcoin&vs_currencies=idr&include_24hr_change=true", 1340, 120, { onError: 'continueRegularOutput' }),
  codeNode('B4007', 'Format Dynamic Portfolio', code.formatDynamicPortfolio, 1580, 120),
  tgSend('B4008', 'Send Dynamic Portfolio', 1820, 120),
  httpGet('B5001', 'CoinGecko Markets', "=https://api.coingecko.com/api/v3/coins/markets?vs_currency={{ $('Config').first().json.quoteCurrency }}&order=market_cap_desc&per_page=100&page=1&price_change_percentage=24h", 380, 400),
  codeNode('B5002', 'Format Market', code.formatMarket, 620, 400),
  tgSend('B5003', 'Send Market', 860, 400),
  execNode('B6001', 'Read History', "={{ 'node /home/node/.n8n/market_analysis_cli.mjs history ' + (($('Parse Incoming Message').first().json.args || '').toUpperCase().replace(/[^A-Z0-9.-]/g, '')) }}", 380, 850),
  codeNode('B6002', 'Build History', code.buildHistory, 620, 850),
  tgSend('B6003', 'Send History', 860, 850),
  codeNode('B7001', 'Unknown Command', code.unknownCmd, 380, 1000),
  tgSend('B7002', 'Send Unknown', 620, 1000),
  httpGet('B8001', 'CoinGecko Search Buy', "=https://api.coingecko.com/api/v3/search?query={{ encodeURIComponent($('Parse Incoming Message').first().json.coinArg) }}", 380, 1200, { onError: 'continueRegularOutput' }),
  codeNode('B8002', 'Extract Buy Coin', code.extractBuyCoin, 620, 1200),
  ifNode('B8003', 'Is Buy Found?', '={{ $json.found }}', 860, 1200),
  tgSend('B8004', 'Send Buy Error', 1100, 1280),
  httpGet('B8005', 'Fetch Buy Chart', "=https://api.coingecko.com/api/v3/coins/{{ $json.coinId }}/market_chart?vs_currency={{ $('Config').first().json.quoteCurrency }}&days={{ $('Config').first().json.marketDays }}", 1100, 1120, { onError: 'continueRegularOutput' }),
  codeNode('B8006', 'Prepare Buy Exec', code.prepareBuyExec, 1340, 1120),
  ifNode('B8006A', 'Is Buy Price OK?', '={{ $json.hasPrice }}', 1480, 1120),
  execNode('B8007', 'Execute Buy DB', '={{ $json.dbCmd }}', 1680, 1120),
  codeNode('B8008', 'Format Buy Response', code.formatBuyResponse, 1920, 1120),
  tgSend('B8009', 'Send Buy Confirm', 2160, 1120),
  codeNode('B8101', 'Prepare Sell Query', code.prepareSellQuery, 380, 1450),
  execNode('B8102', 'Execute Sell Query', '={{ $json.dbCmd }}', 620, 1450),
  codeNode('B8103', 'Process Sell Check', code.processSellCheck, 860, 1450),
  ifNode('B8104', 'Is Sell Found?', '={{ $json.found }}', 1100, 1450),
  tgSend('B8105', 'Send Sell Error', 1340, 1530),
  httpGet('B8106', 'Fetch Sell Price', "=https://api.coingecko.com/api/v3/simple/price?ids={{ $json.coinId }}&vs_currencies=idr", 1340, 1370, { onError: 'continueRegularOutput' }),
  codeNode('B8107', 'Prepare Close Position', code.prepareClosePosition, 1580, 1370),
  execNode('B8108', 'Execute Close Command', '={{ $json.dbCmd }}', 1820, 1370),
  codeNode('B8109', 'Format Sell Response', code.formatSellResponse, 2060, 1370),
  tgSend('B8110', 'Send Sell Report', 2300, 1370),
  codeNode('B8201', 'Prepare Stat Query', code.prepareStatQuery, 380, 1700),
  execNode('B8202', 'Execute Stat Query', '={{ $json.dbCmd }}', 620, 1700),
  codeNode('B8203', 'Process Stat Position', code.processStatPosition, 860, 1700),
  ifNode('B8204', 'Is Stat Found?', '={{ $json.found }}', 1100, 1700),
  tgSend('B8205', 'Send Stat Error', 1340, 1780),
  httpGet('B8206', 'Fetch Stat Chart', "=https://api.coingecko.com/api/v3/coins/{{ $json.coinId }}/market_chart?vs_currency={{ $('Config').first().json.quoteCurrency }}&days={{ $('Config').first().json.marketDays }}", 1340, 1620, { onError: 'continueRegularOutput' }),
  codeNode('B8207', 'Build Stat Report', code.buildStatReport, 1580, 1620),
  tgSend('B8208', 'Send Stat Report', 1820, 1620),
  codeNode('R1001', 'Prepare Recommendation', code.prepareRecommendation, 380, 1950),
  {
    parameters: {
      mode: 'rules',
      rules: {
        values: [
          { conditions: { conditions: [{ leftValue: '={{ $json.recommendationMode }}', rightValue: 'coin', operator: { type: 'string', operation: 'equals' } }], combinator: 'and' }, renameOutput: true, outputKey: 'coin' },
          { conditions: { conditions: [{ leftValue: '={{ $json.recommendationMode }}', rightValue: 'stock', operator: { type: 'string', operation: 'equals' } }], combinator: 'and' }, renameOutput: true, outputKey: 'stock' },
          { conditions: { conditions: [{ leftValue: '={{ $json.recommendationMode }}', rightValue: 'futures', operator: { type: 'string', operation: 'equals' } }], combinator: 'and' }, renameOutput: true, outputKey: 'futures' },
        ],
      },
      fallbackOutput: 'extra',
    },
    id: 'R1002',
    name: 'Recommendation Type',
    type: 'n8n-nodes-base.switch',
    typeVersion: 3.2,
    position: [620, 1950],
  },
  httpGet('B8301', 'CoinGecko Rec Markets', "=https://api.coingecko.com/api/v3/coins/markets?vs_currency={{ $('Config').first().json.quoteCurrency }}&order=market_cap_desc&per_page=100&page=1&price_change_percentage=24h,7d", 860, 1870, { onError: 'continueRegularOutput' }),
  codeNode('B8302', 'Format Rec Message', code.formatRecMessage, 1100, 1870),
  tgSend('B8303', 'Send Rec Message', 1340, 1870),
  execNode('R1003', 'Execute Market Recommendations', '={{ $json.dbCmd }}', 860, 2030),
  codeNode('R1004', 'Parse Market Recommendations', code.parseMarketRecommendations, 1100, 2030),
  ifNode('R1005', 'Market Recommendations OK?', '={{ $json.recommendationOk }}', 1340, 2030),
  codeNode('R1006', 'Format Market Recommendations', code.formatMarketRecommendations, 1580, 1950),
  codeNode('R1007', 'Build Recommendation Error', code.buildRecommendationError, 1580, 2110),
  tgSend('R1008', 'Send Market Recommendations', 1820, 1950),
  tgSend('R1009', 'Send Recommendation Usage', 860, 2190),
  httpGet('N1001', 'CoinGecko Search News', "=https://api.coingecko.com/api/v3/search?query={{ encodeURIComponent($('Parse Incoming Message').first().json.coinArg || $('Parse Incoming Message').first().json.args || 'bitcoin') }}", 380, -200, { onError: 'continueRegularOutput' }),
  codeNode('N1002', 'Resolve News Target', code.resolveNewsTarget, 620, -200),
  httpGetText('N1003', 'Fetch News Feed', "={{ $json.newsQueryUrl }}", 860, -200),
  codeNode('N1004', 'Parse News Feed', code.parseNewsFeed, 1100, -200),
  codeNode('N1005', 'Prepare Gemini News Prompt', code.prepareGeminiNewsPrompt, 1340, -200),
  httpPost('N1006', 'Gemini News Research', GEMINI_URL, '={{ JSON.stringify($json.geminiBody) }}', 1580, -200, 60000),
  codeNode('N1007', 'Format News Report', code.formatNewsReport, 1820, -200),
  tgSend('N1008', 'Send News Report', 2060, -200),
  httpGet('K1001', 'CoinGecko Search Risk', "=https://api.coingecko.com/api/v3/search?query={{ encodeURIComponent($('Parse Incoming Message').first().json.coinArg || $('Parse Incoming Message').first().json.args || 'bitcoin') }}", 380, -500, { onError: 'continueRegularOutput' }),
  codeNode('K1002', 'Extract Risk Coin', code.extractRiskCoin, 620, -500),
  ifNode('K1003', 'Is Risk Coin Found?', '={{ $json.found }}', 860, -500),
  tgSend('K1004', 'Send Risk Error', 860, -660),
  httpGet('K1005', 'CoinGecko Risk Market Chart', "=https://api.coingecko.com/api/v3/coins/{{ $json.coinId }}/market_chart?vs_currency={{ $('Config').first().json.quoteCurrency }}&days={{ $('Config').first().json.marketDays }}", 1100, -500, { onError: 'continueRegularOutput' }),
  httpGet('K1006', 'Fetch BTC Gate Risk', "=https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency={{ $('Config').first().json.quoteCurrency }}&days={{ $('Config').first().json.marketDays }}", 1340, -500, { onError: 'continueRegularOutput' }),
  codeNode('K1007', 'Calculate Risk Metrics', code.calculateRiskMetrics, 1580, -500),
  tgSend('K1008', 'Send Risk Report', 1820, -500),
  scheduleTrigger('C1001', 'Cron Every 30m', '*/30 * * * *', -1000, 2250),
  codeNode('C1002', 'Config Cron', code.config, -700, 2250, 'Config untuk cron execution'),
  execNode('C1003', 'Exec Check Alerts', 'node /home/node/.n8n/manage_positions.mjs check-alerts', -400, 2250),
  codeNode('C1004', 'Format Cron Alerts', code.formatCronAlerts, -160, 2250),
  ifNode('C1005', 'Has Alerts?', '={{ $json.hasAlerts }}', 80, 2250),
  tgSend('C1006', 'Send Cron Alert', 320, 2250),
  ifNode('C1006A', 'Is Telegram Send OK?', '={{ $json.ok === true }}', 560, 2250),
  execNode('C1007', 'Ack Cron Alert', "={{ $('Format Cron Alerts').first().json.ackCmd || 'echo ok' }}", 800, 2250),
];

const connections = {
  'Telegram Webhook':        { main: [[{ node: 'Config', type: 'main', index: 0 }]] },
  'Config':                  { main: [[{ node: 'Parse Incoming Message', type: 'main', index: 0 }]] },
  'Parse Incoming Message':  { main: [[{ node: 'Has Command?', type: 'main', index: 0 }]] },
  'Has Command?':            { main: [[{ node: 'Command Router', type: 'main', index: 0 }], []] },
  'Command Router':          { main: [
    [{ node: 'CoinGecko Search', type: 'main', index: 0 }],
    [{ node: 'Prepare Market Command', type: 'main', index: 0 }],
    [{ node: 'Prepare Market Command', type: 'main', index: 0 }],
    [{ node: 'Fetch Ask News', type: 'main', index: 0 }],
    [{ node: 'Prepare List Positions', type: 'main', index: 0 }],
    [{ node: 'CoinGecko Markets', type: 'main', index: 0 }],
    [{ node: 'Read History', type: 'main', index: 0 }],
    [{ node: 'Build Start', type: 'main', index: 0 }],
    [{ node: 'Build Help', type: 'main', index: 0 }],
    [{ node: 'CoinGecko Search Buy', type: 'main', index: 0 }],
    [{ node: 'Prepare Sell Query', type: 'main', index: 0 }],
    [{ node: 'Prepare Stat Query', type: 'main', index: 0 }],
    [{ node: 'Prepare Recommendation', type: 'main', index: 0 }],
    [{ node: 'CoinGecko Search News', type: 'main', index: 0 }],
    [{ node: 'CoinGecko Search Risk', type: 'main', index: 0 }],
    [{ node: 'Unknown Command', type: 'main', index: 0 }],
  ] },
  'Build Start':             { main: [[{ node: 'Send Start', type: 'main', index: 0 }]] },
  'Build Help':              { main: [[{ node: 'Send Help', type: 'main', index: 0 }]] },
  'CoinGecko Search':        { main: [[{ node: 'Extract Coin ID', type: 'main', index: 0 }]] },
  'Extract Coin ID':         { main: [[{ node: 'Coin Found?', type: 'main', index: 0 }]] },
  'Coin Found?':             { main: [
    [{ node: 'CoinGecko Market Chart', type: 'main', index: 0 }],
    [{ node: 'Send Coin Error', type: 'main', index: 0 }],
  ] },
  'CoinGecko Market Chart':  { main: [[{ node: 'Fetch BTC Gate', type: 'main', index: 0 }]] },
  'Fetch BTC Gate':          { main: [[{ node: 'BTC Gate', type: 'main', index: 0 }]] },
  'BTC Gate':                { main: [[{ node: 'Coin Technical', type: 'main', index: 0 }]] },
  'Coin Technical':          { main: [[{ node: 'Coin Technical OK?', type: 'main', index: 0 }]] },
  'Coin Technical OK?':      { main: [
    [{ node: 'Fetch Google News', type: 'main', index: 0 }],
    [{ node: 'Send Coin Error', type: 'main', index: 0 }],
  ] },
  'Fetch Google News':       { main: [[{ node: 'Parse News', type: 'main', index: 0 }]] },
  'Parse News':              { main: [[{ node: 'Prepare Read Prev', type: 'main', index: 0 }]] },
  'Prepare Read Prev':       { main: [[{ node: 'Read Previous Analysis', type: 'main', index: 0 }]] },
  'Read Previous Analysis':  { main: [[{ node: 'Parse Previous Analysis', type: 'main', index: 0 }]] },
  'Parse Previous Analysis': { main: [[{ node: 'Prepare Gemini Coin Prompt', type: 'main', index: 0 }]] },
  'Prepare Gemini Coin Prompt': { main: [[{ node: 'Gemini Coin Research', type: 'main', index: 0 }]] },
  'Gemini Coin Research':    { main: [[{ node: 'Build Coin Report', type: 'main', index: 0 }]] },
  'Build Coin Report':       { main: [[{ node: 'Send Coin Report', type: 'main', index: 0 }, { node: 'Prepare Save Coin', type: 'main', index: 0 }]] },
  'Prepare Save Coin':       { main: [[{ node: 'Save Coin Analysis', type: 'main', index: 0 }]] },

  // /stock and /futures
  'Prepare Market Command':  { main: [[{ node: 'Execute Market Analysis', type: 'main', index: 0 }]] },
  'Execute Market Analysis': { main: [[{ node: 'Parse Market Analysis Result', type: 'main', index: 0 }]] },
  'Parse Market Analysis Result': { main: [[{ node: 'Market Analysis OK?', type: 'main', index: 0 }]] },
  'Market Analysis OK?':     { main: [
    [{ node: 'Prepare Gemini Market Prompt', type: 'main', index: 0 }],
    [{ node: 'Build Market Error', type: 'main', index: 0 }],
  ] },
  'Prepare Gemini Market Prompt': { main: [[{ node: 'Gemini Market Research', type: 'main', index: 0 }]] },
  'Gemini Market Research':  { main: [[{ node: 'Build Market Report', type: 'main', index: 0 }]] },
  'Build Market Report':     { main: [[
    { node: 'Send Market Report', type: 'main', index: 0 },
    { node: 'Prepare Save Market', type: 'main', index: 0 },
  ]] },
  'Prepare Save Market':     { main: [[{ node: 'Save Market Analysis', type: 'main', index: 0 }]] },
  'Build Market Error':      { main: [[{ node: 'Send Market Error', type: 'main', index: 0 }]] },
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
  'Prepare Buy Exec':         { main: [[{ node: 'Is Buy Price OK?', type: 'main', index: 0 }]] },
  'Is Buy Price OK?':         { main: [
    [{ node: 'Execute Buy DB', type: 'main', index: 0 }],
    [{ node: 'Send Buy Error', type: 'main', index: 0 }],
  ] },
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
  'Prepare Recommendation':   { main: [[{ node: 'Recommendation Type', type: 'main', index: 0 }]] },
  'Recommendation Type':      { main: [
    [{ node: 'CoinGecko Rec Markets', type: 'main', index: 0 }],
    [{ node: 'Execute Market Recommendations', type: 'main', index: 0 }],
    [{ node: 'Execute Market Recommendations', type: 'main', index: 0 }],
    [{ node: 'Send Recommendation Usage', type: 'main', index: 0 }],
  ] },
  'CoinGecko Rec Markets':    { main: [[{ node: 'Format Rec Message', type: 'main', index: 0 }]] },
  'Format Rec Message':       { main: [[{ node: 'Send Rec Message', type: 'main', index: 0 }]] },
  'Execute Market Recommendations': { main: [[{ node: 'Parse Market Recommendations', type: 'main', index: 0 }]] },
  'Parse Market Recommendations': { main: [[{ node: 'Market Recommendations OK?', type: 'main', index: 0 }]] },
  'Market Recommendations OK?': { main: [
    [{ node: 'Format Market Recommendations', type: 'main', index: 0 }],
    [{ node: 'Build Recommendation Error', type: 'main', index: 0 }],
  ] },
  'Format Market Recommendations': { main: [[{ node: 'Send Market Recommendations', type: 'main', index: 0 }]] },
  'Build Recommendation Error': { main: [[{ node: 'Send Market Recommendations', type: 'main', index: 0 }]] },

  // /news
  'CoinGecko Search News':    { main: [[{ node: 'Resolve News Target', type: 'main', index: 0 }]] },
  'Resolve News Target':      { main: [[{ node: 'Fetch News Feed', type: 'main', index: 0 }]] },
  'Fetch News Feed':          { main: [[{ node: 'Parse News Feed', type: 'main', index: 0 }]] },
  'Parse News Feed':          { main: [[{ node: 'Prepare Gemini News Prompt', type: 'main', index: 0 }]] },
  'Prepare Gemini News Prompt': { main: [[{ node: 'Gemini News Research', type: 'main', index: 0 }]] },
  'Gemini News Research':     { main: [[{ node: 'Format News Report', type: 'main', index: 0 }]] },
  'Format News Report':       { main: [[{ node: 'Send News Report', type: 'main', index: 0 }]] },

  // /risk
  'CoinGecko Search Risk':      { main: [[{ node: 'Extract Risk Coin', type: 'main', index: 0 }]] },
  'Extract Risk Coin':          { main: [[{ node: 'Is Risk Coin Found?', type: 'main', index: 0 }]] },
  'Is Risk Coin Found?':        { main: [
    [{ node: 'CoinGecko Risk Market Chart', type: 'main', index: 0 }],
    [{ node: 'Send Risk Error', type: 'main', index: 0 }],
  ] },
  'CoinGecko Risk Market Chart':{ main: [[{ node: 'Fetch BTC Gate Risk', type: 'main', index: 0 }]] },
  'Fetch BTC Gate Risk':        { main: [[{ node: 'Calculate Risk Metrics', type: 'main', index: 0 }]] },
  'Calculate Risk Metrics':     { main: [[{ node: 'Send Risk Report', type: 'main', index: 0 }]] },

  // Cron Alert
  'Cron Every 30m':           { main: [[{ node: 'Config Cron', type: 'main', index: 0 }]] },
  'Config Cron':              { main: [[{ node: 'Exec Check Alerts', type: 'main', index: 0 }]] },
  'Exec Check Alerts':        { main: [[{ node: 'Format Cron Alerts', type: 'main', index: 0 }]] },
  'Format Cron Alerts':       { main: [[{ node: 'Has Alerts?', type: 'main', index: 0 }]] },
  'Has Alerts?':              { main: [
    [{ node: 'Send Cron Alert', type: 'main', index: 0 }],
    [],
  ] },
  'Send Cron Alert':          { main: [[{ node: 'Is Telegram Send OK?', type: 'main', index: 0 }]] },
  'Is Telegram Send OK?':     { main: [
    [{ node: 'Ack Cron Alert', type: 'main', index: 0 }],
    [],
  ] },
};

const workflow = {
  id: 'RzqHFpZWsPL7CsM1',
  name: 'Luna Hernandez — Multi-Market Decision Support',
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
  versionId: 'B9000000-0000-4000-8000-000000000008',
  meta: { templateCredsSetupCompleted: true },
  tags: [],
};

const jsonOutput = JSON.stringify(workflow, null, 2) + '\n';
writeFileSync('/home/nothrovo/Projects/Midas/midas-bot.n8n.json', jsonOutput);
writeFileSync('/home/nothrovo/Projects/Midas/docker/n8n-data/midas-bot.n8n.json', jsonOutput);
copyFileSync(new URL('./lib/market-analysis.mjs', import.meta.url), new URL('./docker/n8n-data/market-analysis.mjs', import.meta.url));
copyFileSync(new URL('./lib/market-providers.mjs', import.meta.url), new URL('./docker/n8n-data/market-providers.mjs', import.meta.url));

console.log('midas-bot.n8n.json generated — ' + nodes.length + ' nodes, ' + Object.keys(connections).length + ' connections (Full Portfolio & Recommendation Suite)');
