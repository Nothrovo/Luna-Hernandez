#!/usr/bin/env node
/**
 * manage_positions.mjs — Portfolio & Position Manager for Luna Hernandez (Midas) Bot
 * Manages active swing trading positions in SQLite with transaction ledger and anti-spam alerts.
 */

import { DatabaseSync } from 'node:sqlite';
import https from 'node:https';

const dbPath = process.env.SQLITE_PATH || '/home/node/.n8n/crypto_decision_support.sqlite';
const db = new DatabaseSync(dbPath);

db.exec(`
  PRAGMA busy_timeout = 5000;
  PRAGMA journal_mode = WAL;
`);

// 1. Inisialisasi tabel dasar
db.exec(`
CREATE TABLE IF NOT EXISTS user_positions (
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

CREATE TABLE IF NOT EXISTS position_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  position_id INTEGER,
  simbol TEXT NOT NULL,
  coin_id TEXT NOT NULL,
  tipe TEXT NOT NULL, -- BUY, DCA_AVERAGE_UP, DCA_AVERAGE_DOWN, PARTIAL_SELL, CLOSE_SELL, MIGRATION_MERGE
  tanggal TEXT NOT NULL,
  waktu TEXT NOT NULL,
  harga REAL NOT NULL,
  modal_idr REAL NOT NULL,
  quantity REAL NOT NULL,
  pnl_idr REAL DEFAULT 0,
  pnl_persen REAL DEFAULT 0,
  notes TEXT,
  FOREIGN KEY (position_id) REFERENCES user_positions(id)
);
`);

