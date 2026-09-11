import assert from 'node:assert/strict';
import test from 'node:test';

import {
  aggregateCandlesByCount,
  aggregateWeeklyCandles,
  analyzeFuturesMarket,
  analyzeStockMarket,
  calculateLinearFuturesPnl,
  normalizeAlpacaBars,
  normalizeBinanceKlines,
  parseGoogleNewsRss,
} from '../lib/market-analysis.mjs';

const DAY = 86_400_000;
const HOUR = 3_600_000;

function candles(count, { start = Date.UTC(2024, 0, 1), step = DAY, base = 100, drift = 0.4 } = {}) {
  return Array.from({ length: count }, (_, index) => {
    const close = base + index * drift + Math.sin(index / 4) * 1.5;
    return {
      ts: start + index * step,
      open: close - 0.3,
      high: close + 1.2,
      low: close - 1.1,
      close,
      volume: 1_000 + index * 7,
    };
  });
}

function secAnnual(val, end, filed) {
  const endMs = Date.parse(end);
  return {
    val,
    start: new Date(endMs - 364 * DAY).toISOString().slice(0, 10),
    end,
    filed,
    form: '10-K',
    fp: 'FY',
  };
}

function secInstant(val, end, filed, form = '10-Q') {
  return { val, end, filed, form };
}

function stockCompanyFacts() {
  const annual = (older, latest) => ({
    units: {
      USD: [
        secAnnual(older, '2024-12-31', '2025-02-15'),
        secAnnual(latest, '2025-12-31', '2026-02-15'),
      ],
    },
  });
  const instant = value => ({ units: { USD: [secInstant(value, '2026-06-30', '2026-08-01')] } });

  return {
    entityName: 'Fixture Corp',
    facts: {
      'us-gaap': {
        RevenueFromContractWithCustomerExcludingAssessedTax: annual(1_000, 1_200),
        NetIncomeLoss: annual(180, 240),
        NetCashProvidedByUsedInOperatingActivities: annual(250, 300),
        PaymentsToAcquirePropertyPlantAndEquipment: annual(80, 100),
        AssetsCurrent: instant(600),
        LiabilitiesCurrent: instant(300),
        Assets: instant(1_200),
        Liabilities: instant(800),
        StockholdersEquity: instant(400),
        CashAndCashEquivalentsAtCarryingValue: instant(150),
        LongTermDebtAndFinanceLeaseObligationsCurrent: instant(20),
        LongTermDebtAndFinanceLeaseObligationsNoncurrent: instant(180),
      },
      dei: {
        EntityCommonStockSharesOutstanding: {
          units: { shares: [secInstant(100, '2026-06-30', '2026-08-01')] },
        },
      },
    },
  };
}

test('provider normalizers reject malformed and still-open candles', () => {
  const now = Date.UTC(2026, 0, 2, 12);
  const alpaca = normalizeAlpacaBars({ bars: [
    { t: new Date(now - 2 * HOUR).toISOString(), o: 10, h: 12, l: 9, c: 11, v: 100 },
    { t: new Date(now - 30 * 60_000).toISOString(), o: 11, h: 13, l: 10, c: 12, v: 120 },
    { t: 'bad', o: 1, h: 2, l: 0, c: 1, v: 1 },
  ] }, { timeframeMs: HOUR, nowMs: now });
  assert.equal(alpaca.length, 1);
  assert.equal(alpaca[0].close, 11);

  const binance = normalizeBinanceKlines([
    [now - 2 * HOUR, '10', '12', '9', '11', '100', now - HOUR - 1],
    [now - HOUR, '11', '13', '10', '12', '120', now + 1],
  ], { nowMs: now });
  assert.equal(binance.length, 1);
  assert.equal(binance[0].close, 11);
});

test('intraday aggregation never combines candles across an overnight market gap', () => {
  const firstSession = candles(6, { start: Date.UTC(2026, 8, 8, 13), step: HOUR });
  const secondSession = candles(6, { start: Date.UTC(2026, 8, 9, 13), step: HOUR, base: 110 });
  const aggregated = aggregateCandlesByCount([...firstSession, ...secondSession], 4);
  assert.equal(aggregated.length, 2);
  assert.equal(aggregated[0].ts, firstSession[0].ts);
  assert.equal(aggregated[0].close, firstSession[3].close);
  assert.equal(aggregated[1].ts, secondSession[0].ts);
  assert.equal(aggregated[1].close, secondSession[3].close);
});

test('weekly aggregation excludes the still-open calendar week', () => {
  const now = Date.UTC(2026, 8, 9, 18);
  const daily = candles(10, { start: Date.UTC(2026, 7, 31), step: DAY });
  const weekly = aggregateWeeklyCandles(daily, { nowMs: now });
  assert.equal(weekly.length, 1);
  assert.equal(weekly[0].ts, Date.UTC(2026, 7, 31));
});

