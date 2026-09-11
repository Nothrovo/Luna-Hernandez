import assert from 'node:assert/strict';
import test from 'node:test';

import {
  rankFuturesRecommendations,
  rankStockRecommendations,
} from '../lib/market-analysis.mjs';

const DAY = 86_400_000;
const H4 = 4 * 3_600_000;

function candles(count, { start = Date.UTC(2025, 0, 1), step = DAY, base = 100, drift = 0.25, volume = 1_000 } = {}) {
  return Array.from({ length: count }, (_, index) => {
    const close = base + index * drift + Math.sin(index / 3) * 1.2;
    return {
      ts: start + index * step,
      closedAt: start + (index + 1) * step,
      open: close - 0.2,
      high: close + 1,
      low: close - 1,
      close,
      volume: volume + index * 5,
    };
  });
}

test('stock recommender ranks a bounded liquid universe and exposes deterministic factors', () => {
  const benchmarkDailyBars = candles(120, { drift: 0.05 });
  const result = rankStockRecommendations({
    benchmarkDailyBars,
    candidates: [
      { symbol: 'AAA', dailyBars: candles(120, { drift: 0.35, volume: 5_000 }) },
      { symbol: 'BBB', dailyBars: candles(120, { drift: 0.25, volume: 8_000 }) },
      { symbol: 'CCC', dailyBars: candles(120, { drift: 0.18, volume: 3_000 }) },
      { symbol: 'DOWN', dailyBars: candles(120, { base: 180, drift: -0.45, volume: 9_000 }) },
    ],
    limit: 3,
  });

  assert.equal(result.assetClass, 'stock');
  assert.equal(result.candidates.length, 3);
  assert.equal(result.candidates.some(candidate => candidate.symbol === 'DOWN'), false);
  assert.ok(result.candidates.every(candidate => Number.isFinite(candidate.rankScore)));
  assert.ok(result.candidates.every(candidate => candidate.factors.relativeStrength20d != null));
  assert.deepEqual(
    result.candidates.map(candidate => candidate.rankScore),
    [...result.candidates.map(candidate => candidate.rankScore)].sort((a, b) => b - a),
  );
});

test('futures recommender returns canonical long/short sides without order metadata', () => {
  const result = rankFuturesRecommendations({
    candidates: [
      { symbol: 'AAAUSDT', fourHourBars: candles(140, { step: H4, drift: 0.05 }), quoteVolume: 9e8, fundingRate: 0.0001, oiChangePct: 5 },
      { symbol: 'BBBUSDT', fourHourBars: candles(140, { step: H4, drift: 0.045 }), quoteVolume: 7e8, fundingRate: 0.00005, oiChangePct: 3 },
      { symbol: 'CCCUSDT', fourHourBars: candles(140, { step: H4, drift: 0.04 }), quoteVolume: 5e8, fundingRate: 0, oiChangePct: 2 },
      { symbol: 'CROWDEDUSDT', fourHourBars: candles(140, { step: H4, drift: 0.05 }), quoteVolume: 1e9, fundingRate: 0.0006, oiChangePct: 8 },
    ],
    limit: 3,
  });

  assert.equal(result.assetClass, 'crypto_perpetual');
  assert.equal(result.candidates.length, 3);
  assert.ok(result.candidates.every(candidate => ['LONG', 'SHORT'].includes(candidate.side)));
  assert.ok(result.candidates.every(candidate => candidate.executionAllowed === false));
  assert.equal(result.candidates.some(candidate => candidate.symbol === 'CROWDEDUSDT'), false);
  assert.ok(result.candidates.every(candidate => !('order' in candidate)));
});

test('futures recommender does not chase a short already stretched below the lower band', () => {
  const result = rankFuturesRecommendations({
    candidates: [{
      symbol: 'FALLUSDT',
      fourHourBars: candles(140, { step: H4, base: 220, drift: -0.55 }),
      quoteVolume: 1e9,
      fundingRate: 0,
      oiChangePct: 5,
      priceChange24h: -8,
    }],
  });
  assert.equal(result.candidates.length, 0);
});

test('futures recommender rejects extreme ATR and 24-hour shock candidates', () => {
  const volatileBars = candles(140, { step: H4, drift: 0.05 }).map(candle => ({
    ...candle,
    high: candle.close + 12,
    low: candle.close - 12,
  }));
  const result = rankFuturesRecommendations({
    candidates: [{
      symbol: 'SHOCKUSDT', fourHourBars: volatileBars, quoteVolume: 1e9,
      fundingRate: -0.002, oiChangePct: 10, priceChange24h: -22,
    }],
  });
  assert.equal(result.candidates.length, 0);
});
