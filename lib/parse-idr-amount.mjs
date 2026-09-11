/**
 * Parse nominal IDR yang didukung command Telegram.
 *
 * Tanpa suffix, hanya integer atau separator ribuan yang diterima.
 * Dengan suffix, satu koma/titik diperlakukan sebagai desimal:
 * 150k, 1.5jt, 1,5jt, 2m.
 */
export function parseIdrAmount(raw) {
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
