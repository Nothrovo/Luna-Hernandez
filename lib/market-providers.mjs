import {
  MarketAnalysisError,
  analyzeFuturesMarket,
  analyzeStockMarket,
  normalizeAlpacaBars,
  normalizeBinanceKlines,
  parseGoogleNewsRss,
  rankFuturesRecommendations,
  rankStockRecommendations,
} from './market-analysis.mjs';

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

function delay(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

export async function requestWithRetry(url, {
  headers = {},
  responseType = 'json',
  maxAttempts = 2,
  timeoutMs = 20_000,
} = {}) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      let response;
      try {
        response = await fetch(url, { headers, signal: controller.signal });
      } finally {
        clearTimeout(timeout);
      }
      if (!response.ok) {
        const retryable = response.status === 429 || response.status >= 500;
        throw new MarketAnalysisError(
          response.status === 429 ? 'RATE_LIMITED' : 'PROVIDER_HTTP_ERROR',
          `Provider returned HTTP ${response.status}`,
          { retryable, details: { url, status: response.status } },
        );
      }
      return responseType === 'text' ? await response.text() : await response.json();
    } catch (error) {
      lastError = error;
      const retryable = error instanceof MarketAnalysisError ? error.retryable : true;
      if (!retryable || attempt === maxAttempts) break;
      await delay(250 * 2 ** (attempt - 1));
    }
  }
  if (lastError instanceof MarketAnalysisError) throw lastError;
  throw new MarketAnalysisError('PROVIDER_UNAVAILABLE', lastError?.message || 'Provider request failed', { retryable: true });
}

function isoDate(milliseconds) {
  return new Date(milliseconds).toISOString();
}

export function buildAlpacaBarsUrl(symbol, timeframe, { start, end, limit = 1000 } = {}) {
  const normalized = String(symbol || '').toUpperCase();
  const bucketMs = timeframe === '1Day' ? 15 * 60_000 : 5 * 60_000;
  const roundedStart = start != null ? Math.floor(start / bucketMs) * bucketMs : start;
  const roundedEnd = end != null ? Math.floor(end / bucketMs) * bucketMs : end;
  const query = new URLSearchParams({
    timeframe,
    start: isoDate(roundedStart),
    end: isoDate(roundedEnd),
    limit: String(limit),
    adjustment: 'all',
    feed: 'iex',
    sort: 'asc',
  });
  return `https://data.alpaca.markets/v2/stocks/${encodeURIComponent(normalized)}/bars?${query}`;
}

function normalizeStockSymbol(symbol) {
  const normalized = String(symbol || '').trim().toUpperCase();
  if (!/^[A-Z][A-Z0-9.-]{0,9}$/.test(normalized)) {
    throw new MarketAnalysisError('INVALID_SYMBOL', 'Gunakan simbol saham AS yang valid, contoh: AAPL atau BRK.B.');
  }
  return normalized;
}

function normalizeFuturesSymbol(symbol) {
  let normalized = String(symbol || '').trim().toUpperCase().replace(/[\s/_-]/g, '');
  if (/(?:USD|USDC|BUSD)$/.test(normalized) && !normalized.endsWith('USDT')) {
    throw new MarketAnalysisError('INVALID_SYMBOL', 'Saat ini hanya pair Binance USD-M berquote USDT yang didukung.');
  }
  if (/^[A-Z0-9]{2,10}$/.test(normalized) && !normalized.endsWith('USDT')) normalized += 'USDT';
  if (!/^[A-Z0-9]{5,20}$/.test(normalized) || !normalized.endsWith('USDT')) {
    throw new MarketAnalysisError('INVALID_SYMBOL', 'Gunakan pair Binance USD-M, contoh: BTCUSDT atau BTC.');
  }
  return normalized;
}

function companyFromTickerMap(payload, symbol) {
  return Object.values(payload || {}).find(entry => String(entry?.ticker || '').toUpperCase() === symbol) || null;
}

