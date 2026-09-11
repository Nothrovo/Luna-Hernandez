#!/usr/bin/env node
/**
 * manage_positions.mjs — Portfolio & Position Manager for Luna Hernandez (Midas) Bot
 * Manages active swing trading positions in SQLite with transaction ledger and anti-spam alerts.
 */

import { DatabaseSync } from 'node:sqlite';
import https from 'node:https';

const dbPath = process.env.SQLITE_PATH || '/home/node/.n8n/crypto_decision_support.sqlite';
const db = new DatabaseSync(dbPath);

// 1. Inisialisasi tabel & migrasi skema
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
  tipe TEXT NOT NULL, -- BUY, DCA_AVERAGE_UP, DCA_AVERAGE_DOWN, PARTIAL_SELL, CLOSE_SELL
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

// Migrasi kolom jika tabel lama belum memiliki quantity atau alerted_at
try {
  const cols = db.prepare("PRAGMA table_info(user_positions)").all().map(c => c.name);
  if (!cols.includes('quantity')) {
    db.exec("ALTER TABLE user_positions ADD COLUMN quantity REAL;");
    db.exec("UPDATE user_positions SET quantity = modal_idr / harga_beli WHERE (quantity IS NULL OR quantity = 0) AND harga_beli > 0;");
  }
  if (!cols.includes('tp_alerted_at')) {
    db.exec("ALTER TABLE user_positions ADD COLUMN tp_alerted_at TEXT;");
  }
  if (!cols.includes('sl_alerted_at')) {
    db.exec("ALTER TABLE user_positions ADD COLUMN sl_alerted_at TEXT;");
  }
} catch (e) {
  // Ignored if already migrated
}

const [,, command, ...args] = process.argv;

function nowTime() {
  const d = new Date();
  const tanggal = d.toISOString().slice(0, 10);
  const waktu = d.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' }).replace(':', '.');
  return { tanggal, waktu };
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'LunaHernandezBot/2.0' } }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

