import { makeX402Request } from '../payments/x402_usdc.mjs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { log } = require('../utils/logger.js');

export async function analyzeSentimentX402(newsData, pricesData) {
  try {
    log("Sending news to Gemini via x402...");

    const newsSummary = Object.entries(newsData)
      .map(([coin, headlines]) => coin + ": " + headlines.slice(0, 2).join(", "))
      .join(" | ");

    const priceSummary = Object.entries(pricesData)
      .map(([coin, data]) => coin + " $" + data.price + " " + data.change24h.toFixed(1) + "%")
      .join(", ");

    const prompt = "Analyze crypto sentiment. Prices: " + priceSummary + ". News: " + newsSummary + ". Reply with only one line of JSON: {\"BTC\":{\"sentiment\":\"bullish\",\"score\":70},\"ETH\":{\"sentiment\":\"neutral\",\"score\":50},\"SOL\":{\"sentiment\":\"neutral\",\"score\":50},\"overall\":\"bullish\",\"confidence\":65}";

    const result = await makeX402Request(
      "https://api.acedata.cloud/v1/chat/completions",
      {
        method: "POST",
        body: JSON.stringify({
          model: "gemini-2.5-flash",
          messages: [{ role: "user", content: prompt }],
        }),
      }
    );

    const rawText = result?.choices?.[0]?.message?.content?.trim();
    if(!rawText) throw new Error("Empty response");

    log("Gemini x402 response: " + rawText);
    const jsonMatch = rawText.replace(/```json|```/g, "").trim().match(/\{.*\}/s);
    if(!jsonMatch) throw new Error("No JSON in response");

    const sentiment = JSON.parse(jsonMatch[0]);
    log("Sentiment: " + sentiment.overall + " (" + sentiment.confidence + "%)");
    return sentiment;

  } catch(error) {
    log("Sentiment x402 failed: " + error.message, "ERROR");
    return {
      BTC: { sentiment: "neutral", score: 50 },
      ETH: { sentiment: "neutral", score: 50 },
      SOL: { sentiment: "neutral", score: 50 },
      overall: "neutral",
      confidence: 50,
    };
  }
}