export async function fetchStockMarketAnalysis(symbol, {
  fetchJson = (url, options) => requestWithRetry(url, { ...options, responseType: 'json' }),
  fetchText = (url, options) => requestWithRetry(url, { ...options, responseType: 'text' }),
  nowMs = Date.now(),
  alpacaKey = process.env.ALPACA_API_KEY_ID,
  alpacaSecret = process.env.ALPACA_API_SECRET,
  secUserAgent = process.env.SEC_USER_AGENT,
} = {}) {
  const normalizedSymbol = normalizeStockSymbol(symbol);
  if (!alpacaKey || !alpacaSecret) {
    throw new MarketAnalysisError(
      'CONFIG_MISSING',
      'ALPACA_API_KEY_ID dan ALPACA_API_SECRET wajib diisi untuk /stock.',
    );
  }
  const alpacaHeaders = {
    'APCA-API-KEY-ID': alpacaKey,
    'APCA-API-SECRET-KEY': alpacaSecret,
    'User-Agent': 'Midas-Luna/3.0',
  };
  const end = nowMs - 16 * 60_000;
  const hourlyUrl = buildAlpacaBarsUrl(normalizedSymbol, '1Hour', {
    start: nowMs - 120 * DAY_MS,
    end,
  });
  const dailyUrl = buildAlpacaBarsUrl(normalizedSymbol, '1Day', {
    start: nowMs - 450 * DAY_MS,
    end,
  });
  const fourHourUrl = buildAlpacaBarsUrl(normalizedSymbol, '4Hour', {
    start: nowMs - 240 * DAY_MS,
    end,
  });
  const benchmarkUrl = buildAlpacaBarsUrl('SPY', '1Day', {
    start: nowMs - 450 * DAY_MS,
    end,
  });

  let hourlyPayload;
  let fourHourPayload;
  let dailyPayload;
  let benchmarkPayload;
  try {
    [hourlyPayload, fourHourPayload, dailyPayload, benchmarkPayload] = await Promise.all([
      fetchJson(hourlyUrl, { headers: alpacaHeaders }),
      fetchJson(fourHourUrl, { headers: alpacaHeaders }),
      fetchJson(dailyUrl, { headers: alpacaHeaders }),
      fetchJson(benchmarkUrl, { headers: alpacaHeaders }),
    ]);
  } catch (error) {
    if (error instanceof MarketAnalysisError) throw error;
    throw new MarketAnalysisError('ALPACA_UNAVAILABLE', error?.message || 'Gagal mengambil data Alpaca', { retryable: true });
  }

  const clock = await fetchJson('https://paper-api.alpaca.markets/v2/clock', { headers: alpacaHeaders })
    .catch(() => null);
  const secHeaders = {
    'User-Agent': secUserAgent || 'Midas-Luna contact@example.com',
    Accept: 'application/json',
  };
  let company = null;
  let companyFacts = null;
  try {
    const tickerMap = await fetchJson('https://www.sec.gov/files/company_tickers.json', { headers: secHeaders });
    company = companyFromTickerMap(tickerMap, normalizedSymbol);
    if (company?.cik_str != null) {
      const cik = String(company.cik_str).padStart(10, '0');
      companyFacts = await fetchJson(`https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`, { headers: secHeaders });
    }
  } catch {
    companyFacts = null;
  }
  const newsUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(`${normalizedSymbol} stock`)}&hl=en&gl=US&ceid=US:en`;
  const newsXml = await fetchText(newsUrl, { headers: { 'User-Agent': 'Midas-Luna/3.0' } }).catch(() => '');

  const result = analyzeStockMarket({
    symbol: normalizedSymbol,
    companyName: company?.title || companyFacts?.entityName || normalizedSymbol,
    hourlyBars: normalizeAlpacaBars(hourlyPayload, { symbol: normalizedSymbol, timeframeMs: HOUR_MS, nowMs }),
    fourHourBars: normalizeAlpacaBars(fourHourPayload, { symbol: normalizedSymbol, timeframeMs: 4 * HOUR_MS, nowMs }),
    dailyBars: normalizeAlpacaBars(dailyPayload, { symbol: normalizedSymbol, timeframeMs: DAY_MS, nowMs }),
    benchmarkDailyBars: normalizeAlpacaBars(benchmarkPayload, { symbol: 'SPY', timeframeMs: DAY_MS, nowMs }),
    companyFacts,
    clock,
    news: parseGoogleNewsRss(newsXml, { nowMs }),
    nowMs,
  });
  return {
    ...result,
    provider: 'alpaca-iex+sec-edgar',
    dataQuality: {
      priceFeed: 'IEX',
      delayedByProviderPlan: true,
      fundamentalsAvailable: result.fundamental.available,
      newsCount: result.news.length,
    },
  };
}

function binanceKlineUrl(symbol, interval, limit) {
  const query = new URLSearchParams({ symbol, interval, limit: String(limit) });
  return `https://fapi.binance.com/fapi/v1/klines?${query}`;
}

