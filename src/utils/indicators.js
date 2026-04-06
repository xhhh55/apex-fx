/* eslint-disable */
// Chart indicator utilities — shared across tabs

export const genSpark = (base, len = 30) => { let p = base; return Array.from({ length: len }, () => { p += (Math.random() - 0.485) * 0.00018 * p; return p; }); };

export function genCandles(basePrice, count = 120, volatility = 0.0018) {
  const candles = [];
  let price = basePrice;
  const now = Date.now();
  for (let i = count; i >= 0; i--) {
    const open = price;
    const move = (Math.random() - 0.488) * volatility * price;
    const close = open + move;
    const range = Math.abs(move) * (1 + Math.random() * 2.2);
    const high = Math.max(open, close) + range * Math.random() * 0.8;
    const low = Math.min(open, close) - range * Math.random() * 0.8;
    const vol = Math.floor(800 + Math.random() * 4200);
    candles.push({ open, high, low, close, vol, t: now - i * 60000 });
    price = close;
  }
  return candles;
}

export function calcRSI(candles, period = 14) {
  const closes = candles.map(c => c.close);
  const rsi = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < period) { rsi.push(null); continue; }
    let gains = 0, losses = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const d = closes[j] - closes[j - 1];
      if (d > 0) gains += d; else losses -= d;
    }
    const avgG = gains / period, avgL = losses / period;
    rsi.push(avgL === 0 ? 100 : 100 - 100 / (1 + avgG / avgL));
  }
  return rsi;
}

export function calcMACD(candles) {
  const closes = candles.map(c => c.close);
  const ema = (arr, n) => {
    const k = 2 / (n + 1), result = [arr[0]];
    for (let i = 1; i < arr.length; i++) result.push(arr[i] * k + result[i - 1] * (1 - k));
    return result;
  };
  const ema12 = ema(closes, 12), ema26 = ema(closes, 26);
  const macd = ema12.map((v, i) => v - ema26[i]);
  const signal = ema(macd, 9);
  const hist = macd.map((v, i) => v - signal[i]);
  return { macd, signal, hist };
}

export function calcBB(candles, period = 20) {
  const closes = candles.map(c => c.close);
  return closes.map((_, i) => {
    if (i < period - 1) return null;
    const slice = closes.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const std = Math.sqrt(slice.reduce((a, b) => a + (b - mean) ** 2, 0) / period);
    return { upper: mean + 2 * std, mid: mean, lower: mean - 2 * std };
  });
}
