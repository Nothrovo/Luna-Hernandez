import {
  MarketAnalysisError,
  analyzeFuturesMarket,
  analyzeStockMarket,
  normalizeAlpacaBars,
  normalizeBinanceKlines,
  parseGoogleNewsRss,
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
  const query = new URLSearchParams({
    timeframe,
    start: isoDate(start),
    end: isoDate(end),
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
