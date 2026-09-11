#!/usr/bin/env node

import { DatabaseSync } from 'node:sqlite';
import { writeFileSync } from 'node:fs';

import { MarketAnalysisError } from './market-analysis.mjs';
import {
  fetchFuturesRecommendations,
  fetchFuturesMarketAnalysis,
  fetchStockRecommendations,
  fetchStockMarketAnalysis,
  requestWithRetry,
} from './market-providers.mjs';

const databasePath = process.env.SQLITE_PATH || '/home/node/.n8n/crypto_decision_support.sqlite';
const database = new DatabaseSync(databasePath);
database.exec(`
  PRAGMA busy_timeout = 5000;
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS market_analysis_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    analyzed_at TEXT NOT NULL,
    asset_class TEXT NOT NULL,
    provider TEXT NOT NULL,
    symbol TEXT NOT NULL,
    exchange_name TEXT,
    currency TEXT,
    timeframe TEXT NOT NULL DEFAULT 'multi',
    as_of TEXT NOT NULL,
    delayed INTEGER NOT NULL DEFAULT 0,
    technical_score REAL,
    fundamental_score REAL,
    sentiment_score REAL,
    risk_score REAL,
    verdict TEXT NOT NULL,
    summary TEXT,
    payload_json TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_market_analysis_symbol_time
    ON market_analysis_sessions(symbol, analyzed_at DESC);

  CREATE TABLE IF NOT EXISTS market_data_cache (
    cache_key TEXT PRIMARY KEY,
    fetched_at TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    payload_json TEXT NOT NULL
  );
`);

function cacheTtl(url) {
  if (url.includes('company_tickers.json') || url.includes('/companyfacts/')) return 24 * 60 * 60_000;
  if (url.includes('/v2/clock')) return 30_000;
  if (url.includes('news.google.com')) return 10 * 60_000;
  if (url.includes('data.alpaca.markets') && url.includes('timeframe=1Day')) return 30 * 60_000;
  if (url.includes('data.alpaca.markets')) return 5 * 60_000;
  if (url.includes('fapi.binance.com')) return 60_000;
  return 5 * 60_000;
}

async function cachedRequest(url, { headers = {}, responseType = 'json' } = {}) {
  const cacheKey = `${responseType}:${url}`;
  const now = Date.now();
  const cached = database.prepare(`
    SELECT payload_json FROM market_data_cache WHERE cache_key = ? AND expires_at > ?
  `).get(cacheKey, now);
  if (cached) {
    const parsed = JSON.parse(cached.payload_json);
    return responseType === 'text' ? parsed.text : parsed.value;
  }
  const value = await requestWithRetry(url, { headers, responseType, maxAttempts: 2 });
  const payload = responseType === 'text' ? { text: value } : { value };
  database.prepare(`
    INSERT INTO market_data_cache(cache_key, fetched_at, expires_at, payload_json)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(cache_key) DO UPDATE SET
      fetched_at = excluded.fetched_at,
      expires_at = excluded.expires_at,
      payload_json = excluded.payload_json
  `).run(cacheKey, new Date(now).toISOString(), now + cacheTtl(url), JSON.stringify(payload));
  return value;
}

function decodeRecord(encoded) {
  let record;
  try {
    record = JSON.parse(Buffer.from(String(encoded || ''), 'base64url').toString('utf8'));
  } catch {
    throw new MarketAnalysisError('INVALID_RECORD', 'Analysis record is not valid base64url JSON');
  }
  const validAssetClasses = ['stock', 'crypto_perpetual'];
  if (!validAssetClasses.includes(record?.assetClass)
      || !/^[A-Z0-9.-]{1,20}$/.test(record?.symbol || '')
      || typeof record?.provider !== 'string'
      || !record.provider
      || !['BUY', 'HOLD', 'SELL'].includes(record?.verdict)
      || !Number.isFinite(Date.parse(record?.asOf))) {
    throw new MarketAnalysisError('INVALID_RECORD', 'Analysis record is missing required canonical fields');
  }
  return record;
}

function optionalNumber(value) {
  return Number.isFinite(value) ? value : null;
}

