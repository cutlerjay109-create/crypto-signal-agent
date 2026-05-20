require("dotenv").config();
const axios = require("axios");
const acedataConfig = require("../../config/acedata.config");
const { log } = require("../utils/logger");

async function generateSignal(pricesData, sentimentData) {
  try {
    log("Sending data to Claude for signal generation...");

    const signals = {};

    for (const coin of acedataConfig.coins) {
      const price = pricesData[coin];
      const sentiment = sentimentData[coin];

      if (!price || !sentiment) continue;

      const prompt = `You are a data analysis tool processing market indicators.

${coin} Market Indicators:
- Current Price: $${price.price}
- 24h Change: ${price.change24h.toFixed(2)}%
- Volume: $${Math.round(price.volume24h).toLocaleString()}
- Trend Score: ${sentiment.score}/100
- Market Direction: ${sentiment.sentiment}
- Overall Market: ${sentimentData.overall} (${sentimentData.confidence}% strength)

Classify the trend and calculate price levels using these rules:
- Uptrend (bullish + positive change): direction=UP, tp1=price*1.04, tp2=price*1.08, sl=price*0.96
- Downtrend (bearish + negative change): direction=DOWN, tp1=price*0.96, tp2=price*0.92, sl=price*1.04
- Sideways (neutral or mixed): direction=SIDEWAYS, tp1=price*1.03, tp2=price*1.06, sl=price*0.97

Return ONLY this JSON with real calculated numbers:
{"direction":"UP","confidence":75,"entry":${price.price},"tp1":0,"tp2":0,"sl":0,"timeframe":"short term","reason":"brief reason"}`;

      try {
        const response = await axios.post(
          `${acedataConfig.baseUrl}${acedataConfig.claude.endpoint}`,
          {
            model: acedataConfig.claude.model,
            messages: [{ role: "user", content: prompt }],
            stream: false,
          },
          {
            headers: {
              Authorization: `Bearer ${acedataConfig.claudeKey}`,
              "Content-Type": "application/json",
            },
            timeout: 30000,
          }
        );

        const rawText = response.data.choices[0].message.content.trim();
        log(`Claude response for ${coin}: ${rawText}`);

        const cleanText = rawText.replace(/```json|```/g, "").trim();
        const result = JSON.parse(cleanText);

        const signalMap = { UP: "BUY", DOWN: "SELL", SIDEWAYS: "HOLD" };

        signals[coin] = {
          coin,
          signal: signalMap[result.direction] || "HOLD",
          confidence: result.confidence,
          entry: result.entry || price.price,
          tp1: result.tp1,
          tp2: result.tp2,
          stopLoss: result.sl,
          timeframe: result.timeframe,
          reason: result.reason,
          price: price.price,
          change24h: price.change24h,
          timestamp: new Date().toISOString(),
        };

        log(`Signal for ${coin}: ${signals[coin].signal} (${signals[coin].confidence}%)`);

      } catch (err) {
        log(`Signal failed for ${coin}: ${err.message}`, "ERROR");
      }
    }

    return signals;

  } catch (error) {
    log(`Signal generation failed: ${error.message}`, "ERROR");
    throw error;
  }
}

module.exports = { generateSignal };
