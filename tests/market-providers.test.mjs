import assert from 'node:assert/strict';
import test from 'node:test';

import {
  fetchFuturesMarketAnalysis,
  fetchStockMarketAnalysis,
  requestWithRetry,
} from '../lib/market-providers.mjs';

const DAY = 86_400_000;
const HOUR = 3_600_000;

function alpacaBars(count, step, symbol, drift = 0.2) {
  const now = Date.UTC(2026, 8, 10, 0);
  return {
    bars: Array.from({ length: count }, (_, index) => {
      const close = 100 + index * drift;
      return {
        t: new Date(now - (count - index) * step).toISOString(),
        o: close - 0.2, h: close + 1, l: close - 1, c: close, v: 1_000 + index,
      };
    }),
    symbol,
  };
}

function binanceKlines(count, step) {
  const now = Date.UTC(2026, 8, 10, 0);
  return Array.from({ length: count }, (_, index) => {
    const openTime = now - (count - index) * step;
    const close = 100 + index * 0.2;
    return [openTime, String(close - 0.2), String(close + 1), String(close - 1), String(close), '1000', openTime + step - 1];
  });
}

test('stock provider uses Alpaca IEX headers, SEC company facts, and optional-source fallbacks', async () => {
  const calls = [];
  const fetchJson = async (url, options = {}) => {
    calls.push({ url, options });
    if (url.includes('/v2/clock')) return { is_open: false, next_open: '2026-09-11T13:30:00Z' };
    if (url.includes('/files/company_tickers.json')) return { 0: { cik_str: 1234, ticker: 'FIX', title: 'Fixture Corp' } };
    if (url.includes('/api/xbrl/companyfacts/CIK0000001234.json')) return { entityName: 'Fixture Corp', facts: {} };
    if (url.includes('/SPY/bars')) return alpacaBars(300, DAY, 'SPY', 0.05);
    if (url.includes('timeframe=1Hour')) return alpacaBars(420, HOUR, 'FIX', 0.08);
    if (url.includes('timeframe=4Hour')) return alpacaBars(120, 4 * HOUR, 'FIX', 0.12);
    if (url.includes('/FIX/bars')) return alpacaBars(300, DAY, 'FIX', 0.2);
    throw new Error(`unexpected URL ${url}`);
  };
  const fetchText = async url => {
    calls.push({ url, options: {} });
    return '<rss><channel></channel></rss>';
  };

  const result = await fetchStockMarketAnalysis('fix', {
    fetchJson,
    fetchText,
    nowMs: Date.UTC(2026, 8, 11, 12),
    alpacaKey: 'free-key',
    alpacaSecret: 'free-secret',
    secUserAgent: 'Midas test@example.com',
  });

  assert.equal(result.symbol, 'FIX');
  assert.equal(result.provider, 'alpaca-iex+sec-edgar');
  const alpacaCall = calls.find(call => call.url.includes('data.alpaca.markets'));
  assert.equal(alpacaCall.options.headers['APCA-API-KEY-ID'], 'free-key');
  assert.equal(alpacaCall.options.headers['APCA-API-SECRET-KEY'], 'free-secret');
  assert.ok(calls.some(call => call.url.includes('feed=iex')));
  assert.ok(calls.some(call => call.url.includes('timeframe=4Hour')));
  assert.ok(calls.some(call => call.url.includes('data.sec.gov/api/xbrl/companyfacts/CIK0000001234.json')));
});

test('futures provider uses only Binance public USD-M analysis endpoints', async () => {
  const calls = [];
  const fetchJson = async url => {
    calls.push(url);
    const interval = new URL(url).searchParams.get('interval');
    if (url.includes('/fapi/v1/klines')) {
      const step = interval === '15m' ? 15 * 60_000 : interval === '1h' ? HOUR : interval === '4h' ? 4 * HOUR : DAY;
      return binanceKlines(260, step);
    }
    if (url.includes('/fapi/v1/premiumIndex')) return { markPrice: '150', indexPrice: '149', lastFundingRate: '0.0001' };
    if (url.includes('/fapi/v1/fundingRate')) return [{ fundingRate: '0.0001', fundingTime: 1 }];
    if (url.includes('/futures/data/openInterestHist')) return [
      { timestamp: 1, sumOpenInterest: '1000' },
      { timestamp: 2, sumOpenInterest: '1100' },
    ];
    throw new Error(`unexpected URL ${url}`);
  };

  const result = await fetchFuturesMarketAnalysis('btc', {
    fetchJson,
    fetchText: async () => '<rss><channel></channel></rss>',
    nowMs: Date.UTC(2026, 8, 11, 12),
  });

  assert.equal(result.symbol, 'BTCUSDT');
  assert.equal(result.provider, 'binance-usdm');
  assert.equal(calls.filter(url => url.includes('/fapi/v1/klines')).length, 4);
  assert.ok(calls.some(url => url.includes('/fapi/v1/premiumIndex')));
  assert.ok(calls.some(url => url.includes('/futures/data/openInterestHist')));
  assert.equal(calls.some(url => url.includes('/api/v3/ticker/price')), false);
});

test('provider retry includes asynchronous JSON parse failures', async t => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  let attempts = 0;
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => {
      attempts += 1;
      if (attempts === 1) throw new SyntaxError('truncated body');
      return { ok: true };
    },
  });
  const result = await requestWithRetry('https://provider.invalid/fixture', { maxAttempts: 2 });
  assert.deepEqual(result, { ok: true });
  assert.equal(attempts, 2);
});

test('futures provider rejects non-USDT quote pairs instead of silently rewriting them', async () => {
  await assert.rejects(
    fetchFuturesMarketAnalysis('BTCUSDC', { fetchJson: async () => ({}) }),
    error => error.code === 'INVALID_SYMBOL',
  );
});
