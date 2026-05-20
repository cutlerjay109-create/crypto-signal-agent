require("dotenv").config();
const { log } = require("../utils/logger");

function calculateATR(price, change24h) {
  const changeAmount = Math.abs((change24h / 100) * price);
  const atr = changeAmount > 0 ? changeAmount : price * 0.02;
  return atr;
}

function verifyAndEnhanceSignal(signal, priceData) {
  try {
    log(`Verifying signal for ${signal.coin}...`);

    const price = priceData.price;
    const change24h = priceData.change24h;
    const isSell = signal.signal === "SELL";
    const isBuy = signal.signal === "BUY";

    // Calculate ATR
    const atr = calculateATR(price, change24h);

    let mathTP1, mathTP2, mathSL;

    if (isBuy) {
      // BUY: TP above price, SL below price
      mathTP1 = parseFloat((price + atr * 2).toFixed(2));
      mathTP2 = parseFloat((price + atr * 4).toFixed(2));
      mathSL  = parseFloat((price - atr * 1.5).toFixed(2));
    } else if (isSell) {
      // SELL: TP below price, SL above price
      mathTP1 = parseFloat((price - atr * 2).toFixed(2));
      mathTP2 = parseFloat((price - atr * 4).toFixed(2));
      mathSL  = parseFloat((price + atr * 1.5).toFixed(2));
    } else {
      // HOLD: use neutral levels
      mathTP1 = parseFloat((price + atr * 1.5).toFixed(2));
      mathTP2 = parseFloat((price + atr * 3).toFixed(2));
      mathSL  = parseFloat((price - atr * 1.5).toFixed(2));
    }

    // Average Claude values with our math values
    const finalTP1 = parseFloat(((signal.tp1 + mathTP1) / 2).toFixed(2));
    const finalTP2 = parseFloat(((signal.tp2 + mathTP2) / 2).toFixed(2));
    const finalSL  = parseFloat(((signal.stopLoss + mathSL) / 2).toFixed(2));

    // Calculate percentages
    const tp1Percent = parseFloat((((finalTP1 - price) / price) * 100).toFixed(2));
    const tp2Percent = parseFloat((((finalTP2 - price) / price) * 100).toFixed(2));
    const slPercent  = parseFloat((((finalSL - price) / price) * 100).toFixed(2));

    // Calculate risk reward ratio
    let reward, risk, riskReward;

    if (isBuy) {
      reward = finalTP1 - price;
      risk   = price - finalSL;
    } else if (isSell) {
      reward = price - finalTP1;
      risk   = finalSL - price;
    } else {
      reward = finalTP1 - price;
      risk   = price - finalSL;
    }

    riskReward = risk > 0 ? parseFloat((reward / risk).toFixed(2)) : 0;

    const enhancedSignal = {
      ...signal,
      tp1: finalTP1,
      tp2: finalTP2,
      stopLoss: finalSL,
      tp1Percent,
      tp2Percent,
      slPercent,
      riskReward,
      atr: parseFloat(atr.toFixed(2)),
      verified: true,
    };

    log(`Signal verified for ${signal.coin} - ${signal.signal} | TP1: $${finalTP1} | TP2: $${finalTP2} | SL: $${finalSL} | RR: ${riskReward}`);
    return enhancedSignal;

  } catch (error) {
    log(`Signal verification failed: ${error.message}`, "ERROR");
    return signal;
  }
}

function verifyAllSignals(signals, pricesData) {
  const verifiedSignals = {};
  for (const coin of Object.keys(signals)) {
    const signal = signals[coin];
    const priceData = pricesData[coin];
    if (!signal || !priceData) continue;
    verifiedSignals[coin] = verifyAndEnhanceSignal(signal, priceData);
  }
  log("All signals verified and enhanced successfully");
  return verifiedSignals;
}

module.exports = { verifyAllSignals, verifyAndEnhanceSignal };
