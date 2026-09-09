#!/usr/bin/env node
/**
 * manage_positions.mjs — Portfolio & Position Manager for Midas Bot
 * Manages active swing trading positions in SQLite.
 */

import { DatabaseSync } from 'node:sqlite';
import https from 'node:https';

const dbPath = process.env.SQLITE_PATH || '/home/node/.n8n/crypto_decision_support.sqlite';
const db = new DatabaseSync(dbPath);

// Ensure table exists
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
  target_profit REAL NOT NULL,
  stop_loss REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  tanggal_jual TEXT,
  harga_jual REAL,
  pnl_persen REAL,
  pnl_idr REAL
);
`);

const [,, command, ...args] = process.argv;

function nowTime() {
  const d = new Date();
  const tanggal = d.toISOString().slice(0, 10);
  const waktu = d.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' });
  return { tanggal, waktu };
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'MidasBot/1.0' } }, res => {
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
      
      if (!simbol || hargaBeli <= 0) {
        console.log(JSON.stringify({ success: false, error: 'INVALID_ARGS' }));
        process.exit(0);
      }
      
      // Cek apakah sudah ada posisi aktif (DCA logic)
      const existing = db.prepare("SELECT id, harga_beli, modal_idr, target_profit, stop_loss FROM user_positions WHERE simbol = ? AND status = 'ACTIVE' LIMIT 1").get(simbol);
      const { tanggal, waktu } = nowTime();
      
      if (existing) {
        const oldModal = Number(existing.modal_idr);
        const oldPrice = Number(existing.harga_beli);
        const totalModal = oldModal + modalIdr;
        const oldCoins = oldModal / oldPrice;
        const newCoins = modalIdr / hargaBeli;
        const avgPrice = totalModal / (oldCoins + newCoins);
        
        const tpPct = (tpPrice - hargaBeli) / hargaBeli;
        const slPct = (hargaBeli - slPrice) / hargaBeli;
        const newTp = avgPrice * (1 + tpPct);
        const newSl = avgPrice * (1 - slPct);
        
        db.prepare("UPDATE user_positions SET harga_beli = ?, modal_idr = ?, target_profit = ?, stop_loss = ? WHERE id = ?")
          .run(avgPrice, totalModal, newTp, newSl, existing.id);
          
        console.log(JSON.stringify({
          success: true,
          action: 'dca',
          simbol,
          nama: nama || simbol,
          entryBaru: hargaBeli,
          oldPrice,
          avgPrice: Math.round(avgPrice),
          modalBaru: modalIdr,
          totalModal: Math.round(totalModal),
          tpPrice: Math.round(newTp),
          slPrice: Math.round(newSl),
          tpPct: Number((tpPct * 100).toFixed(1)),
          slPct: Number((slPct * 100).toFixed(1)),
        }));
      } else {
        db.prepare("INSERT INTO user_positions (tanggal_beli, waktu_beli, simbol, coin_id, nama, harga_beli, modal_idr, target_profit, stop_loss, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')")
          .run(tanggal, waktu, simbol, coinId || simbol.toLowerCase(), nama || simbol, hargaBeli, modalIdr, tpPrice, slPrice);
          
        const tpPct = ((tpPrice - hargaBeli) / hargaBeli * 100).toFixed(1);
        const slPct = ((hargaBeli - slPrice) / hargaBeli * 100).toFixed(1);
        
        console.log(JSON.stringify({
          success: true,
          action: 'new',
          simbol,
          nama: nama || simbol,
          avgPrice: Math.round(hargaBeli),
          totalModal: Math.round(modalIdr),
          tpPrice: Math.round(tpPrice),
          slPrice: Math.round(slPrice),
          tpPct: Number(tpPct),
          slPct: Number(slPct),
        }));
      }
    } else if (command === 'sell') {
      const [simbolRaw, currentPriceStr] = args;
      const simbol = (simbolRaw || '').toUpperCase().trim();
      const currentPrice = parseFloat(currentPriceStr) || 0;
      
      const existing = db.prepare("SELECT id, tanggal_beli, waktu_beli, nama, harga_beli, modal_idr, target_profit, stop_loss FROM user_positions WHERE simbol = ? AND status = 'ACTIVE' LIMIT 1").get(simbol);
      
      if (!existing) {
        console.log(JSON.stringify({ success: false, error: 'NOT_FOUND', simbol }));
        process.exit(0);
      }
      
      const hargaBeli = Number(existing.harga_beli);
      const modalIdr = Number(existing.modal_idr);
      const sellPrice = currentPrice > 0 ? currentPrice : hargaBeli;
      const pnlPct = Number(((sellPrice - hargaBeli) / hargaBeli * 100).toFixed(2));
      const pnlIdr = Math.round(modalIdr * (pnlPct / 100));
      const totalReturn = Math.round(modalIdr + pnlIdr);
      const { tanggal } = nowTime();
      
      db.prepare("UPDATE user_positions SET status = 'CLOSED', tanggal_jual = ?, harga_jual = ?, pnl_persen = ?, pnl_idr = ? WHERE id = ?")
        .run(tanggal, sellPrice, pnlPct, pnlIdr, existing.id);
        
      console.log(JSON.stringify({
        success: true,
        simbol,
        nama: existing.nama,
        tanggalBeli: existing.tanggal_beli,
        hargaBeli: Math.round(hargaBeli),
        hargaJual: Math.round(sellPrice),
        modalIdr: Math.round(modalIdr),
        pnlPct,
        pnlIdr,
        totalReturn,
      }));
    } else if (command === 'get-active') {
      const [simbolRaw] = args;
      const simbol = (simbolRaw || '').toUpperCase().trim();
      const existing = db.prepare("SELECT id, tanggal_beli, waktu_beli, simbol, coin_id, nama, harga_beli, modal_idr, target_profit, stop_loss FROM user_positions WHERE simbol = ? AND status = 'ACTIVE' LIMIT 1").get(simbol);
      
      if (!existing) {
        console.log(JSON.stringify({ found: false, simbol }));
      } else {
        console.log(JSON.stringify({ found: true, position: existing }));
      }
    } else if (command === 'list-active') {
      const rows = db.prepare("SELECT id, tanggal_beli, waktu_beli, simbol, coin_id, nama, harga_beli, modal_idr, target_profit, stop_loss FROM user_positions WHERE status = 'ACTIVE' ORDER BY id DESC").all();
      console.log(JSON.stringify({ count: rows.length, positions: rows }));
    } else if (command === 'check-alerts') {
      const rows = db.prepare("SELECT id, tanggal_beli, waktu_beli, simbol, coin_id, nama, harga_beli, modal_idr, target_profit, stop_loss FROM user_positions WHERE status = 'ACTIVE'").all();
      if (!rows.length) {
        console.log(JSON.stringify({ alertCount: 0, alerts: [] }));
        process.exit(0);
      }
      
      const ids = rows.map(r => r.coin_id).join(',');
      const priceData = await fetchJson(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=idr`);
      
      const alerts = [];
      for (const pos of rows) {
        const p = priceData[pos.coin_id]?.idr;
        if (!p) continue;
        const buyPrice = Number(pos.harga_beli);
        const tp = Number(pos.target_profit);
        const sl = Number(pos.stop_loss);
        const pnlPct = Number(((p - buyPrice) / buyPrice * 100).toFixed(1));
        
        if (p >= tp) {
          alerts.push({
            type: 'TP_HIT',
            simbol: pos.simbol,
            nama: pos.nama,
            currentPrice: p,
            targetProfit: tp,
            pnlPct,
          });
        } else if (p <= sl) {
          alerts.push({
            type: 'SL_HIT',
            simbol: pos.simbol,
            nama: pos.nama,
            currentPrice: p,
            stopLoss: sl,
            pnlPct,
          });
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