function saveRecord(encoded) {
  const record = decodeRecord(encoded);
  const analyzedAt = new Date().toISOString();
  database.prepare(`
    INSERT INTO market_analysis_sessions (
      analyzed_at, asset_class, provider, symbol, exchange_name, currency,
      timeframe, as_of, delayed, technical_score, fundamental_score,
      sentiment_score, risk_score, verdict, summary, payload_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    analyzedAt,
    record.assetClass,
    record.provider,
    record.symbol,
    record.exchange || null,
    record.currency || null,
    record.timeframe || 'multi',
    record.asOf,
    record.delayed ? 1 : 0,
    optionalNumber(record.technicalScore),
    optionalNumber(record.fundamentalScore),
    optionalNumber(record.sentimentScore),
    optionalNumber(record.riskScore),
    record.verdict,
    String(record.summary || '').slice(0, 500),
    JSON.stringify(record.payload || {}),
  );
  return { ok: true, saved: { assetClass: record.assetClass, symbol: record.symbol, analyzedAt } };
}

function history(symbol = '') {
  const normalized = String(symbol || '').trim().toUpperCase();
  if (normalized && !/^[A-Z0-9.-]{1,20}$/.test(normalized)) {
    throw new MarketAnalysisError('INVALID_SYMBOL', 'History symbol is invalid');
  }
  const marketRows = normalized
    ? database.prepare(`
        SELECT analyzed_at, asset_class, provider, symbol, verdict,
               technical_score, fundamental_score, risk_score, summary, as_of, delayed
        FROM market_analysis_sessions WHERE symbol = ? ORDER BY analyzed_at DESC LIMIT 15
      `).all(normalized)
    : database.prepare(`
        SELECT analyzed_at, asset_class, provider, symbol, verdict,
               technical_score, fundamental_score, risk_score, summary, as_of, delayed
        FROM market_analysis_sessions ORDER BY analyzed_at DESC LIMIT 15
      `).all();
  const sessions = marketRows.map(row => ({
    analyzedAt: row.analyzed_at,
    assetClass: row.asset_class,
    provider: row.provider,
    symbol: row.symbol,
    verdict: row.verdict,
    technicalScore: row.technical_score,
    fundamentalScore: row.fundamental_score,
    riskScore: row.risk_score,
    summary: row.summary || '',
    asOf: row.as_of,
    delayed: row.delayed === 1,
  }));

  const hasCoinSessions = database.prepare(`
    SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'coin_sessions'
  `).get();
  if (hasCoinSessions) {
    const coinRows = normalized
      ? database.prepare(`
          SELECT tanggal, waktu, simbol, tipe, keputusan, skor_teknikal, ringkasan
          FROM coin_sessions WHERE simbol = ? ORDER BY tanggal DESC, id DESC LIMIT 15
        `).all(normalized)
      : database.prepare(`
          SELECT tanggal, waktu, simbol, tipe, keputusan, skor_teknikal, ringkasan
          FROM coin_sessions ORDER BY tanggal DESC, id DESC LIMIT 15
        `).all();
    sessions.push(...coinRows.map(row => ({
      analyzedAt: `${row.tanggal}T${String(row.waktu || '00:00').replace('.', ':')}:00+07:00`,
      assetClass: row.tipe === 'coin' ? 'crypto_spot' : row.tipe,
      provider: 'coingecko',
      symbol: row.simbol,
      verdict: row.keputusan || '',
      technicalScore: row.skor_teknikal,
      fundamentalScore: null,
      riskScore: null,
      summary: row.ringkasan || '',
      asOf: null,
      delayed: false,
    })));
  }
  sessions.sort((left, right) => Date.parse(right.analyzedAt) - Date.parse(left.analyzedAt));
  return { ok: true, sessions: sessions.slice(0, 15) };
}

async function analyze(command, symbol) {
  const common = {
    fetchJson: (url, options) => cachedRequest(url, { ...options, responseType: 'json' }),
    fetchText: (url, options) => cachedRequest(url, { ...options, responseType: 'text' }),
  };
  const analysis = command === 'stock'
    ? await fetchStockMarketAnalysis(symbol, common)
    : await fetchFuturesMarketAnalysis(symbol, common);
  return { ok: true, analysis };
}

async function recommend(assetClass) {
  const common = {
    fetchJson: (url, options) => cachedRequest(url, { ...options, responseType: 'json' }),
  };
  if (assetClass === 'stock') {
    const configured = String(process.env.STOCK_REC_UNIVERSE || '').split(',').map(value => value.trim()).filter(Boolean);
    const recommendations = await fetchStockRecommendations({
      ...common,
      ...(configured.length ? { universe: configured } : {}),
    });
    return { ok: true, recommendations };
  }
  const recommendations = await fetchFuturesRecommendations({ ...common });
  return { ok: true, recommendations };
}

function errorEnvelope(error) {
  const known = error instanceof MarketAnalysisError;
  return {
    ok: false,
    error: {
      code: known ? error.code : 'UNEXPECTED_ERROR',
      message: known ? error.message : 'Market analysis failed unexpectedly',
      retryable: known ? error.retryable : false,
    },
  };
}

const [,, command, ...args] = process.argv;

try {
  let result;
  if (command === 'stock' || command === 'futures') result = await analyze(command, args[0]);
  else if (command === 'recommend-stock') result = await recommend('stock');
  else if (command === 'recommend-futures') result = await recommend('futures');
  else if (command === 'save') result = saveRecord(args[0]);
  else if (command === 'history') result = history(args[0]);
  else throw new MarketAnalysisError('INVALID_COMMAND', 'Expected stock, futures, recommend-stock, recommend-futures, save, or history command');
  writeFileSync(1, `${JSON.stringify(result)}\n`);
} catch (error) {
  writeFileSync(1, `${JSON.stringify(errorEnvelope(error))}\n`);
  process.exitCode = 1;
} finally {
  database.close();
}