// 2-4. Semua migrasi startup berjalan dalam satu write lock agar aman saat
// beberapa proses manager mulai bersamaan pada database lama yang sama.
withTx(() => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  const cols = db.prepare("PRAGMA table_info(user_positions)").all().map(c => c.name);
  const expectedCols = ['quantity', 'tanggal_jual', 'harga_jual', 'pnl_persen', 'pnl_idr', 'tp_alerted_at', 'sl_alerted_at'];
  for (const col of expectedCols) {
    if (!cols.includes(col)) {
      const colType = (col === 'tanggal_jual' || col.endsWith('_at')) ? 'TEXT' : 'REAL';
      db.exec(`ALTER TABLE user_positions ADD COLUMN ${col} ${colType};`);
    }
  }
  db.exec("UPDATE user_positions SET quantity = modal_idr / harga_beli WHERE (quantity IS NULL OR quantity = 0) AND harga_beli > 0;");

  // Migrasi lama mencatat MERGE_DCA sebagai tambahan modal. Normalisasi event
  // tersebut menjadi audit bernilai nol supaya agregasi ledger tidak dobel.
  const normalizationName = 'normalize_legacy_merge_dca_v2';
  const alreadyNormalized = db.prepare('SELECT 1 FROM schema_migrations WHERE name = ?').get(normalizationName);
  if (!alreadyNormalized) {
    const legacyRows = db.prepare(`
      SELECT * FROM position_transactions
      WHERE tipe = 'MERGE_DCA'
        AND notes = 'Consolidated duplicate pre-migration position'
      ORDER BY id
    `).all();
    const legacyGroups = new Map();
    for (const row of legacyRows) {
      const key = `${row.position_id}:${row.coin_id}`;
      if (!legacyGroups.has(key)) legacyGroups.set(key, []);
      legacyGroups.get(key).push(row);
    }

    for (const group of legacyGroups.values()) {
      const sample = group[0];
      const recoveredIds = [];
      const candidates = db.prepare(`
        SELECT p.* FROM user_positions p
        WHERE p.coin_id = ? AND p.id != ? AND p.status = 'CLOSED'
          AND p.harga_jual = p.harga_beli
          AND NOT EXISTS (
            SELECT 1 FROM position_transactions t
            WHERE t.position_id = p.id AND t.tipe = 'CLOSE_SELL'
          )
      `).all(sample.coin_id, sample.position_id);

      for (const candidate of candidates) {
        const matchesLegacyLeg = group.some(row =>
          nearlyEqual(row.harga, candidate.harga_beli)
          && nearlyEqual(row.modal_idr, candidate.modal_idr)
          && nearlyEqual(row.quantity, candidate.quantity)
        );
        if (!matchesLegacyLeg) continue;

        db.prepare('UPDATE position_transactions SET position_id = ? WHERE position_id = ?')
          .run(sample.position_id, candidate.id);
        db.prepare(`
          UPDATE user_positions
          SET status = 'MERGED', tanggal_jual = NULL, harga_jual = NULL,
              pnl_persen = NULL, pnl_idr = NULL, tp_alerted_at = NULL, sl_alerted_at = NULL
          WHERE id = ?
        `).run(candidate.id);
        recoveredIds.push(Number(candidate.id));
      }

      const canonical = db.prepare('SELECT * FROM user_positions WHERE id = ?').get(sample.position_id);
      if (canonical) {
        const entry = Number(canonical.harga_beli);
        db.prepare(`
          UPDATE user_positions
          SET target_profit = ?, stop_loss = ?, tp_alerted_at = NULL, sl_alerted_at = NULL
          WHERE id = ?
        `).run(
          entry * (1 + validTargetPct(canonical)),
          entry * (1 - validStopPct(canonical)),
          canonical.id,
        );
      }

      db.prepare(`
        DELETE FROM position_transactions
        WHERE position_id = ? AND coin_id = ? AND tipe = 'MERGE_DCA'
          AND notes = 'Consolidated duplicate pre-migration position'
      `).run(sample.position_id, sample.coin_id);
      db.prepare(`
        INSERT INTO position_transactions
          (position_id, simbol, coin_id, tipe, tanggal, waktu, harga, modal_idr, quantity, notes)
        VALUES (?, ?, ?, 'MIGRATION_MERGE', ?, ?, ?, 0, 0, ?)
      `).run(
        sample.position_id,
        sample.simbol,
        sample.coin_id,
        sample.tanggal,
        sample.waktu,
        sample.harga,
        `Normalized legacy merge audit; recovered position ids: ${recoveredIds.join(', ') || 'none'}`,
      );
    }

    db.prepare('INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)')
      .run(normalizationName, new Date().toISOString());
  }

  // Satukan posisi ACTIVE duplikat tanpa menciptakan arus modal baru. Transaksi
  // historis direlasikan ulang ke posisi kanonis (baris ACTIVE tertua).
  const dups = db.prepare(`
    SELECT coin_id FROM user_positions WHERE status = 'ACTIVE' GROUP BY coin_id HAVING COUNT(*) > 1
  `).all();
  for (const { coin_id } of dups) {
    const rows = db.prepare(`
      SELECT * FROM user_positions WHERE coin_id = ? AND status = 'ACTIVE' ORDER BY id ASC
    `).all(coin_id);
    if (rows.length > 1) {
      const primary = rows[0];
      let totalModal = Number(primary.modal_idr);
      let totalQty = Number(primary.quantity) || (totalModal / Number(primary.harga_beli));
      let weightedTpPct = totalModal * validTargetPct(primary);
      let weightedSlPct = totalModal * validStopPct(primary);
      const mergedIds = [];
      for (let i = 1; i < rows.length; i++) {
        const dup = rows[i];
        const dupModal = Number(dup.modal_idr);
        const dupQty = Number(dup.quantity) || (dupModal / Number(dup.harga_beli));
        totalModal += dupModal;
        totalQty += dupQty;
        weightedTpPct += dupModal * validTargetPct(dup);
        weightedSlPct += dupModal * validStopPct(dup);
        mergedIds.push(Number(dup.id));

        db.prepare('UPDATE position_transactions SET position_id = ? WHERE position_id = ?').run(primary.id, dup.id);
        db.prepare(`
          UPDATE user_positions
          SET status = 'MERGED', tanggal_jual = NULL, harga_jual = NULL,
              pnl_persen = NULL, pnl_idr = NULL, tp_alerted_at = NULL, sl_alerted_at = NULL
          WHERE id = ?
        `).run(dup.id);
      }

      const avgPrice = totalModal / totalQty;
      const targetProfit = avgPrice * (1 + weightedTpPct / totalModal);
      const stopLoss = avgPrice * (1 - weightedSlPct / totalModal);
      db.prepare(`
        UPDATE user_positions
        SET modal_idr = ?, quantity = ?, harga_beli = ?, target_profit = ?, stop_loss = ?,
            tp_alerted_at = NULL, sl_alerted_at = NULL
        WHERE id = ?
      `).run(totalModal, totalQty, avgPrice, targetProfit, stopLoss, primary.id);

      const { tanggal, waktu } = nowTime();
      db.prepare(`
        INSERT INTO position_transactions
          (position_id, simbol, coin_id, tipe, tanggal, waktu, harga, modal_idr, quantity, notes)
        VALUES (?, ?, ?, 'MIGRATION_MERGE', ?, ?, ?, 0, 0, ?)
      `).run(
        primary.id,
        primary.simbol,
        coin_id,
        tanggal,
        waktu,
        avgPrice,
        `Consolidated legacy position ids: ${mergedIds.join(', ')}`,
      );
    }
  }

  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_active_coin ON user_positions (coin_id) WHERE status = 'ACTIVE';");
  db.prepare('INSERT OR IGNORE INTO schema_migrations (name, applied_at) VALUES (?, ?)')
    .run('active_coin_unique_v2', new Date().toISOString());
});

