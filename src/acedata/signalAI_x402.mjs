import { makeX402Request } from '../payments/x402_usdc.mjs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const acedataConfig = require('../../config/acedata.config.js');
const { log } = require('../utils/logger.js');

function calculateLevels(price, direction) {
  if(direction === "UP") {
    return { tp1: parseFloat((price * 1.04).toFixed(2)), tp2: parseFloat((price * 1.08).toFixed(2)), sl: parseFloat((price * 0.96).toFixed(2)) };
  } else if(direction === "DOWN") {
    return { tp1: parseFloat((price * 0.96).toFixed(2)), tp2: parseFloat((price * 0.92).toFixed(2)), sl: parseFloat((price * 1.04).toFixed(2)) };
  } else {
    return { tp1: parseFloat((price * 1.03).toFixed(2)), tp2: parseFloat((price * 1.06).toFixed(2)), sl: parseFloat((price * 0.97).toFixed(2)) };
  }
}

export async function generateSignalX402(pricesData, sentimentData) {
  try {
    log("Generating signals via GPT-4o-mini x402...");
    const signals = {};

    for(const coin of acedataConfig.coins) {
      const price = pricesData[coin];
      const sentiment = sentimentData[coin];
      if(!price || !sentiment) continue;

      const direction = sentiment.sentiment === "bullish" && price.change24h > 0 ? "UP" :
                       sentiment.sentiment === "bearish" && price.change24h < 0 ? "DOWN" : "SIDEWAYS";

      const prompt = "Market data tool. " + coin + " price $" + price.price + ", 24h change " + price.change24h.toFixed(2) + "%, trend score " + sentiment.score + "/100, direction " + sentiment.sentiment + ". Overall market " + sentimentData.overall + " at " + sentimentData.confidence + "% strength. Classify as UP/DOWN/SIDEWAYS and give confidence 0-100 and a one sentence reason. Respond with only JSON on one line: {\"direction\":\"" + direction + "\",\"confidence\":70,\"reason\":\"reason here\"}";

      try {
        const result = await makeX402Request(
          "https://api.acedata.cloud/v1/chat/completions",
          {
            method: "POST",
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: [{ role: "user", content: prompt }],
            }),
          }
        );

        const rawText = result?.choices?.[0]?.message?.content?.trim();
        log("GPT response for " + coin + ": " + rawText);

        let parsed;
        try {
          const jsonMatch = rawText?.match(/\{.*\}/s);
          parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { direction, confidence: 60, reason: "Based on market data" };
        } catch(e) {
          parsed = { direction, confidence: 60, reason: "Based on market data" };
        }

        const signalMap = { UP: "BUY", DOWN: "SELL", SIDEWAYS: "HOLD" };
        const levels = calculateLevels(price.price, parsed.direction || direction);

        signals[coin] = {
          coin, signal: signalMap[parsed.direction] || signalMap[direction],
          confidence: parsed.confidence || 60, entry: price.price,
          tp1: levels.tp1, tp2: levels.tp2, stopLoss: levels.sl,
          timeframe: "short term", reason: parsed.reason || "Based on market data",
          price: price.price, change24h: price.change24h, timestamp: new Date().toISOString(),
        };

        log("Signal for " + coin + ": " + signals[coin].signal + " (" + signals[coin].confidence + "%)");

      } catch(err) {
        log("Signal failed for " + coin + ": " + err.message, "ERROR");
        const levels = calculateLevels(price.price, direction);
        signals[coin] = {
          coin, signal: { UP: "BUY", DOWN: "SELL", SIDEWAYS: "HOLD" }[direction],
          confidence: 55, entry: price.price,
          tp1: levels.tp1, tp2: levels.tp2, stopLoss: levels.sl,
          timeframe: "short term", reason: "Based on price action",
          price: price.price, change24h: price.change24h, timestamp: new Date().toISOString(),
        };
      }
    }

    return signals;

  } catch(error) {
    log("Signal generation failed: " + error.message, "ERROR");
    throw error;
  }
}