export async function fetchFuturesMarketAnalysis(symbol, {
  fetchJson = (url, options) => requestWithRetry(url, { ...options, responseType: 'json' }),
  fetchText = (url, options) => requestWithRetry(url, { ...options, responseType: 'text' }),
  nowMs = Date.now(),
} = {}) {
  const normalizedSymbol = normalizeFuturesSymbol(symbol);
  const publicHeaders = { 'User-Agent': 'Midas-Luna/3.0', Accept: 'application/json' };
  const intervals = { '15m': 15 * 60_000, '1h': HOUR_MS, '4h': 4 * HOUR_MS, '1d': DAY_MS };
  let payloads;
  try {
    payloads = await Promise.all([
      ...Object.keys(intervals).map(interval => fetchJson(binanceKlineUrl(normalizedSymbol, interval, 300), { headers: publicHeaders })),
      fetchJson(`https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${encodeURIComponent(normalizedSymbol)}`, { headers: publicHeaders }),
      fetchJson(`https://fapi.binance.com/fapi/v1/fundingRate?symbol=${encodeURIComponent(normalizedSymbol)}&limit=100`, { headers: publicHeaders }),
      fetchJson(`https://fapi.binance.com/futures/data/openInterestHist?symbol=${encodeURIComponent(normalizedSymbol)}&period=1h&limit=30`, { headers: publicHeaders }),
    ]);
  } catch (error) {
    if (error instanceof MarketAnalysisError) throw error;
    throw new MarketAnalysisError('BINANCE_UNAVAILABLE', error?.message || 'Gagal mengambil data Binance Futures', { retryable: true });
  }
  const [m15, h1, h4, d1, premiumIndex, fundingHistory, openInterestHistory] = payloads;
  const baseAsset = normalizedSymbol.slice(0, -4);
  const newsUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(`${baseAsset} crypto futures`)}&hl=en&gl=US&ceid=US:en`;
  const newsXml = await fetchText(newsUrl, { headers: { 'User-Agent': 'Midas-Luna/3.0' } }).catch(() => '');
  const result = analyzeFuturesMarket({
    symbol: normalizedSymbol,
    klinesByTimeframe: {
      '15m': normalizeBinanceKlines(m15, { nowMs }),
      '1h': normalizeBinanceKlines(h1, { nowMs }),
      '4h': normalizeBinanceKlines(h4, { nowMs }),
      '1d': normalizeBinanceKlines(d1, { nowMs }),
    },
    premiumIndex,
    fundingHistory,
    openInterestHistory,
    news: parseGoogleNewsRss(newsXml, { nowMs }),
  });
  return {
    ...result,
    provider: 'binance-usdm',
    dataQuality: {
      priceType: 'mark_price',
      closedCandlesOnly: true,
      newsCount: result.news.length,
    },
  };
}

export const DEFAULT_STOCK_RECOMMENDATION_UNIVERSE = Object.freeze([
  'AAPL', 'MSFT', 'NVDA', 'AMZN', 'META', 'GOOGL',
  'TSLA', 'AVGO', 'JPM', 'LLY', 'AMD', 'NFLX',
]);

function normalizeStockUniverse(universe) {
  const symbols = [...new Set((universe || []).map(symbol => String(symbol).trim().toUpperCase()))]
    .filter(symbol => /^[A-Z][A-Z0-9.-]{0,9}$/.test(symbol) && symbol !== 'SPY');
  if (!symbols.length) throw new MarketAnalysisError('INVALID_UNIVERSE', 'Stock recommendation universe is empty');
  return symbols.slice(0, 20);
}

export async function fetchStockRecommendations({
  universe = DEFAULT_STOCK_RECOMMENDATION_UNIVERSE,
  fetchJson = (url, options) => requestWithRetry(url, { ...options, responseType: 'json' }),
  nowMs = Date.now(),
  alpacaKey = process.env.ALPACA_API_KEY_ID,
  alpacaSecret = process.env.ALPACA_API_SECRET,
} = {}) {
  if (!alpacaKey || !alpacaSecret) {
    throw new MarketAnalysisError('CONFIG_MISSING', 'ALPACA_API_KEY_ID dan ALPACA_API_SECRET wajib diisi untuk /rec stock.');
  }
  const symbols = normalizeStockUniverse(universe);
  const headers = {
    'APCA-API-KEY-ID': alpacaKey,
    'APCA-API-SECRET-KEY': alpacaSecret,
    'User-Agent': 'Midas-Luna/3.1',
  };
  const end = nowMs - 16 * 60_000;
  const start = nowMs - 450 * DAY_MS;
  const fetchDailyBars = async symbol => {
    const payload = await fetchJson(buildAlpacaBarsUrl(symbol, '1Day', { start, end }), { headers });
    return normalizeAlpacaBars(payload, { symbol, timeframeMs: DAY_MS, nowMs });
  };
  let benchmarkDailyBars;
  try {
    benchmarkDailyBars = await fetchDailyBars('SPY');
  } catch (error) {
    if (error instanceof MarketAnalysisError) throw error;
    throw new MarketAnalysisError('ALPACA_UNAVAILABLE', error?.message || 'Gagal mengambil benchmark SPY', { retryable: true });
  }
  let lastFetchError = null;
  const settled = [];
  for (let i = 0; i < symbols.length; i += 4) {
    const chunk = symbols.slice(i, i + 4);
    const chunkResults = await Promise.all(chunk.map(async symbol => {
      try {
        const dailyBars = await fetchDailyBars(symbol);
        return dailyBars.length >= 35 ? { symbol, dailyBars } : null;
      } catch (err) {
        lastFetchError = err;
        return null;
      }
    }));
    settled.push(...chunkResults);
  }
  const successful = settled.filter(Boolean);
  if (!successful.length) {
    if (lastFetchError instanceof MarketAnalysisError) throw lastFetchError;
    throw new MarketAnalysisError('ALPACA_UNAVAILABLE', lastFetchError?.message || 'Tidak ada simbol universe yang mengembalikan candle harian cukup', { retryable: true });
  }
  const ranked = rankStockRecommendations({
    benchmarkDailyBars,
    candidates: successful,
    limit: 3,
  });
  return {
    ...ranked,
    provider: 'alpaca-iex',
    asOf: ranked.candidates[0]?.asOf || null,
    delayed: true,
    universeCount: symbols.length,
    successfulSymbols: successful.length,
  };
}

function oiChangeFromHistory(rows) {
  const values = (rows || [])
    .map(row => Number(row?.sumOpenInterestValue ?? row?.sumOpenInterest))
    .filter(value => Number.isFinite(value) && value > 0);
  return values.length >= 2 ? (values.at(-1) / values[0] - 1) * 100 : null;
}

export async function fetchFuturesRecommendations({
  fetchJson = (url, options) => requestWithRetry(url, { ...options, responseType: 'json' }),
  nowMs = Date.now(),
  shortlistLimit = 12,
} = {}) {
  const headers = { 'User-Agent': 'Midas-Luna/3.1', Accept: 'application/json' };
  let exchangeInfo;
  let tickers;
  let premiums;
  try {
    [exchangeInfo, tickers, premiums] = await Promise.all([
      fetchJson('https://fapi.binance.com/fapi/v1/exchangeInfo', { headers }),
      fetchJson('https://fapi.binance.com/fapi/v1/ticker/24hr', { headers }),
      fetchJson('https://fapi.binance.com/fapi/v1/premiumIndex', { headers }),
    ]);
  } catch (error) {
    if (error instanceof MarketAnalysisError) throw error;
    throw new MarketAnalysisError('BINANCE_UNAVAILABLE', error?.message || 'Gagal mengambil universe Binance Futures', { retryable: true });
  }
  if (!exchangeInfo || !Array.isArray(exchangeInfo.symbols) || !Array.isArray(tickers) || !Array.isArray(premiums)) {
    throw new MarketAnalysisError('INVALID_PROVIDER_RESPONSE', 'Universe Binance Futures tidak memiliki bentuk data yang diharapkan', { retryable: true });
  }
  const stableBases = new Set(['USDC', 'FDUSD', 'USDE', 'DAI', 'TUSD', 'BUSD']);
  const eligible = new Set((exchangeInfo?.symbols || [])
    .filter(item => item?.contractType === 'PERPETUAL' && item?.status === 'TRADING' && item?.quoteAsset === 'USDT')
    .filter(item => !stableBases.has(String(item.baseAsset || item.symbol?.slice(0, -4)).toUpperCase()))
    .map(item => item.symbol));
  const boundedLimit = clampProviderLimit(shortlistLimit, 3, 20);
  const shortlist = (Array.isArray(tickers) ? tickers : [])
    .filter(ticker => eligible.has(ticker?.symbol) && Number(ticker?.quoteVolume) > 0)
    .sort((left, right) => Number(right.quoteVolume) - Number(left.quoteVolume))
    .slice(0, boundedLimit);
  const premiumBySymbol = new Map((Array.isArray(premiums) ? premiums : [premiums])
    .filter(Boolean).map(item => [item.symbol, item]));
  const settled = await Promise.all(shortlist.map(async ticker => {
    const symbol = ticker.symbol;
    try {
      const [klines, openInterest] = await Promise.all([
        fetchJson(binanceKlineUrl(symbol, '4h', 200), { headers }),
        fetchJson(`https://fapi.binance.com/futures/data/openInterestHist?symbol=${encodeURIComponent(symbol)}&period=4h&limit=7`, { headers }).catch(() => []),
      ]);
      const premium = premiumBySymbol.get(symbol) || {};
      if (!Number.isFinite(Number(premium.markPrice)) || !Number.isFinite(Number(premium.lastFundingRate))) return null;
      const fourHourBars = normalizeBinanceKlines(klines, { nowMs });
      if (fourHourBars.length < 35) return null;
      return {
        symbol,
        fourHourBars,
        quoteVolume: Number(ticker.quoteVolume),
        priceChange24h: Number(ticker.priceChangePercent),
        markPrice: Number(premium.markPrice),
        fundingRate: Number(premium.lastFundingRate),
        oiChangePct: oiChangeFromHistory(openInterest),
      };
    } catch {
      return null;
    }
  }));
  const successful = settled.filter(Boolean);
  if (!successful.length) {
    throw new MarketAnalysisError('BINANCE_UNAVAILABLE', 'Tidak ada pair shortlist yang mengembalikan candle/funding cukup', { retryable: true });
  }
  const ranked = rankFuturesRecommendations({ candidates: successful, limit: 3 });
  return {
    ...ranked,
    provider: 'binance-usdm',
    asOf: ranked.candidates[0]?.asOf || null,
    delayed: false,
    universeCount: eligible.size,
    scannedCount: shortlist.length,
    successfulSymbols: successful.length,
  };
}

function clampProviderLimit(value, minimum, maximum) {
  const parsed = Number.isFinite(Number(value)) ? Math.trunc(Number(value)) : minimum;
  return Math.max(minimum, Math.min(maximum, parsed));
}
