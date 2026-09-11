import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';

const cli = resolve('docker/n8n-data/market_analysis_cli.mjs');

function runCli(dbPath, ...args) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(process.execPath, [cli, ...args], {
      env: { ...process.env, SQLITE_PATH: dbPath },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', code => resolveRun({ code, stdout, stderr }));
  });
}

test('market analysis CLI migrates, saves, and retrieves generic analysis records', async t => {
  const dir = mkdtempSync(resolve(tmpdir(), 'midas-market-test-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const dbPath = resolve(dir, 'analysis.sqlite');
  const record = {
    assetClass: 'stock', provider: 'alpaca-iex+sec-edgar', symbol: 'AAPL',
    exchange: 'NASDAQ', currency: 'USD', timeframe: 'multi',
    asOf: '2026-09-11T00:00:00.000Z', delayed: true,
    technicalScore: 72, fundamentalScore: 80, sentimentScore: 0.2,
    riskScore: 4, verdict: 'BUY', summary: 'Fixture summary', payload: { fixture: true },
  };
  const encoded = Buffer.from(JSON.stringify(record)).toString('base64url');

  const saved = await runCli(dbPath, 'save', encoded);
  assert.equal(saved.code, 0, saved.stderr);
  assert.equal(JSON.parse(saved.stdout).ok, true);

  const history = await runCli(dbPath, 'history', 'AAPL');
  assert.equal(history.code, 0, history.stderr);
  const parsed = JSON.parse(history.stdout);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.sessions.length, 1);
  assert.equal(parsed.sessions[0].assetClass, 'stock');
  assert.equal(parsed.sessions[0].symbol, 'AAPL');

  const db = new DatabaseSync(dbPath);
  const columns = db.prepare('PRAGMA table_info(market_analysis_sessions)').all().map(row => row.name);
  assert.ok(columns.includes('asset_class'));
  assert.ok(columns.includes('payload_json'));
  assert.ok(db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_market_analysis_symbol_time'").get());
  db.close();
});

test('market analysis CLI rejects malformed records without inserting partial data', async t => {
  const dir = mkdtempSync(resolve(tmpdir(), 'midas-market-invalid-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const dbPath = resolve(dir, 'analysis.sqlite');
  const encoded = Buffer.from(JSON.stringify({ assetClass: 'stock', symbol: 'bad symbol' })).toString('base64url');
  const result = await runCli(dbPath, 'save', encoded);
  assert.notEqual(result.code, 0);
  assert.equal(JSON.parse(result.stdout).error.code, 'INVALID_RECORD');

  const db = new DatabaseSync(dbPath);
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM market_analysis_sessions').get().count, 0);
  db.close();
});
