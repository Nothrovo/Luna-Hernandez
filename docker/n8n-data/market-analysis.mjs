const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

export class MarketAnalysisError extends Error {
  constructor(code, message, { retryable = false, details = null } = {}) {
    super(message);
    this.name = 'MarketAnalysisError';
    this.code = code;
    this.retryable = retryable;
    this.details = details;
  }
}

export function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function round(value, digits = 4) {
  if (!Number.isFinite(value)) return null;
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function mean(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function standardDeviation(values) {
  if (values.length < 2) return 0;
  const average = mean(values);
  return Math.sqrt(values.reduce((sum, value) => sum + (value - average) ** 2, 0) / values.length);
}

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeCandles(candles) {
  const byTimestamp = new Map();
  for (const raw of candles || []) {
    const ts = finiteNumber(raw?.ts);
    const open = finiteNumber(raw?.open);
    const high = finiteNumber(raw?.high);
    const low = finiteNumber(raw?.low);
    const close = finiteNumber(raw?.close);
    const volume = finiteNumber(raw?.volume) ?? 0;
    const closedAt = finiteNumber(raw?.closedAt);
    if (ts == null || open == null || high == null || low == null || close == null) continue;
    if (ts <= 0 || open <= 0 || high <= 0 || low <= 0 || close <= 0) continue;
    if (high < Math.max(open, close) || low > Math.min(open, close) || high < low || volume < 0) continue;
    byTimestamp.set(ts, { ts, closedAt: closedAt ?? ts, open, high, low, close, volume });
  }
  return [...byTimestamp.values()].sort((left, right) => left.ts - right.ts);
}

export function normalizeAlpacaBars(payload, {
  symbol = '',
  timeframeMs = 0,
  nowMs = Date.now(),
} = {}) {
  let bars = payload?.bars;
  if (!Array.isArray(bars) && bars && typeof bars === 'object') {
    bars = bars[symbol] || bars[symbol.toUpperCase()] || [];
  }
  const normalized = normalizeCandles((bars || []).map(bar => ({
    ts: Date.parse(bar?.t),
    closedAt: Date.parse(bar?.t) + Math.max(0, timeframeMs),
    open: bar?.o,
    high: bar?.h,
    low: bar?.l,
    close: bar?.c,
    volume: bar?.v,
  })));
  return normalized.filter(candle => candle.ts + Math.max(0, timeframeMs) <= nowMs);
}

export function normalizeBinanceKlines(rows, { nowMs = Date.now() } = {}) {
  const normalized = [];
  for (const row of rows || []) {
    if (!Array.isArray(row) || row.length < 7) continue;
    const closeTime = finiteNumber(row[6]);
    if (closeTime == null || closeTime >= nowMs) continue;
    normalized.push({
      ts: finiteNumber(row[0]),
      closedAt: closeTime,
      open: finiteNumber(row[1]),
      high: finiteNumber(row[2]),
      low: finiteNumber(row[3]),
      close: finiteNumber(row[4]),
      volume: finiteNumber(row[5]) ?? 0,
    });
  }
  return normalizeCandles(normalized);
}

export function aggregateCandlesByCount(candles, size) {
  if (!Number.isInteger(size) || size < 1) throw new TypeError('size must be a positive integer');
  const source = normalizeCandles(candles);
  const result = [];
  const intervals = source.slice(1).map((candle, index) => candle.ts - source[index].ts).filter(value => value > 0);
  const expectedInterval = intervals.length ? [...intervals].sort((left, right) => left - right)[Math.floor(intervals.length / 2)] : 0;
  let group = [];
  const flush = () => {
    if (group.length !== size) return;
    result.push({
      ts: group[0].ts,
      closedAt: group.at(-1).closedAt,
      open: group[0].open,
      high: Math.max(...group.map(candle => candle.high)),
      low: Math.min(...group.map(candle => candle.low)),
      close: group.at(-1).close,
      volume: group.reduce((sum, candle) => sum + candle.volume, 0),
    });
  };
  for (const candle of source) {
    const previous = group.at(-1);
    if (previous && expectedInterval > 0 && candle.ts - previous.ts > expectedInterval * 1.5) {
      flush();
      group = [];
    }
    group.push(candle);
    if (group.length === size) {
      flush();
      group = [];
    }
  }
  return result;
}

export function aggregateWeeklyCandles(candles, { nowMs = Date.now(), closedOnly = true } = {}) {
  const weeks = new Map();
  for (const candle of normalizeCandles(candles)) {
    const date = new Date(candle.ts);
    const day = date.getUTCDay() || 7;
    const monday = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - day + 1);
    if (!weeks.has(monday)) {
      weeks.set(monday, { ...candle, ts: monday });
      continue;
    }
    const week = weeks.get(monday);
    week.high = Math.max(week.high, candle.high);
    week.low = Math.min(week.low, candle.low);
    week.close = candle.close;
    week.closedAt = candle.closedAt;
    week.volume += candle.volume;
  }
  return [...weeks.values()]
    .filter(week => !closedOnly || week.ts + 7 * DAY_MS <= nowMs)
    .sort((left, right) => left.ts - right.ts);
}

export function sma(values, period) {
  if (!Array.isArray(values) || values.length < period || period < 1) return null;
  return mean(values.slice(-period));
}

export function ema(values, period) {
  const output = Array(values.length).fill(null);
  if (values.length < period || period < 1) return output;
  let current = mean(values.slice(0, period));
  output[period - 1] = current;
  const multiplier = 2 / (period + 1);
  for (let index = period; index < values.length; index++) {
    current = values[index] * multiplier + current * (1 - multiplier);
    output[index] = current;
  }
  return output;
}

export function rsiWilder(values, period = 14) {
  if (!Array.isArray(values) || values.length <= period) return null;
  let gains = 0;
  let losses = 0;
  for (let index = 1; index <= period; index++) {
    const delta = values[index] - values[index - 1];
    gains += Math.max(delta, 0);
    losses += Math.max(-delta, 0);
  }
  let averageGain = gains / period;
  let averageLoss = losses / period;
  for (let index = period + 1; index < values.length; index++) {
    const delta = values[index] - values[index - 1];
    averageGain = (averageGain * (period - 1) + Math.max(delta, 0)) / period;
    averageLoss = (averageLoss * (period - 1) + Math.max(-delta, 0)) / period;
  }
  if (averageLoss === 0) return 100;
  return 100 - 100 / (1 + averageGain / averageLoss);
}

export function macd(values, { fast = 12, slow = 26, signal = 9 } = {}) {
  if (!Array.isArray(values) || values.length < slow + signal) return null;
  const fastValues = ema(values, fast);
  const slowValues = ema(values, slow);
  const lineValues = values
    .map((_, index) => fastValues[index] != null && slowValues[index] != null
      ? fastValues[index] - slowValues[index]
      : null)
    .filter(value => value != null);
  if (lineValues.length < signal) return null;
  const signalValues = ema(lineValues, signal);
  const line = lineValues.at(-1);
  const signalLine = signalValues.at(-1);
  return { line, signal: signalLine, histogram: line - signalLine };
}

export function bollinger(values, period = 20, deviations = 2) {
  if (!Array.isArray(values) || values.length < period) return null;
  const window = values.slice(-period);
  const middle = mean(window);
  const deviation = standardDeviation(window);
  return { middle, upper: middle + deviations * deviation, lower: middle - deviations * deviation };
}

export function atr(candles, period = 14) {
  const source = normalizeCandles(candles);
  if (source.length <= period) return null;
  const trueRanges = [];
  for (let index = 1; index < source.length; index++) {
    const current = source[index];
    const previousClose = source[index - 1].close;
    trueRanges.push(Math.max(
      current.high - current.low,
      Math.abs(current.high - previousClose),
      Math.abs(current.low - previousClose),
    ));
  }
  let value = mean(trueRanges.slice(0, period));
  for (let index = period; index < trueRanges.length; index++) {
    value = (value * (period - 1) + trueRanges[index]) / period;
  }
  return value;
}

export function adx(candles, period = 14) {
  const source = normalizeCandles(candles);
  if (source.length < period * 2 + 1) return null;
  const trueRanges = [];
  const plusMovement = [];
  const minusMovement = [];
  for (let index = 1; index < source.length; index++) {
    const current = source[index];
    const previous = source[index - 1];
    const upward = current.high - previous.high;
    const downward = previous.low - current.low;
    plusMovement.push(upward > downward && upward > 0 ? upward : 0);
    minusMovement.push(downward > upward && downward > 0 ? downward : 0);
    trueRanges.push(Math.max(
      current.high - current.low,
      Math.abs(current.high - previous.close),
      Math.abs(current.low - previous.close),
    ));
  }

  let smoothedTr = trueRanges.slice(0, period).reduce((sum, value) => sum + value, 0);
  let smoothedPlus = plusMovement.slice(0, period).reduce((sum, value) => sum + value, 0);
  let smoothedMinus = minusMovement.slice(0, period).reduce((sum, value) => sum + value, 0);
  const dxValues = [];
  for (let index = period; index < trueRanges.length; index++) {
    smoothedTr = smoothedTr - smoothedTr / period + trueRanges[index];
    smoothedPlus = smoothedPlus - smoothedPlus / period + plusMovement[index];
    smoothedMinus = smoothedMinus - smoothedMinus / period + minusMovement[index];
    const plusDi = smoothedTr > 0 ? 100 * smoothedPlus / smoothedTr : 0;
    const minusDi = smoothedTr > 0 ? 100 * smoothedMinus / smoothedTr : 0;
    const total = plusDi + minusDi;
    dxValues.push(total > 0 ? 100 * Math.abs(plusDi - minusDi) / total : 0);
  }
  if (dxValues.length < period) return null;
  let value = mean(dxValues.slice(0, period));
  for (let index = period; index < dxValues.length; index++) {
    value = (value * (period - 1) + dxValues[index]) / period;
  }
  return value;
}

export function annualizedVolatility(values, periodsPerYear) {
  if (!Array.isArray(values) || values.length < 3 || periodsPerYear <= 0) return null;
  const returns = [];
  for (let index = 1; index < values.length; index++) {
    if (values[index] > 0 && values[index - 1] > 0) returns.push(Math.log(values[index] / values[index - 1]));
  }
  return standardDeviation(returns) * Math.sqrt(periodsPerYear);
}

function trailingReturn(candles, periods = 20) {
  const source = normalizeCandles(candles);
  if (source.length <= periods) return null;
  const start = source.at(-(periods + 1)).close;
  const end = source.at(-1).close;
  return start > 0 ? end / start - 1 : null;
}

function pivotLevels(candles, atrValue) {
  const source = normalizeCandles(candles).slice(-120);
  const current = source.at(-1)?.close ?? null;
  if (source.length < 7 || current == null) return { support: null, resistance: null };
  const lows = [];
  const highs = [];
  for (let index = 2; index < source.length - 2; index++) {
    const window = source.slice(index - 2, index + 3);
    if (source[index].low === Math.min(...window.map(candle => candle.low))) lows.push(source[index].low);
    if (source[index].high === Math.max(...window.map(candle => candle.high))) highs.push(source[index].high);
  }
  const tolerance = Math.max((atrValue || current * 0.01) * 0.5, current * 0.0025);
  const cluster = values => {
    const groups = [];
    for (const value of values.sort((left, right) => left - right)) {
      const group = groups.find(candidate => Math.abs(mean(candidate) - value) <= tolerance);
      if (group) group.push(value);
      else groups.push([value]);
    }
    return groups.map(group => ({ level: mean(group), touches: group.length }));
  };
  const support = cluster(lows).filter(item => item.level < current).sort((a, b) => b.level - a.level || b.touches - a.touches)[0];
  const resistance = cluster(highs).filter(item => item.level > current).sort((a, b) => a.level - b.level || b.touches - a.touches)[0];
  return {
    support: support ? round(support.level, 6) : round(Math.min(...source.slice(-20).map(item => item.low)), 6),
    resistance: resistance ? round(resistance.level, 6) : round(Math.max(...source.slice(-20).map(item => item.high)), 6),
  };
}

export function calculateTechnicalFrame(candles, {
  periodsPerYear,
  relativeStrength = null,
  assetClass = 'stock',
} = {}) {
  const source = normalizeCandles(candles);
  if (source.length < 35) {
    throw new MarketAnalysisError('INSUFFICIENT_DATA', `Need at least 35 closed candles, received ${source.length}`);
  }
  const closes = source.map(candle => candle.close);
  const volumes = source.map(candle => candle.volume);
  const current = source.at(-1);
  const currentPrice = current.close;
  const rsi14 = rsiWilder(closes, 14);
  const macdValue = macd(closes);
  const bands = bollinger(closes);
  const atr14 = atr(source, 14);
  const adx14 = adx(source, 14);
  const sma20 = sma(closes, 20);
  const sma50 = sma(closes, 50);
  const sma200 = sma(closes, 200);
  const volatility = annualizedVolatility(closes, periodsPerYear);
  const bandWidth = Math.max((bands?.upper || currentPrice) - (bands?.lower || currentPrice), Number.EPSILON);
  const percentB = bands ? (currentPrice - bands.lower) / bandWidth : 0.5;
  const averageVolume = mean(volumes.slice(-21, -1).filter(value => value > 0));
  const volumeRatio = averageVolume > 0 ? current.volume / averageVolume : 1;
  const lastReturn = closes.length > 1 ? currentPrice / closes.at(-2) - 1 : 0;

  const trendSignals = [
    sma20 == null ? null : currentPrice >= sma20 ? 1 : -1,
    sma20 == null || sma50 == null ? null : sma20 >= sma50 ? 1 : -1,
    sma50 == null || sma200 == null ? null : sma50 >= sma200 ? 1 : -1,
  ].filter(value => value != null);
  const trend = trendSignals.length ? mean(trendSignals) : 0;
  const rsiMomentum = clamp((rsi14 - 50) / 25, -1, 1);
  const macdMomentum = clamp(((macdValue?.histogram || 0) / currentPrice) * 100, -1, 1);
  const momentum = 0.4 * rsiMomentum + 0.6 * macdMomentum;
  let setup = percentB >= 0.5 && percentB <= 0.85 ? 0.6 : percentB > 1 ? -0.5 : percentB < 0.15 ? -0.4 : 0;
  if (trend > 0 && percentB >= 0.2 && percentB <= 0.5) setup = 0.7;
  const volume = clamp(volumeRatio - 1, -1, 1) * Math.sign(lastReturn || 0);
  const relative = relativeStrength == null ? 0 : clamp(relativeStrength / 0.15, -1, 1);
  const contributions = {
    trend: 0.30 * trend,
    momentum: 0.20 * momentum,
    setup: 0.20 * setup,
    volume: 0.15 * volume,
    relativeStrength: 0.15 * relative,
  };
  const rawScore = Object.values(contributions).reduce((sum, value) => sum + value, 0);
  const score = round(clamp(50 + rawScore * 50, 0, 100), 2);
  const direction = score >= 60 ? 'BULLISH' : score <= 40 ? 'BEARISH' : 'NEUTRAL';
  const atrPct = atr14 == null ? null : atr14 / currentPrice * 100;
  const stopFloor = assetClass === 'stock' ? 2 : 1;
  const stopCeiling = assetClass === 'stock' ? 12 : 8;
  const stopDistancePct = round(clamp((atrPct || stopFloor) * 1.8, stopFloor, stopCeiling), 2);
  const levels = pivotLevels(source, atr14);

  return {
    dataPoints: source.length,
    asOf: new Date(current.closedAt ?? current.ts).toISOString(),
    periodsPerYear,
    currentPrice: round(currentPrice, 8),
    score,
    direction,
    contributions: Object.fromEntries(Object.entries(contributions).map(([key, value]) => [key, round(value, 4)])),
    indicators: {
      rsi14: round(rsi14, 2),
      macdLine: round(macdValue?.line, 8),
      macdSignal: round(macdValue?.signal, 8),
      macdHistogram: round(macdValue?.histogram, 8),
      bollingerPercentB: round(percentB, 4),
      atr14: round(atr14, 8),
      atrPct: round(atrPct, 2),
      adx14: round(adx14, 2),
      historicalVolatilityAnnualized: round(volatility, 6),
      sma20: round(sma20, 8),
      sma50: round(sma50, 8),
      sma200: round(sma200, 8),
      volumeRatio: round(volumeRatio, 3),
    },
    levels: {
      ...levels,
      stopDistancePct,
      targetDistancePct: round(stopDistancePct * 2, 2),
      riskRewardRatio: 2,
    },
  };
}

function unitsFor(companyFacts, namespace, concept, unit) {
  return companyFacts?.facts?.[namespace]?.[concept]?.units?.[unit] || [];
}

function firstConceptUnits(companyFacts, namespace, concepts, unit) {
  for (const concept of concepts) {
    const units = unitsFor(companyFacts, namespace, concept, unit);
    if (units.length) return units;
  }
  return [];
}

function annualSeries(companyFacts, concepts) {
  const rows = firstConceptUnits(companyFacts, 'us-gaap', concepts, 'USD')
    .filter(row => row?.form === '10-K' && row?.start && row?.end && Number.isFinite(Number(row.val)))
    .filter(row => {
      const duration = Date.parse(row.end) - Date.parse(row.start);
      return duration >= 300 * DAY_MS && duration <= 400 * DAY_MS;
    });
  const byEnd = new Map();
  for (const row of rows) {
    const current = byEnd.get(row.end);
    if (!current || String(row.filed || '') > String(current.filed || '')) byEnd.set(row.end, row);
  }
  return [...byEnd.values()].sort((left, right) => String(left.end).localeCompare(String(right.end)));
}

function latestInstant(companyFacts, namespace, concepts, unit) {
  const rows = firstConceptUnits(companyFacts, namespace, concepts, unit)
    .filter(row => ['10-K', '10-Q'].includes(row?.form) && Number.isFinite(Number(row.val)));
  return rows.sort((left, right) => {
    const endOrder = String(right.end || '').localeCompare(String(left.end || ''));
    return endOrder || String(right.filed || '').localeCompare(String(left.filed || ''));
  })[0]?.val ?? null;
}

function dcfScenarios({ freeCashFlow, revenueGrowthPct, cash, debt, shares }) {
  if (![freeCashFlow, cash, debt, shares].every(Number.isFinite) || freeCashFlow <= 0 || shares <= 0) return null;
  const baseGrowth = Number.isFinite(revenueGrowthPct) ? revenueGrowthPct : 5;
  const definitions = {
    bear: { growthPct: clamp(baseGrowth * 0.5, -5, 5), discountPct: 12, terminalGrowthPct: 2 },
    base: { growthPct: clamp(baseGrowth, 0, 10), discountPct: 10, terminalGrowthPct: 2.5 },
    bull: { growthPct: clamp(baseGrowth * 1.25, 2, 15), discountPct: 8, terminalGrowthPct: 3 },
  };
  return Object.fromEntries(Object.entries(definitions).map(([name, assumptions]) => {
    const growth = assumptions.growthPct / 100;
    const discount = assumptions.discountPct / 100;
    const terminalGrowth = assumptions.terminalGrowthPct / 100;
    let projected = freeCashFlow;
    let presentValue = 0;
    for (let year = 1; year <= 5; year++) {
      projected *= 1 + growth;
      presentValue += projected / (1 + discount) ** year;
    }
    const terminalValue = projected * (1 + terminalGrowth) / (discount - terminalGrowth);
    const enterpriseValue = presentValue + terminalValue / (1 + discount) ** 5;
    const equityValue = enterpriseValue + cash - debt;
    return [name, {
      ...assumptions,
      fairValuePerShare: round(Math.max(0, equityValue / shares), 4),
    }];
  }));
}

export function extractSecFundamentals(companyFacts, { currentPrice } = {}) {
  if (!companyFacts?.facts) return { available: false, score: null, dcfScenarios: null };
  const revenues = annualSeries(companyFacts, ['RevenueFromContractWithCustomerExcludingAssessedTax', 'Revenues', 'SalesRevenueNet']);
  const netIncomeRows = annualSeries(companyFacts, ['NetIncomeLoss', 'ProfitLoss']);
  const cashFlowRows = annualSeries(companyFacts, ['NetCashProvidedByUsedInOperatingActivities']);
  const capexRows = annualSeries(companyFacts, ['PaymentsToAcquirePropertyPlantAndEquipment']);
  const revenue = finiteNumber(revenues.at(-1)?.val);
  const previousRevenue = finiteNumber(revenues.at(-2)?.val);
  const netIncome = finiteNumber(netIncomeRows.at(-1)?.val);
  const operatingCashFlow = finiteNumber(cashFlowRows.at(-1)?.val);
  const capex = finiteNumber(capexRows.at(-1)?.val);
  const freeCashFlow = operatingCashFlow != null && capex != null ? operatingCashFlow - Math.abs(capex) : null;
  const currentAssets = finiteNumber(latestInstant(companyFacts, 'us-gaap', ['AssetsCurrent'], 'USD'));
  const currentLiabilities = finiteNumber(latestInstant(companyFacts, 'us-gaap', ['LiabilitiesCurrent'], 'USD'));
  const assets = finiteNumber(latestInstant(companyFacts, 'us-gaap', ['Assets'], 'USD'));
  const liabilities = finiteNumber(latestInstant(companyFacts, 'us-gaap', ['Liabilities'], 'USD'));
  const equity = finiteNumber(latestInstant(companyFacts, 'us-gaap', ['StockholdersEquity', 'StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest'], 'USD'));
  const cash = finiteNumber(latestInstant(companyFacts, 'us-gaap', ['CashAndCashEquivalentsAtCarryingValue', 'CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents'], 'USD'));
  const debtCurrent = finiteNumber(latestInstant(companyFacts, 'us-gaap', ['LongTermDebtAndFinanceLeaseObligationsCurrent', 'ShortTermBorrowings'], 'USD')) || 0;
  const debtNoncurrent = finiteNumber(latestInstant(companyFacts, 'us-gaap', ['LongTermDebtAndFinanceLeaseObligationsNoncurrent', 'LongTermDebtNoncurrent'], 'USD')) || 0;
  const debt = debtCurrent + debtNoncurrent;
  const shares = finiteNumber(latestInstant(companyFacts, 'dei', ['EntityCommonStockSharesOutstanding'], 'shares'));
  const marketCap = Number.isFinite(currentPrice) && shares != null ? currentPrice * shares : null;
  const revenueGrowthPct = revenue != null && previousRevenue > 0 ? (revenue / previousRevenue - 1) * 100 : null;
  const netMarginPct = revenue > 0 && netIncome != null ? netIncome / revenue * 100 : null;
  const freeCashFlowMarginPct = revenue > 0 && freeCashFlow != null ? freeCashFlow / revenue * 100 : null;
  const currentRatio = currentAssets != null && currentLiabilities > 0 ? currentAssets / currentLiabilities : null;
  const liabilitiesToEquity = liabilities != null && equity > 0 ? liabilities / equity : null;
  const returnOnEquityPct = netIncome != null && equity > 0 ? netIncome / equity * 100 : null;
  const priceToEarnings = marketCap != null && netIncome > 0 ? marketCap / netIncome : null;
  const priceToSales = marketCap != null && revenue > 0 ? marketCap / revenue : null;
  const priceToBook = marketCap != null && equity > 0 ? marketCap / equity : null;
  const freeCashFlowYieldPct = marketCap > 0 && freeCashFlow != null ? freeCashFlow / marketCap * 100 : null;

  const categories = [];
  if (revenueGrowthPct != null) categories.push([20, revenueGrowthPct >= 15 ? 20 : revenueGrowthPct >= 5 ? 15 : revenueGrowthPct >= 0 ? 10 : 0]);
  if (netMarginPct != null) categories.push([20, netMarginPct >= 20 ? 20 : netMarginPct >= 10 ? 15 : netMarginPct > 0 ? 8 : 0]);
  if (freeCashFlowMarginPct != null) categories.push([20, freeCashFlowMarginPct >= 15 ? 20 : freeCashFlowMarginPct >= 5 ? 14 : freeCashFlowMarginPct > 0 ? 8 : 0]);
  if (currentRatio != null) categories.push([15, currentRatio >= 1.5 ? 15 : currentRatio >= 1 ? 10 : 3]);
  if (liabilitiesToEquity != null) categories.push([10, liabilitiesToEquity <= 1 ? 10 : liabilitiesToEquity <= 2 ? 7 : 2]);
  if (priceToEarnings != null) categories.push([15, priceToEarnings <= 25 ? 15 : priceToEarnings <= 40 ? 8 : 4]);
  const availableWeight = categories.reduce((sum, [weight]) => sum + weight, 0);
  const earnedPoints = categories.reduce((sum, [, points]) => sum + points, 0);
  const score = availableWeight ? clamp(earnedPoints / availableWeight * 100, 0, 100) : null;

  return {
    available: categories.length > 0,
    entityName: companyFacts.entityName || null,
    periodEnd: revenues.at(-1)?.end || null,
    revenue: round(revenue, 2),
    revenueGrowthPct: round(revenueGrowthPct, 2),
    netIncome: round(netIncome, 2),
    netMarginPct: round(netMarginPct, 2),
    operatingCashFlow: round(operatingCashFlow, 2),
    capex: round(capex, 2),
    freeCashFlow: round(freeCashFlow, 2),
    freeCashFlowMarginPct: round(freeCashFlowMarginPct, 2),
    currentRatio: round(currentRatio, 3),
    liabilitiesToEquity: round(liabilitiesToEquity, 3),
    returnOnEquityPct: round(returnOnEquityPct, 2),
    sharesOutstanding: round(shares, 2),
    marketCap: round(marketCap, 2),
    priceToEarnings: round(priceToEarnings, 3),
    priceToSales: round(priceToSales, 3),
    priceToBook: round(priceToBook, 3),
    freeCashFlowYieldPct: round(freeCashFlowYieldPct, 2),
    score: round(score, 2),
    scoreCoveragePct: round(availableWeight, 2),
    dcfScenarios: dcfScenarios({
      freeCashFlow,
      revenueGrowthPct,
      cash: cash || 0,
      debt,
      shares,
    }),
    methodology: 'SEC XBRL deterministic ratios; DCF is an indicative scenario model, not a precise valuation.',
  };
}

function multiTimeframeSummary(frames, weights) {
  const entries = Object.entries(weights).filter(([name]) => frames[name]);
  const totalWeight = entries.reduce((sum, [, weight]) => sum + weight, 0);
  const score = entries.reduce((sum, [name, weight]) => sum + frames[name].score * weight, 0) / totalWeight;
  const bullish = entries.filter(([name]) => frames[name].direction === 'BULLISH').map(([name]) => name);
  const bearish = entries.filter(([name]) => frames[name].direction === 'BEARISH').map(([name]) => name);
  return {
    score: round(score, 2),
    alignment: bullish.length === entries.length ? 'BULLISH_ALIGNED'
      : bearish.length === entries.length ? 'BEARISH_ALIGNED'
        : 'MIXED',
    bullish,
    bearish,
  };
}

function riskFromTechnical(frame, { fundingZScore = 0, oiChangePct = 0, mixed = false } = {}) {
  let risk = 3;
  const atrPct = frame.indicators.atrPct || 0;
  const volatility = frame.indicators.historicalVolatilityAnnualized || 0;
  if (atrPct >= 5) risk += 2;
  else if (atrPct >= 3) risk += 1;
  if (volatility >= 1) risk += 2;
  else if (volatility >= 0.6) risk += 1;
  if ((frame.indicators.rsi14 || 50) >= 75 || (frame.indicators.rsi14 || 50) <= 25) risk += 1;
  if (Math.abs(fundingZScore) >= 2) risk += 1;
  if (Math.abs(oiChangePct) >= 15) risk += 1;
  if (mixed) risk += 1;
  return round(clamp(risk, 1, 10), 1);
}

export function analyzeStockMarket({
  symbol,
  companyName = null,
  hourlyBars,
  fourHourBars = null,
  dailyBars,
  benchmarkDailyBars,
  companyFacts = null,
  clock = null,
  news = [],
  nowMs = Date.now(),
}) {
  const normalizedSymbol = String(symbol || '').trim().toUpperCase();
  if (!/^[A-Z][A-Z0-9.-]{0,9}$/.test(normalizedSymbol)) {
    throw new MarketAnalysisError('INVALID_SYMBOL', 'Stock symbol must contain 1-10 letters, numbers, dot, or dash');
  }
  const dailyReturn20 = trailingReturn(dailyBars, 20);
  const benchmarkReturn20 = trailingReturn(benchmarkDailyBars, 20);
  const relativeStrength20d = dailyReturn20 != null && benchmarkReturn20 != null
    ? dailyReturn20 - benchmarkReturn20
    : null;
  const normalizedFourHourBars = Array.isArray(fourHourBars) && fourHourBars.length >= 35
    ? fourHourBars
    : aggregateCandlesByCount(hourlyBars, 4);
  const weeklyBars = aggregateWeeklyCandles(dailyBars, { nowMs });
  const frames = {
    '1h': calculateTechnicalFrame(hourlyBars, { periodsPerYear: 252 * 6.5, assetClass: 'stock' }),
    '4h': calculateTechnicalFrame(normalizedFourHourBars, { periodsPerYear: 252 * 2, assetClass: 'stock' }),
    '1d': calculateTechnicalFrame(dailyBars, { periodsPerYear: 252, relativeStrength: relativeStrength20d, assetClass: 'stock' }),
    '1w': calculateTechnicalFrame(weeklyBars, { periodsPerYear: 52, assetClass: 'stock' }),
  };
  const multiTimeframe = multiTimeframeSummary(frames, { '1h': 0.15, '4h': 0.20, '1d': 0.45, '1w': 0.20 });
  const latestPrice = frames['1h'].currentPrice;
  const fundamental = extractSecFundamentals(companyFacts, { currentPrice: latestPrice });
  const finalScore = fundamental.score == null
    ? multiTimeframe.score
    : multiTimeframe.score * 0.7 + fundamental.score * 0.3;
  let verdict = finalScore >= 65 ? 'BUY' : finalScore <= 35 ? 'SELL' : 'HOLD';
  if (verdict === 'BUY' && multiTimeframe.bearish.length >= 2) verdict = 'HOLD';
  if (verdict === 'SELL' && multiTimeframe.bullish.length >= 2) verdict = 'HOLD';
  const asOf = frames['1h'].asOf;
  return {
    schemaVersion: 1,
    assetClass: 'stock',
    symbol: normalizedSymbol,
    companyName: companyName || fundamental.entityName || normalizedSymbol,
    exchange: 'US',
    currency: 'USD',
    asOf,
    delayed: true,
    price: latestPrice,
    marketSession: {
      isOpen: clock?.is_open === true,
      nextOpen: clock?.next_open || null,
      nextClose: clock?.next_close || null,
    },
    technical: {
      score: multiTimeframe.score,
      relativeStrength20d: round(relativeStrength20d, 6),
      multiTimeframe,
      timeframes: frames,
    },
    fundamental,
    sentiment: { score: 0, methodology: 'Narrative-only Gemini synthesis; no fabricated numeric sentiment.' },
    news,
    riskScore: riskFromTechnical(frames['1d'], { mixed: multiTimeframe.alignment === 'MIXED' }),
    finalScore: round(finalScore, 2),
    verdict,
    executionAllowed: false,
  };
}

function fundingStatistics(history, fallbackRate) {
  const rates = (history || []).map(row => finiteNumber(row?.fundingRate)).filter(value => value != null);
  const latest = finiteNumber(fallbackRate) ?? rates.at(-1) ?? 0;
  const average = mean(rates);
  const deviation = standardDeviation(rates);
  const zScore = deviation > 0 ? (latest - average) / deviation : 0;
  const percentile = rates.length ? rates.filter(value => value <= latest).length / rates.length : 0.5;
  return {
    latestRate: round(latest, 8),
    latestRatePct: round(latest * 100, 5),
    averageRate: round(average, 8),
    zScore: round(zScore, 3),
    percentile: round(percentile, 3),
    observations: rates.length,
  };
}

function openInterestStatistics(history, hourlyBars) {
  const rows = (history || [])
    .map(row => ({ timestamp: finiteNumber(row?.timestamp), value: finiteNumber(row?.sumOpenInterest) }))
    .filter(row => row.timestamp != null && row.value != null && row.value > 0)
    .sort((left, right) => left.timestamp - right.timestamp);
  if (rows.length < 2) return { changePct: null, priceChangePct: null, regime: 'UNKNOWN', observations: rows.length };
  const changePct = (rows.at(-1).value / rows[0].value - 1) * 100;
  const source = normalizeCandles(hourlyBars);
  const comparison = source.slice(-Math.min(rows.length, source.length));
  const priceChangePct = comparison.length >= 2 ? (comparison.at(-1).close / comparison[0].close - 1) * 100 : null;
  let regime = 'UNKNOWN';
  if (priceChangePct != null) {
    if (priceChangePct >= 0 && changePct >= 0) regime = 'PRICE_UP_OI_UP';
    else if (priceChangePct < 0 && changePct >= 0) regime = 'PRICE_DOWN_OI_UP';
    else if (priceChangePct >= 0 && changePct < 0) regime = 'PRICE_UP_OI_DOWN';
    else regime = 'PRICE_DOWN_OI_DOWN';
  }
  return {
    first: round(rows[0].value, 4),
    latest: round(rows.at(-1).value, 4),
    changePct: round(changePct, 3),
    priceChangePct: round(priceChangePct, 3),
    regime,
    observations: rows.length,
  };
}

export function analyzeFuturesMarket({
  symbol,
  klinesByTimeframe,
  premiumIndex,
  fundingHistory = [],
  openInterestHistory = [],
  news = [],
}) {
  const normalizedSymbol = String(symbol || '').trim().toUpperCase();
  if (!/^[A-Z0-9]{5,20}$/.test(normalizedSymbol) || !normalizedSymbol.endsWith('USDT')) {
    throw new MarketAnalysisError('INVALID_SYMBOL', 'Futures symbol must be a Binance USD-M USDT pair');
  }
  const frames = {
    '15m': calculateTechnicalFrame(klinesByTimeframe?.['15m'], { periodsPerYear: 365 * 24 * 4, assetClass: 'crypto_perpetual' }),
    '1h': calculateTechnicalFrame(klinesByTimeframe?.['1h'], { periodsPerYear: 365 * 24, assetClass: 'crypto_perpetual' }),
    '4h': calculateTechnicalFrame(klinesByTimeframe?.['4h'], { periodsPerYear: 365 * 6, assetClass: 'crypto_perpetual' }),
    '1d': calculateTechnicalFrame(klinesByTimeframe?.['1d'], { periodsPerYear: 365, assetClass: 'crypto_perpetual' }),
  };
  const multiTimeframe = multiTimeframeSummary(frames, { '15m': 0.15, '1h': 0.25, '4h': 0.35, '1d': 0.25 });
  const markPrice = finiteNumber(premiumIndex?.markPrice);
  const indexPrice = finiteNumber(premiumIndex?.indexPrice);
  if (!(markPrice > 0) || !(indexPrice > 0)) {
    throw new MarketAnalysisError('INVALID_MARK_PRICE', 'Binance mark/index price is missing or invalid');
  }
  const funding = fundingStatistics(fundingHistory, premiumIndex?.lastFundingRate);
  const openInterest = openInterestStatistics(openInterestHistory, klinesByTimeframe?.['1h']);
  const basisPct = (markPrice / indexPrice - 1) * 100;
  const crowding = funding.latestRate >= 0.0005 && (funding.percentile >= 0.9 || funding.zScore >= 1.5)
    ? 'LONG_CROWDED'
    : funding.latestRate <= -0.0005 && (funding.percentile <= 0.1 || funding.zScore <= -1.5)
      ? 'SHORT_CROWDED'
      : 'BALANCED';
  const direction = multiTimeframe.score >= 60 ? 'LONG' : multiTimeframe.score <= 40 ? 'SHORT' : 'NEUTRAL';
  let verdict = direction === 'LONG' ? 'BUY' : direction === 'SHORT' ? 'SELL' : 'HOLD';
  if ((direction === 'LONG' && crowding === 'LONG_CROWDED') || (direction === 'SHORT' && crowding === 'SHORT_CROWDED')) verdict = 'HOLD';
  return {
    schemaVersion: 1,
    assetClass: 'crypto_perpetual',
    symbol: normalizedSymbol,
    exchange: 'BINANCE',
    currency: 'USDT',
    asOf: frames['15m'].asOf,
    delayed: false,
    price: round(markPrice, 8),
    technical: { score: multiTimeframe.score, multiTimeframe, timeframes: frames },
    derivatives: {
      markPrice: round(markPrice, 8),
      indexPrice: round(indexPrice, 8),
      basisPct: round(basisPct, 5),
      nextFundingTime: premiumIndex?.nextFundingTime ? new Date(Number(premiumIndex.nextFundingTime)).toISOString() : null,
      funding,
      openInterest,
      crowding,
    },
    sentiment: { score: 0, methodology: 'Narrative-only Gemini synthesis; no fabricated numeric sentiment.' },
    news,
    riskScore: riskFromTechnical(frames['4h'], {
      fundingZScore: funding.zScore,
      oiChangePct: openInterest.changePct || 0,
      mixed: multiTimeframe.alignment === 'MIXED',
    }),
    finalScore: multiTimeframe.score,
    direction,
    verdict,
    executionAllowed: false,
  };
}

export function calculateLinearFuturesPnl({
  side,
  entryPrice,
  markPrice,
  quantity,
  leverage,
  entryFeeRate = 0,
  exitFeeRate = 0,
  fundingPaid = 0,
}) {
  if (!['LONG', 'SHORT'].includes(side)) throw new TypeError('side must be LONG or SHORT');
  const values = { entryPrice, markPrice, quantity, leverage, entryFeeRate, exitFeeRate, fundingPaid };
  for (const [name, value] of Object.entries(values)) {
    if (!Number.isFinite(value)) throw new TypeError(`${name} must be finite`);
  }
  if (entryPrice <= 0 || markPrice <= 0 || quantity <= 0 || leverage <= 0) {
    throw new RangeError('prices, quantity, and leverage must be greater than zero');
  }
  if (entryFeeRate < 0 || exitFeeRate < 0) throw new RangeError('fee rates cannot be negative');
  const entryNotional = entryPrice * quantity;
  const exitNotional = markPrice * quantity;
  const grossPnl = (side === 'LONG' ? markPrice - entryPrice : entryPrice - markPrice) * quantity;
  const fees = entryNotional * entryFeeRate + exitNotional * exitFeeRate;
  const margin = entryNotional / leverage;
  const netPnl = grossPnl - fees - fundingPaid;
  return {
    side,
    entryNotional,
    exitNotional,
    margin,
    grossPnl,
    fees,
    fundingPaid,
    netPnl,
    roePct: netPnl / margin * 100,
  };
}

function decodeXml(value) {
  return String(value || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

export function parseGoogleNewsRss(xml, {
  nowMs = Date.now(),
  maxAgeMs = 48 * HOUR_MS,
  futureToleranceMs = 10 * 60_000,
  limit = 10,
} = {}) {
  const items = [...String(xml || '').matchAll(/<item>([\s\S]*?)<\/item>/gi)];
  const results = [];
  for (const match of items) {
    const block = match[1];
    const titleMatch = block.match(/<title>([\s\S]*?)<\/title>/i);
    const dateMatch = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
    const timestamp = dateMatch ? Date.parse(decodeXml(dateMatch[1])) : NaN;
    if (!Number.isFinite(timestamp) || timestamp < nowMs - maxAgeMs || timestamp > nowMs + futureToleranceMs) continue;
    const rawTitle = decodeXml(titleMatch?.[1] || '').trim();
    const title = rawTitle.replace(/\s+-\s+[^-]+$/, '').trim();
    if (title.length < 5) continue;
    results.push({ title, publishedAt: new Date(timestamp).toISOString() });
    if (results.length >= limit) break;
  }
  return results;
}
