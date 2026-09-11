import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';

const manager = resolve('docker/n8n-data/manage_positions.mjs');

function tempDatabase(t) {
  const dir = mkdtempSync(resolve(tmpdir(), 'midas-test-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return resolve(dir, 'positions.sqlite');
}

function runManager(dbPath, ...args) {
  return new Promise((resolveRun, reject) => {
    const childEnv = { ...process.env, SQLITE_PATH: dbPath };
    delete childEnv.NODE_TEST_CONTEXT;
    const child = spawn(process.execPath, [manager, ...args], {
      env: childEnv,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', code => {
      if (code !== 0) return reject(new Error(`manager exited ${code}: ${stderr}`));
      resolveRun({ stdout, stderr });
    });
  });
}

function seedLegacyDatabase(dbPath) {
  const db = new DatabaseSync(dbPath);
  db.exec(`
    CREATE TABLE user_positions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tanggal_beli TEXT NOT NULL,
      waktu_beli TEXT NOT NULL,
      simbol TEXT NOT NULL,
      coin_id TEXT NOT NULL,
      nama TEXT NOT NULL,
      harga_beli REAL NOT NULL,
      modal_idr REAL NOT NULL,
      quantity REAL,
      target_profit REAL NOT NULL,
      stop_loss REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      tanggal_jual TEXT,
      harga_jual REAL,
      pnl_persen REAL,
      pnl_idr REAL,
      tp_alerted_at TEXT,
      sl_alerted_at TEXT
    );
    CREATE TABLE position_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      position_id INTEGER,
      simbol TEXT NOT NULL,
      coin_id TEXT NOT NULL,
      tipe TEXT NOT NULL,
      tanggal TEXT NOT NULL,
      waktu TEXT NOT NULL,
      harga REAL NOT NULL,
      modal_idr REAL NOT NULL,
      quantity REAL NOT NULL,
      pnl_idr REAL DEFAULT 0,
      pnl_persen REAL DEFAULT 0,
      notes TEXT
    );
  `);

  const insertPosition = db.prepare(`
    INSERT INTO user_positions
      (tanggal_beli, waktu_beli, simbol, coin_id, nama, harga_beli, modal_idr, quantity, target_profit, stop_loss, status)
    VALUES ('2026-01-01', '10.00', 'BTC', 'bitcoin', 'Bitcoin', ?, 1000, ?, ?, ?, 'ACTIVE')
  `);
  const insertTransaction = db.prepare(`
    INSERT INTO position_transactions
      (position_id, simbol, coin_id, tipe, tanggal, waktu, harga, modal_idr, quantity, notes)
    VALUES (?, 'BTC', 'bitcoin', 'BUY', '2026-01-01', '10.00', ?, 1000, ?, 'Initial position entry')
  `);

  for (const [price, quantity] of [[10, 100], [20, 50], [40, 25]]) {
    const position = insertPosition.run(price, quantity, price * 1.2, price * 0.9);
    insertTransaction.run(Number(position.lastInsertRowid), price, quantity);
  }
  db.close();
}

function simulateOldBrokenMigration(dbPath) {
  seedLegacyDatabase(dbPath);
  const db = new DatabaseSync(dbPath);
  db.prepare(`
    UPDATE user_positions
    SET modal_idr = 3000, quantity = 175, harga_beli = ?, target_profit = 12, stop_loss = 9
    WHERE id = 1
  `).run(3000 / 175);
  db.prepare("UPDATE user_positions SET status = 'CLOSED', tanggal_jual = '2026-01-02', harga_jual = harga_beli WHERE id IN (2, 3)").run();
  const insertMerge = db.prepare(`
    INSERT INTO position_transactions
      (position_id, simbol, coin_id, tipe, tanggal, waktu, harga, modal_idr, quantity, notes)
    VALUES (1, 'BTC', 'bitcoin', 'MERGE_DCA', '2026-01-02', '00.00', ?, 1000, ?, 'Consolidated duplicate pre-migration position')
  `);
  for (let processIndex = 0; processIndex < 6; processIndex++) {
    insertMerge.run(20, 50);
    insertMerge.run(40, 25);
  }
  db.close();
}

test('legacy migration is atomic, idempotent, and preserves ledger and risk invariants', async t => {
  const dbPath = tempDatabase(t);
  seedLegacyDatabase(dbPath);

  await Promise.all(Array.from({ length: 6 }, () => runManager(dbPath, 'list-active')));
  await Promise.all(Array.from({ length: 6 }, () => runManager(dbPath, 'list-active')));

  const db = new DatabaseSync(dbPath);
  const active = db.prepare("SELECT * FROM user_positions WHERE status = 'ACTIVE'").all();
  const merged = db.prepare("SELECT * FROM user_positions WHERE status = 'MERGED'").all();
  const buys = db.prepare("SELECT * FROM position_transactions WHERE tipe = 'BUY' ORDER BY id").all();
  const audits = db.prepare("SELECT * FROM position_transactions WHERE tipe = 'MIGRATION_MERGE'").all();
  const index = db.prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'idx_active_coin'").get();
  const migrations = db.prepare('SELECT name FROM schema_migrations ORDER BY name').all();

  assert.equal(active.length, 1);
  assert.equal(merged.length, 2);
  assert.equal(active[0].modal_idr, 3000);
  assert.equal(active[0].quantity, 175);
  assert.ok(Math.abs(active[0].harga_beli - (3000 / 175)) < 1e-10);
  assert.ok(active[0].target_profit > active[0].harga_beli);
  assert.ok(active[0].stop_loss < active[0].harga_beli);
  assert.ok(active[0].stop_loss > 0);
  assert.ok(buys.every(row => row.position_id === active[0].id));
  assert.equal(buys.reduce((sum, row) => sum + row.modal_idr, 0), active[0].modal_idr);
  assert.equal(audits.length, 1);
  assert.equal(audits[0].modal_idr, 0);
  assert.equal(audits[0].quantity, 0);
  assert.equal(index.name, 'idx_active_coin');
  assert.deepEqual(migrations.map(row => row.name), ['active_coin_unique_v2', 'normalize_legacy_merge_dca_v2']);
  db.close();
});

test('parallel BUY and SELL operations keep position and ledger totals consistent', async t => {
  const dbPath = tempDatabase(t);
  await Promise.all(Array.from({ length: 8 }, () =>
    runManager(dbPath, 'buy', 'BTC', 'bitcoin', 'Bitcoin', '100', '1000', '112', '94')));

  await Promise.all(Array.from({ length: 8 }, () =>
    runManager(dbPath, 'sell', 'BTC', '110', '10%', 'bitcoin')));

  const db = new DatabaseSync(dbPath);
  const active = db.prepare("SELECT * FROM user_positions WHERE coin_id = 'bitcoin' AND status = 'ACTIVE'").get();
  const transactions = db.prepare('SELECT * FROM position_transactions ORDER BY id').all();
  const sellRows = transactions.filter(row => row.tipe === 'PARTIAL_SELL');
  const expectedRemaining = 8000 * (0.9 ** 8);

  assert.ok(Math.abs(active.modal_idr - expectedRemaining) < 1e-8);
  assert.ok(Math.abs(active.quantity - expectedRemaining / 100) < 1e-8);
  assert.equal(transactions.filter(row => row.tipe === 'BUY' || row.tipe.startsWith('DCA_')).length, 8);
  assert.equal(sellRows.length, 8);
  assert.ok(Math.abs(sellRows.reduce((sum, row) => sum + row.modal_idr, 0) + active.modal_idr - 8000) < 1e-8);
  db.close();
});

test('upgrade repairs duplicated MERGE_DCA rows produced by the old migration', async t => {
  const dbPath = tempDatabase(t);
  simulateOldBrokenMigration(dbPath);

  await Promise.all(Array.from({ length: 6 }, () => runManager(dbPath, 'list-active')));

  const db = new DatabaseSync(dbPath);
  const active = db.prepare("SELECT * FROM user_positions WHERE status = 'ACTIVE'").get();
  const merged = db.prepare("SELECT * FROM user_positions WHERE status = 'MERGED'").all();
  const buys = db.prepare("SELECT * FROM position_transactions WHERE tipe = 'BUY'").all();
  const oldMergeCount = db.prepare("SELECT COUNT(*) AS count FROM position_transactions WHERE tipe = 'MERGE_DCA'").get().count;
  const audits = db.prepare("SELECT * FROM position_transactions WHERE tipe = 'MIGRATION_MERGE'").all();

  assert.equal(merged.length, 2);
  assert.equal(oldMergeCount, 0);
  assert.equal(audits.length, 1);
  assert.equal(audits[0].modal_idr, 0);
  assert.ok(buys.every(row => row.position_id === active.id));
  assert.equal(buys.reduce((sum, row) => sum + row.modal_idr, 0), active.modal_idr);
  assert.ok(active.target_profit > active.harga_beli);
  assert.ok(active.stop_loss > 0 && active.stop_loss < active.harga_beli);
  db.close();
});

test('manager rejects numeric prefixes with trailing junk', async t => {
  const dbPath = tempDatabase(t);
  await runManager(dbPath, 'buy', 'BTC', 'bitcoin', 'Bitcoin', '100', '50abc', '112', '94');

  const db = new DatabaseSync(dbPath);
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM user_positions WHERE status = 'ACTIVE'").get().count, 0);
  db.close();
});

test('manager enforces long-position TP and SL invariants', async t => {
  const dbPath = tempDatabase(t);
  await runManager(dbPath, 'buy', 'BTC', 'bitcoin', 'Bitcoin', '100', '1000', '90', '110');

  const db = new DatabaseSync(dbPath);
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM user_positions WHERE status = 'ACTIVE'").get().count, 0);
  db.close();
});

test('manager sell accepts standard IDR amounts without separator truncation and rejects junk', async t => {
  const dbPath = tempDatabase(t);
  const readState = () => {
    const db = new DatabaseSync(dbPath);
    const position = db.prepare("SELECT * FROM user_positions WHERE coin_id = 'bitcoin' AND status = 'ACTIVE'").get();
    const sells = db.prepare("SELECT * FROM position_transactions WHERE tipe = 'PARTIAL_SELL' ORDER BY id").all();
    db.close();
    return { position, sells };
  };

  // Buy with 2,000,000 IDR
  await runManager(dbPath, 'buy', 'BTC', 'bitcoin', 'Bitcoin', '100', '2000000', '112', '94');

  // 1. Sell with thousand dot separator '50.000' (50,000 IDR, NOT 50 IDR!)
  await runManager(dbPath, 'sell', 'BTC', '100', '50.000', 'bitcoin');
  let state = readState();
  assert.equal(state.sells.at(-1).modal_idr, 50_000);
  assert.equal(state.position.modal_idr, 1_950_000);

  // 2. Sell with '1.5jt' (1,500,000 IDR)
  await runManager(dbPath, 'sell', 'BTC', '100', '1.5jt', 'bitcoin');
  state = readState();
  assert.equal(state.sells.at(-1).modal_idr, 1_500_000);
  assert.equal(state.position.modal_idr, 450_000);

  // 3. Sell with '50rb' (50,000 IDR)
  await runManager(dbPath, 'sell', 'BTC', '100', '50rb', 'bitcoin');
  state = readState();
  assert.equal(state.sells.at(-1).modal_idr, 50_000);
  assert.equal(state.position.modal_idr, 400_000);

  // 4. Trailing junk tidak boleh mengubah posisi maupun menambah ledger SELL.
  const sellCountBeforeJunk = state.sells.length;
  await runManager(dbPath, 'sell', 'BTC', '100', '50abc', 'bitcoin');
  state = readState();
  assert.equal(state.sells.length, sellCountBeforeJunk);
  assert.equal(state.position.modal_idr, 400_000);
});