test('stock analysis combines multi-timeframe technicals, relative strength, fundamentals, and DCF', () => {
  const dailyBars = candles(300, { base: 80, drift: 0.35 });
  const hourlyBars = candles(420, { step: HOUR, base: 120, drift: 0.08 });
  const benchmarkDailyBars = candles(300, { base: 100, drift: 0.08 });
  const result = analyzeStockMarket({
    symbol: 'FIX',
    companyName: 'Fixture Corp',
    hourlyBars,
    dailyBars,
    benchmarkDailyBars,
    companyFacts: stockCompanyFacts(),
    clock: { is_open: false, next_open: '2026-09-14T13:30:00Z' },
    news: [],
  });

  assert.equal(result.assetClass, 'stock');
  assert.ok(Math.abs(result.price - hourlyBars.at(-1).close) < 1e-7);
  assert.deepEqual(Object.keys(result.technical.timeframes), ['1h', '4h', '1d', '1w']);
  assert.equal(result.technical.timeframes['1d'].periodsPerYear, 252);
  assert.ok(result.technical.relativeStrength20d > 0);
  assert.equal(result.fundamental.revenueGrowthPct, 20);
  assert.equal(result.fundamental.netMarginPct, 20);
  assert.equal(result.fundamental.freeCashFlow, 200);
  assert.equal(result.fundamental.currentRatio, 2);
  assert.equal(result.fundamental.liabilitiesToEquity, 2);
  assert.ok(result.fundamental.score >= 0 && result.fundamental.score <= 100);
  assert.ok(result.fundamental.dcfScenarios.bear.fairValuePerShare > 0);
  assert.equal(result.marketSession.isOpen, false);
  assert.match(result.verdict, /BUY|HOLD|SELL/);
});

test('futures analysis uses canonical side enums and classifies price/OI regime', () => {
  const byFrame = {
    '15m': candles(260, { step: 15 * 60_000, base: 80, drift: 0.08 }),
    '1h': candles(260, { step: HOUR, base: 80, drift: 0.15 }),
    '4h': candles(260, { step: 4 * HOUR, base: 80, drift: 0.25 }),
    '1d': candles(260, { step: DAY, base: 80, drift: 0.4 }),
  };
  const fundingHistory = Array.from({ length: 20 }, (_, index) => ({
    fundingTime: Date.UTC(2026, 0, 1) + index * 8 * HOUR,
    fundingRate: String(index * 0.00005),
  }));
  const openInterestHistory = Array.from({ length: 20 }, (_, index) => ({
    timestamp: Date.UTC(2026, 0, 1) + index * HOUR,
    sumOpenInterest: String(1_000 + index * 20),
  }));

  const result = analyzeFuturesMarket({
    symbol: 'BTCUSDT',
    klinesByTimeframe: byFrame,
    premiumIndex: {
      markPrice: '110',
      indexPrice: '109',
      lastFundingRate: '0.00095',
      nextFundingTime: Date.UTC(2026, 0, 2),
    },
    fundingHistory,
    openInterestHistory,
    news: [],
  });

  assert.equal(result.assetClass, 'crypto_perpetual');
  assert.equal(result.derivatives.openInterest.regime, 'PRICE_UP_OI_UP');
  assert.ok(result.derivatives.openInterest.changePct > 0);
  assert.ok(result.derivatives.basisPct > 0);
  assert.ok(result.derivatives.funding.percentile >= 0.9);
  assert.ok(['LONG', 'SHORT', 'NEUTRAL'].includes(result.direction));
  assert.equal(result.executionAllowed, false);
});

test('linear futures PnL charges fees on notional and handles funding sign explicitly', () => {
  const long = calculateLinearFuturesPnl({
    side: 'LONG', entryPrice: 100, markPrice: 110, quantity: 2, leverage: 5,
    entryFeeRate: 0.0004, exitFeeRate: 0.0004, fundingPaid: 0.2,
  });
  assert.equal(long.grossPnl, 20);
  assert.equal(long.margin, 40);
  assert.ok(Math.abs(long.fees - 0.168) < 1e-12);
  assert.ok(Math.abs(long.netPnl - 19.632) < 1e-12);

  const short = calculateLinearFuturesPnl({
    side: 'SHORT', entryPrice: 100, markPrice: 90, quantity: 2, leverage: 5,
    entryFeeRate: 0.0004, exitFeeRate: 0.0004, fundingPaid: -0.1,
  });
  assert.equal(short.grossPnl, 20);
  assert.ok(Math.abs(short.netPnl - 19.948) < 1e-12);
  assert.throws(() => calculateLinearFuturesPnl({
    side: 'Long', entryPrice: 100, markPrice: 110, quantity: 1, leverage: 2,
  }), /LONG or SHORT/);
});

test('generic news parser enforces freshness and clock-drift tolerance', () => {
  const now = Date.UTC(2026, 8, 11, 12);
  const rss = `<rss><channel>
    <item><title>Fresh catalyst - Wire A</title><pubDate>${new Date(now - HOUR).toUTCString()}</pubDate></item>
    <item><title>Tolerated future - Wire B</title><pubDate>${new Date(now + 5 * 60_000).toUTCString()}</pubDate></item>
    <item><title>Future invalid - Wire C</title><pubDate>${new Date(now + 11 * 60_000).toUTCString()}</pubDate></item>
    <item><title>Stale item - Wire D</title><pubDate>${new Date(now - 72 * HOUR).toUTCString()}</pubDate></item>
  </channel></rss>`;
  const result = parseGoogleNewsRss(rss, { nowMs: now });
  assert.deepEqual(result.map(item => item.title), ['Fresh catalyst', 'Tolerated future']);
});