const [,, command, ...args] = process.argv;

function nowTime() {
  const d = new Date();
  const tanggal = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(d);
  const waktu = d.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' }).replace(':', '.');
  return { tanggal, waktu };
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'LunaHernandezBot/2.0' } }, res => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage || 'Request failed'}`));
      }
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed && typeof parsed === 'object' && parsed.status?.error_code) {
            return reject(new Error(`API Error ${parsed.status.error_code}: ${parsed.status.error_message}`));
          }
          resolve(parsed);
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy(new Error('Request timed out after 10000ms'));
    });
  });
}

function withTx(fn) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

function validTargetPct(position) {
  const entry = Number(position.harga_beli);
  const target = Number(position.target_profit);
  const pct = entry > 0 && target > entry ? (target - entry) / entry : 0.12;
  return Number.isFinite(pct) && pct > 0 ? pct : 0.12;
}

function validStopPct(position) {
  const entry = Number(position.harga_beli);
  const stop = Number(position.stop_loss);
  const pct = entry > 0 && stop > 0 && stop < entry ? (entry - stop) / entry : 0.06;
  return Number.isFinite(pct) && pct > 0 && pct < 1 ? pct : 0.06;
}

function parsePositiveDecimal(raw) {
  const value = String(raw ?? '').trim();
  if (!/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function nearlyEqual(left, right) {
  const a = Number(left);
  const b = Number(right);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  return Math.abs(a - b) <= Number.EPSILON * Math.max(1, Math.abs(a), Math.abs(b)) * 8;
}

function parseIdrAmount(raw) {
  const input = String(raw ?? '').trim().toLowerCase();
  if (!input) return null;

  const match = input.match(/^(.*?)(k|rb|ribu|jt|juta|m)?$/);
  if (!match) return null;

  const numberPart = match[1];
  const suffix = match[2] || '';
  let numericValue;

  if (suffix) {
    if (!/^\d+(?:[.,]\d+)?$/.test(numberPart)) return null;
    numericValue = Number(numberPart.replace(',', '.'));
  } else if (/^\d+$/.test(numberPart)) {
    numericValue = Number(numberPart);
  } else if (/^\d{1,3}(?:[.,]\d{3})+$/.test(numberPart)) {
    numericValue = Number(numberPart.replace(/[.,]/g, ''));
  } else {
    return null;
  }

  const multiplier = ['k', 'rb', 'ribu'].includes(suffix)
    ? 1_000
    : ['jt', 'juta', 'm'].includes(suffix)
      ? 1_000_000
      : 1;
  const amount = numericValue * multiplier;
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

(async () => {
  try {
    if (command === 'buy') {
      const [simbolRaw, coinIdRaw, nama, hargaStr, modalStr, tpStr, slStr] = args;
      const simbol = (simbolRaw || '').toUpperCase().trim();
      const coinId = (coinIdRaw || '').toLowerCase().trim();
      const hargaBeli = parsePositiveDecimal(hargaStr);
      const modalIdr = parsePositiveDecimal(modalStr);
      const tpPrice = tpStr == null ? (hargaBeli * 1.12) : parsePositiveDecimal(tpStr);
      const slPrice = slStr == null ? (hargaBeli * 0.94) : parsePositiveDecimal(slStr);
      
      if (!simbol || !Number.isFinite(hargaBeli) || hargaBeli <= 0) {
        console.log(JSON.stringify({ success: false, error: 'INVALID_ARGS', message: 'Harga beli harus positif dan valid' }));
        process.exit(0);
      }
      if (!Number.isFinite(modalIdr) || modalIdr <= 0) {
        console.log(JSON.stringify({ success: false, error: 'INVALID_ARGS', message: 'Nominal modal harus positif dan valid' }));
        process.exit(0);
      }
      if (!Number.isFinite(tpPrice) || tpPrice <= hargaBeli || !Number.isFinite(slPrice) || slPrice <= 0 || slPrice >= hargaBeli) {
        console.log(JSON.stringify({ success: false, error: 'INVALID_ARGS', message: 'Untuk posisi long, target profit harus di atas harga beli dan stop loss harus di bawah harga beli' }));
        process.exit(0);
      }
      
      const newQuantity = modalIdr / hargaBeli;
      const canonicalCoinId = coinId || simbol.toLowerCase();
      const { tanggal, waktu } = nowTime();
      
      // Atomic transaction covering existence check, decision, and mutation under write lock
      const result = withTx(() => {
        const existing = coinId
          ? db.prepare("SELECT * FROM user_positions WHERE coin_id = ? AND status = 'ACTIVE' LIMIT 1").get(coinId)
          : db.prepare("SELECT * FROM user_positions WHERE simbol = ? AND status = 'ACTIVE' LIMIT 1").get(simbol);

        if (existing) {
          // DCA Logic: Unit-Weighted Harmonic Average
          const oldModal = Number(existing.modal_idr);
          const oldPrice = Number(existing.harga_beli);
          const oldQuantity = Number(existing.quantity) > 0 ? Number(existing.quantity) : (oldModal / oldPrice);
          
          const totalModal = oldModal + modalIdr;
          const totalQuantity = oldQuantity + newQuantity;
          const avgPrice = totalModal / totalQuantity;
          
          // Dynamic TP & SL preserve percentage relative to new average price
          const tpPct = (tpPrice - hargaBeli) / hargaBeli;
          const slPct = (hargaBeli - slPrice) / hargaBeli;
          const newTp = avgPrice * (1 + tpPct);
          const newSl = avgPrice * (1 - slPct);
          
          const isUp = hargaBeli > oldPrice;
          const actionType = isUp ? 'DCA_AVERAGE_UP' : 'DCA_AVERAGE_DOWN';
          
          db.prepare(`
            UPDATE user_positions 
            SET harga_beli = ?, modal_idr = ?, quantity = ?, target_profit = ?, stop_loss = ?, tp_alerted_at = NULL, sl_alerted_at = NULL 
            WHERE id = ?
          `).run(avgPrice, totalModal, totalQuantity, newTp, newSl, existing.id);
          
          db.prepare(`
            INSERT INTO position_transactions (position_id, simbol, coin_id, tipe, tanggal, waktu, harga, modal_idr, quantity, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(existing.id, simbol, existing.coin_id, actionType, tanggal, waktu, hargaBeli, modalIdr, newQuantity, 'DCA leg entry');
          
          return {
            success: true,
            action: 'dca',
            actionType,
            simbol,
            nama: nama || existing.nama,
            entryBaru: hargaBeli,
            oldPrice,
            avgPrice,
            modalBaru: modalIdr,
            totalModal,
            totalQuantity,
            tpPrice: newTp,
            slPrice: newSl,
            tpPct: Number((tpPct * 100).toFixed(1)),
            slPct: Number((slPct * 100).toFixed(1)),
          };
        } else {
          const res = db.prepare(`
            INSERT INTO user_positions (tanggal_beli, waktu_beli, simbol, coin_id, nama, harga_beli, modal_idr, quantity, target_profit, stop_loss, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
          `).run(tanggal, waktu, simbol, canonicalCoinId, nama || simbol, hargaBeli, modalIdr, newQuantity, tpPrice, slPrice);
          
          const newPosId = Number(res.lastInsertRowid);
          
          db.prepare(`
            INSERT INTO position_transactions (position_id, simbol, coin_id, tipe, tanggal, waktu, harga, modal_idr, quantity, notes)
            VALUES (?, ?, ?, 'BUY', ?, ?, ?, ?, ?, 'Initial position entry')
          `).run(newPosId, simbol, canonicalCoinId, tanggal, waktu, hargaBeli, modalIdr, newQuantity);
          
          const tpPct = ((tpPrice - hargaBeli) / hargaBeli * 100).toFixed(1);
          const slPct = ((hargaBeli - slPrice) / hargaBeli * 100).toFixed(1);
          
          return {
            success: true,
            action: 'new',
            simbol,
            nama: nama || simbol,
            avgPrice: hargaBeli,
            totalModal: modalIdr,
            totalQuantity: newQuantity,
            tpPrice,
            slPrice,
            tpPct: Number(tpPct),
            slPct: Number(slPct),
          };
        }
      });

      console.log(JSON.stringify(result));
    } else if (command === 'sell') {
      const [simbolRaw, currentPriceStr, porsiStr, coinIdArg] = args;
      const simbol = (simbolRaw || '').toUpperCase().trim();
      const currentPrice = parsePositiveDecimal(currentPriceStr);
      const coinId = (coinIdArg || '').toLowerCase().trim();
      
      if (!currentPrice || currentPrice <= 0 || !Number.isFinite(currentPrice)) {
        console.log(JSON.stringify({ success: false, error: 'INVALID_PRICE', message: 'Harga pasar live tidak valid atau tidak tersedia.' }));
        process.exit(0);
      }
      
      const targetQuery = coinId || simbol;
      const { tanggal, waktu } = nowTime();
      
      // Atomic transaction: SELECT, validate portion, calculate, UPDATE, and INSERT under immediate write lock
      const result = withTx(() => {
        const existingRows = coinId
          ? db.prepare("SELECT * FROM user_positions WHERE coin_id = ? AND status = 'ACTIVE'").all(coinId)
          : db.prepare("SELECT * FROM user_positions WHERE (UPPER(simbol) = UPPER(?) OR LOWER(coin_id) = LOWER(?)) AND status = 'ACTIVE'").all(simbol, simbol);
        
        if (existingRows.length === 0) {
          return { success: false, error: 'NOT_FOUND', simbol: targetQuery };
        }
        if (existingRows.length > 1) {
          return { 
            success: false, 
            error: 'AMBIGUOUS_SYMBOL', 
            message: `Ditemukan ${existingRows.length} posisi aktif untuk ${targetQuery}. Harap gunakan coin_id spesifik.`,
            positions: existingRows.map(r => ({ id: r.id, simbol: r.simbol, coin_id: r.coin_id, nama: r.nama }))
          };
        }
        
        const existing = existingRows[0];
        const hargaBeli = Number(existing.harga_beli);
        const totalModal = Number(existing.modal_idr);
        const totalQuantity = Number(existing.quantity) > 0 ? Number(existing.quantity) : (totalModal / hargaBeli);
        
        // Parse porsi sell strictly (default 100% jika argumen kosong)
        let sellRatio = 1.0;
        let isPartial = false;
        const pRaw = (porsiStr || '').trim().toLowerCase();
        
        if (pRaw && pRaw !== 'all' && pRaw !== '100%') {
          const pctMatch = pRaw.match(/^(\d+(\.\d+)?)%$/);
          const parsedNom = parseIdrAmount(pRaw);
          
          if (pctMatch) {
            const pct = parseFloat(pctMatch[1]);
            if (!Number.isFinite(pct) || pct <= 0 || pct > 100) {
              return { 
                success: false, 
                error: 'INVALID_PORTION', 
                message: `Porsi jual ${porsiStr} tidak valid. Persentase harus antara 1% s/d 100%.` 
              };
            }
            if (pct < 100) {
              sellRatio = pct / 100;
              isPartial = true;
            } else {
              sellRatio = 1.0;
              isPartial = false;
            }
          } else if (parsedNom != null) {
            const nom = parsedNom;
            if (nom > totalModal) {
              return { 
                success: false, 
                error: 'INVALID_PORTION', 
                message: `Nominal jual ${porsiStr} tidak valid. Nominal harus lebih dari Rp 0 dan maksimal modal aktif (Rp ${Math.round(totalModal).toLocaleString('id-ID')}).` 
              };
            }
            if (Math.abs(nom - totalModal) < 1) {
              sellRatio = 1.0;
              isPartial = false;
            } else {
              sellRatio = nom / totalModal;
              isPartial = true;
            }
          } else {
            return { 
              success: false, 
              error: 'INVALID_PORTION', 
              message: `Porsi atau nominal jual "${porsiStr}" tidak valid. Format yang didukung: persentase (misal: 25%, 50%, 100%, all) atau nominal (misal: 50k, 1,5jt, 100.000).` 
            };
          }
        }
        
        const soldModal = totalModal * sellRatio;
        const soldQuantity = totalQuantity * sellRatio;
        
        // Direct proceeds calculation to avoid loss of precision from intermediate rounded percentages
        const proceeds = soldQuantity * currentPrice;
        const pnlIdr = Math.round(proceeds - soldModal);
        const totalReturn = Math.round(proceeds);
        const pnlPct = Number(((currentPrice - hargaBeli) / hargaBeli * 100).toFixed(2));
        
        // Adaptive portionPct formatting: 2 decimals if < 1%, else 1 decimal (never falsely show 0%)
        const pctRaw = sellRatio * 100;
        const portionPct = Number(pctRaw < 1 ? pctRaw.toFixed(2) : pctRaw.toFixed(1));
        
        if (isPartial) {
          const remainingModal = totalModal - soldModal;
          const remainingQuantity = totalQuantity - soldQuantity;
          
          db.prepare(`
            UPDATE user_positions 
            SET modal_idr = ?, quantity = ?
            WHERE id = ?
          `).run(remainingModal, remainingQuantity, existing.id);
          
          db.prepare(`
            INSERT INTO position_transactions (position_id, simbol, coin_id, tipe, tanggal, waktu, harga, modal_idr, quantity, pnl_idr, pnl_persen, notes)
            VALUES (?, ?, ?, 'PARTIAL_SELL', ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(existing.id, existing.simbol, existing.coin_id, tanggal, waktu, currentPrice, soldModal, soldQuantity, pnlIdr, pnlPct, `Partial close ${portionPct}%`);
          
          return {
            success: true,
            isPartial: true,
            portionPct,
            simbol: existing.simbol,
            nama: existing.nama,
            tanggalBeli: existing.tanggal_beli,
            hargaBeli,
            hargaJual: currentPrice,
            modalTerjual: soldModal,
            modalSisa: remainingModal,
            modalAwal: totalModal,
            modalIdr: soldModal,
            pnlPct,
            pnlIdr,
            totalReturn,
          };
        } else {
          db.prepare(`
            UPDATE user_positions 
            SET status = 'CLOSED', tanggal_jual = ?, harga_jual = ?, pnl_persen = ?, pnl_idr = ? 
            WHERE id = ?
          `).run(tanggal, currentPrice, pnlPct, pnlIdr, existing.id);
          
          db.prepare(`
            INSERT INTO position_transactions (position_id, simbol, coin_id, tipe, tanggal, waktu, harga, modal_idr, quantity, pnl_idr, pnl_persen, notes)
            VALUES (?, ?, ?, 'CLOSE_SELL', ?, ?, ?, ?, ?, ?, ?, 'Full close position')
          `).run(existing.id, existing.simbol, existing.coin_id, tanggal, waktu, currentPrice, totalModal, totalQuantity, pnlIdr, pnlPct);
          
          return {
            success: true,
            isPartial: false,
            portionPct: 100,
            simbol: existing.simbol,
            nama: existing.nama,
            tanggalBeli: existing.tanggal_beli,
            hargaBeli,
            hargaJual: currentPrice,
            modalAwal: totalModal,
            modalIdr: totalModal,
            totalReturn,
            pnlPct,
            pnlIdr,
          };
        }
      });
      
      console.log(JSON.stringify(result));
    } else if (command === 'get-active') {
      const [simbolRaw] = args;
      const target = (simbolRaw || '').trim();
      if (!target || target === '__NONE__') {
        console.log(JSON.stringify({ found: false, simbol: '' }));
        process.exit(0);
      }
      
      const rows = db.prepare(`
        SELECT * FROM user_positions 
        WHERE (UPPER(simbol) = UPPER(?) OR LOWER(coin_id) = LOWER(?)) AND status = 'ACTIVE'
      `).all(target, target);
      
      if (rows.length === 0) {
        console.log(JSON.stringify({ found: false, simbol: target }));
      } else if (rows.length === 1) {
        console.log(JSON.stringify({ found: true, ambiguous: false, position: rows[0] }));
      } else {
        console.log(JSON.stringify({
          found: true,
          ambiguous: true,
          count: rows.length,
          positions: rows.map(r => ({ id: r.id, simbol: r.simbol, coin_id: r.coin_id, nama: r.nama, modal_idr: r.modal_idr })),
          message: `Ditemukan ${rows.length} posisi aktif untuk "${target}". Harap gunakan coin_id spesifik.`,
        }));
      }
    } else if (command === 'list-active') {
      const rows = db.prepare("SELECT * FROM user_positions WHERE status = 'ACTIVE' ORDER BY id DESC").all();
      console.log(JSON.stringify({ count: rows.length, positions: rows }));
    } else if (command === 'history') {
      const rows = db.prepare("SELECT * FROM position_transactions ORDER BY id DESC LIMIT 50").all();
      console.log(JSON.stringify({ count: rows.length, transactions: rows }));
    } else if (command === 'check-alerts') {
      const rows = db.prepare("SELECT * FROM user_positions WHERE status = 'ACTIVE'").all();
      if (!rows.length) {
        console.log(JSON.stringify({ alertCount: 0, alerts: [] }));
        process.exit(0);
      }
      
      const ids = [...new Set(rows.map(r => r.coin_id))].join(',');
      let priceData = {};
      try {
        priceData = await fetchJson(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=idr`);
      } catch (e) {
        console.log(JSON.stringify({ alertCount: 0, alerts: [], error: 'COINGECKO_FETCH_FAILED' }));
        process.exit(0);
      }
      
      const alerts = [];
      
      for (const pos of rows) {
        const p = priceData[pos.coin_id]?.idr;
        if (!p || typeof p !== 'number' || p <= 0) continue;
        
        const buyPrice = Number(pos.harga_beli);
        const tp = Number(pos.target_profit);
        const sl = Number(pos.stop_loss);
        const pnlPct = Number(((p - buyPrice) / buyPrice * 100).toFixed(1));
        
        // 1. Target Profit Hit Check (Decoupled: do NOT persist alert timestamp before Telegram delivery)
        if (p >= tp) {
          if (!pos.tp_alerted_at) {
            alerts.push({
              positionId: pos.id,
              type: 'TP_HIT',
              simbol: pos.simbol,
              nama: pos.nama,
              currentPrice: p,
              targetProfit: tp,
              pnlPct,
            });
          }
        } else if (pos.tp_alerted_at && p < tp * 0.98) {
          // Re-arm TP alert if price retreats 2% below TP
          db.prepare("UPDATE user_positions SET tp_alerted_at = NULL WHERE id = ?").run(pos.id);
        }
        
        // 2. Stop Loss Hit Check (Decoupled: do NOT persist alert timestamp before Telegram delivery)
        if (p <= sl) {
          if (!pos.sl_alerted_at) {
            alerts.push({
              positionId: pos.id,
              type: 'SL_HIT',
              simbol: pos.simbol,
              nama: pos.nama,
              currentPrice: p,
              stopLoss: sl,
              pnlPct,
            });
          }
        } else if (pos.sl_alerted_at && p > sl * 1.02) {
          // Re-arm SL alert if price recovers 2% above SL
          db.prepare("UPDATE user_positions SET sl_alerted_at = NULL WHERE id = ?").run(pos.id);
        }
      }
      console.log(JSON.stringify({ alertCount: alerts.length, alerts }));
    } else if (command === 'ack-alert') {
      const [posIdStr, alertType] = args;
      const posId = parseInt(posIdStr, 10);
      const type = (alertType || '').toUpperCase().trim();
      if (!posId || (type !== 'TP' && type !== 'SL' && type !== 'TP_HIT' && type !== 'SL_HIT')) {
        console.log(JSON.stringify({ success: false, error: 'INVALID_ACK_ARGS' }));
        process.exit(0);
      }
      const { tanggal, waktu } = nowTime();
      const nowStamp = `${tanggal} ${waktu}`;
      if (type === 'TP' || type === 'TP_HIT') {
        db.prepare("UPDATE user_positions SET tp_alerted_at = ? WHERE id = ?").run(nowStamp, posId);
      } else {
        db.prepare("UPDATE user_positions SET sl_alerted_at = ? WHERE id = ?").run(nowStamp, posId);
      }
      console.log(JSON.stringify({ success: true, positionId: posId, acknowledged: type, timestamp: nowStamp }));
    } else {
      console.log(JSON.stringify({ error: 'UNKNOWN_COMMAND' }));
    }
  } catch (err) {
    console.log(JSON.stringify({ success: false, error: err.message }));
  }
})();
