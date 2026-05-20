require("dotenv").config();
const axios = require("axios");
const acedataConfig = require("../../config/acedata.config");
const { log } = require("../utils/logger");

async function analyzeSentiment(newsData, pricesData) {
  try {
    log("Sending news to Gemini for sentiment analysis...");

    const newsSummary = Object.entries(newsData).map(([coin, headlines]) => {
      return `${coin}: ${headlines.slice(0, 3).join(", ")}`;
    }).join("\n");

    const priceSummary = Object.entries(pricesData).map(([coin, data]) => {
      return `${coin}: $${data.price} (24h: ${data.change24h.toFixed(2)}%)`;
    }).join("\n");

    const prompt = `Crypto market analyst. Analyze sentiment from data below.

Prices:
${priceSummary}

News:
${newsSummary}

Return ONLY this exact JSON format with no extra text:
{"BTC":{"sentiment":"bullish","score":70},"ETH":{"sentiment":"neutral","score":50},"SOL":{"sentiment":"bearish","score":30},"overall":"bullish","confidence":75}`;

    const response = await axios.post(
      `${acedataConfig.baseUrl}${acedataConfig.gemini.endpoint}`,
      {
        model: acedataConfig.gemini.model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
        stream: false,
        max_tokens: 300,
      },
      {
        headers: {
          Authorization: `Bearer ${acedataConfig.geminiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    const rawText = response.data.choices[0].message.content.trim();
    log(`Gemini response: ${rawText}`);

    const cleanText = rawText.replace(/```json|```/g, "").trim();
    const sentiment = JSON.parse(cleanText);

    log(`Sentiment: ${sentiment.overall} (${sentiment.confidence}% confidence)`);
    return sentiment;

  } catch (error) {
    log(`Sentiment analysis failed: ${error.message}`, "ERROR");
    return {
      BTC: { sentiment: "neutral", score: 50 },
      ETH: { sentiment: "neutral", score: 50 },
      SOL: { sentiment: "neutral", score: 50 },
      overall: "neutral",
      confidence: 50,
    };
  }
}

module.exports = { analyzeSentiment };