(async () => {
  try {
    if (command === 'buy') {
      const [simbolRaw, coinId, nama, hargaStr, modalStr, tpStr, slStr] = args;
      const simbol = (simbolRaw || '').toUpperCase().trim();
      const hargaBeli = parseFloat(hargaStr) || 0;
      const modalIdr = parseFloat(modalStr) || 100000;
      const tpPrice = parseFloat(tpStr) || (hargaBeli * 1.12);
      const slPrice = parseFloat(slStr) || (hargaBeli * 0.94);
      
      if (!simbol || hargaBeli <= 0 || !Number.isFinite(hargaBeli)) {
        console.log(JSON.stringify({ success: false, error: 'INVALID_ARGS', message: 'Harga beli harus positif dan valid' }));
        process.exit(0);
      }
      
      const newQuantity = modalIdr / hargaBeli;
      const existing = db.prepare("SELECT * FROM user_positions WHERE simbol = ? AND status = 'ACTIVE' LIMIT 1").get(simbol);
      const { tanggal, waktu } = nowTime();
      
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
        
        // Reset alerted status on position update since basis has changed
        db.prepare(`
          UPDATE user_positions 
          SET harga_beli = ?, modal_idr = ?, quantity = ?, target_profit = ?, stop_loss = ?, tp_alerted_at = NULL, sl_alerted_at = NULL 
          WHERE id = ?
        `).run(avgPrice, totalModal, totalQuantity, newTp, newSl, existing.id);
        
        // Record into transaction ledger
        db.prepare(`
          INSERT INTO position_transactions (position_id, simbol, coin_id, tipe, tanggal, waktu, harga, modal_idr, quantity, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(existing.id, simbol, coinId || existing.coin_id, actionType, tanggal, waktu, hargaBeli, modalIdr, newQuantity, 'DCA leg entry');
        
        console.log(JSON.stringify({
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
        }));
      } else {
        // New position
        const res = db.prepare(`
          INSERT INTO user_positions (tanggal_beli, waktu_beli, simbol, coin_id, nama, harga_beli, modal_idr, quantity, target_profit, stop_loss, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
        `).run(tanggal, waktu, simbol, coinId || simbol.toLowerCase(), nama || simbol, hargaBeli, modalIdr, newQuantity, tpPrice, slPrice);
        
        const positionId = Number(res.lastInsertRowid);
        
        // Record into transaction ledger
        db.prepare(`
          INSERT INTO position_transactions (position_id, simbol, coin_id, tipe, tanggal, waktu, harga, modal_idr, quantity, notes)
          VALUES (?, ?, ?, 'BUY', ?, ?, ?, ?, ?, 'Initial position entry')
        `).run(positionId, simbol, coinId || simbol.toLowerCase(), tanggal, waktu, hargaBeli, modalIdr, newQuantity);
        
        const tpPct = ((tpPrice - hargaBeli) / hargaBeli * 100).toFixed(1);
        const slPct = ((hargaBeli - slPrice) / hargaBeli * 100).toFixed(1);
        
        console.log(JSON.stringify({
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
        }));
      }
    } else if (command === 'sell') {
      const [simbolRaw, currentPriceStr, porsiStr] = args;
      const simbol = (simbolRaw || '').toUpperCase().trim();
      const currentPrice = parseFloat(currentPriceStr) || 0;
      
      if (!currentPrice || currentPrice <= 0 || !Number.isFinite(currentPrice)) {
        console.log(JSON.stringify({ success: false, error: 'INVALID_PRICE', message: 'Harga pasar live tidak valid atau tidak tersedia.' }));
        process.exit(0);
      }
      
      const existing = db.prepare("SELECT * FROM user_positions WHERE simbol = ? AND status = 'ACTIVE' LIMIT 1").get(simbol);
      if (!existing) {
        console.log(JSON.stringify({ success: false, error: 'NOT_FOUND', simbol }));
        process.exit(0);
      }
      
      const hargaBeli = Number(existing.harga_beli);
      const totalModal = Number(existing.modal_idr);
      const totalQuantity = Number(existing.quantity) > 0 ? Number(existing.quantity) : (totalModal / hargaBeli);
      const { tanggal, waktu } = nowTime();
      
      // Parse porsi sell (default 100%)
      let sellRatio = 1.0;
      let isPartial = false;
      const pRaw = (porsiStr || '').trim().toLowerCase();
      if (pRaw && pRaw !== 'all' && pRaw !== '100%') {
        if (pRaw.endsWith('%')) {
          const pct = parseFloat(pRaw.slice(0, -1));
          if (pct > 0 && pct < 100) {
            sellRatio = pct / 100;
            isPartial = true;
          }
        } else {
          const nom = parseFloat(pRaw);
          if (nom > 0 && nom < totalModal) {
            sellRatio = nom / totalModal;
            isPartial = true;
          }
        }
      }
      
      const soldModal = totalModal * sellRatio;
      const soldQuantity = totalQuantity * sellRatio;
      const pnlPct = Number(((currentPrice - hargaBeli) / hargaBeli * 100).toFixed(2));
      const pnlIdr = Math.round(soldModal * (pnlPct / 100));
      const totalReturn = Math.round(soldModal + pnlIdr);
      
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
        `).run(existing.id, simbol, existing.coin_id, tanggal, waktu, currentPrice, soldModal, soldQuantity, pnlIdr, pnlPct, `Partial close ${(sellRatio * 100).toFixed(0)}%`);
        
        console.log(JSON.stringify({
          success: true,
          isPartial: true,
          portionPct: Number((sellRatio * 100).toFixed(0)),
          simbol,
          nama: existing.nama,
          tanggalBeli: existing.tanggal_beli,
          hargaBeli,
          hargaJual: currentPrice,
          modalTerjual: soldModal,
          modalSisa: remainingModal,
          pnlPct,
          pnlIdr,
          totalReturn,
        }));
      } else {
        // Full close
        db.prepare(`
          UPDATE user_positions 
          SET status = 'CLOSED', tanggal_jual = ?, harga_jual = ?, pnl_persen = ?, pnl_idr = ? 
          WHERE id = ?
        `).run(tanggal, currentPrice, pnlPct, pnlIdr, existing.id);
        
        db.prepare(`
          INSERT INTO position_transactions (position_id, simbol, coin_id, tipe, tanggal, waktu, harga, modal_idr, quantity, pnl_idr, pnl_persen, notes)
          VALUES (?, ?, ?, 'CLOSE_SELL', ?, ?, ?, ?, ?, ?, ?, 'Full close position')
        `).run(existing.id, simbol, existing.coin_id, tanggal, waktu, currentPrice, totalModal, totalQuantity, pnlIdr, pnlPct);
        
        console.log(JSON.stringify({
          success: true,
          isPartial: false,
          portionPct: 100,
          simbol,
          nama: existing.nama,
          tanggalBeli: existing.tanggal_beli,
          hargaBeli,
          hargaJual: currentPrice,
          modalIdr: totalModal,
          pnlPct,
          pnlIdr,
          totalReturn,
        }));
      }
    } else if (command === 'get-active') {
      const [simbolRaw] = args;
      const simbol = (simbolRaw || '').toUpperCase().trim();
      const existing = db.prepare("SELECT * FROM user_positions WHERE simbol = ? AND status = 'ACTIVE' LIMIT 1").get(simbol);
      
      if (!existing) {
        console.log(JSON.stringify({ found: false, simbol }));
      } else {
        console.log(JSON.stringify({ found: true, position: existing }));
      }
    } else if (command === 'list-active') {
      const rows = db.prepare("SELECT * FROM user_positions WHERE status = 'ACTIVE' ORDER BY id DESC").all();
      console.log(JSON.stringify({ count: rows.length, positions: rows }));
    } else if (command === 'history') {
      const [simbolRaw] = args;
      const simbol = (simbolRaw || '').toUpperCase().trim();
      let txs;
      if (simbol) {
        txs = db.prepare("SELECT * FROM position_transactions WHERE simbol = ? ORDER BY id DESC LIMIT 20").all(simbol);
      } else {
        txs = db.prepare("SELECT * FROM position_transactions ORDER BY id DESC LIMIT 25").all();
      }
      console.log(JSON.stringify({ count: txs.length, transactions: txs }));
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
      const { tanggal, waktu } = nowTime();
      const nowStamp = `${tanggal} ${waktu}`;
      
      for (const pos of rows) {
        const p = priceData[pos.coin_id]?.idr;
        if (!p || typeof p !== 'number' || p <= 0) continue;
        
        const buyPrice = Number(pos.harga_beli);
        const tp = Number(pos.target_profit);
        const sl = Number(pos.stop_loss);
        const pnlPct = Number(((p - buyPrice) / buyPrice * 100).toFixed(1));
        
        // 1. Target Profit Hit Check
        if (p >= tp) {
          if (!pos.tp_alerted_at) {
            alerts.push({
              type: 'TP_HIT',
              simbol: pos.simbol,
              nama: pos.nama,
              currentPrice: p,
              targetProfit: tp,
              pnlPct,
            });
            db.prepare("UPDATE user_positions SET tp_alerted_at = ? WHERE id = ?").run(nowStamp, pos.id);
          }
        } else if (pos.tp_alerted_at && p < tp * 0.98) {
          // Re-arm TP alert if price retreats 2% below TP
          db.prepare("UPDATE user_positions SET tp_alerted_at = NULL WHERE id = ?").run(pos.id);
        }
        
        // 2. Stop Loss Hit Check
        if (p <= sl) {
          if (!pos.sl_alerted_at) {
            alerts.push({
              type: 'SL_HIT',
              simbol: pos.simbol,
              nama: pos.nama,
              currentPrice: p,
              stopLoss: sl,
              pnlPct,
            });
            db.prepare("UPDATE user_positions SET sl_alerted_at = ? WHERE id = ?").run(nowStamp, pos.id);
          }
        } else if (pos.sl_alerted_at && p > sl * 1.02) {
          // Re-arm SL alert if price recovers 2% above SL
          db.prepare("UPDATE user_positions SET sl_alerted_at = NULL WHERE id = ?").run(pos.id);
        }
      }
      console.log(JSON.stringify({ alertCount: alerts.length, alerts }));
    } else {
      console.log(JSON.stringify({ error: 'UNKNOWN_COMMAND' }));
    }
  } catch (err) {
    console.log(JSON.stringify({ success: false, error: err.message }));
  }
})();
