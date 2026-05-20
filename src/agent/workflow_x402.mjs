import { analyzeSentimentX402 } from '../acedata/analyzer_x402.mjs';
import { generateSignalX402 } from '../acedata/signalAI_x402.mjs';
import { makeX402Request } from '../payments/x402_usdc.mjs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { log } = require('../utils/logger.js');
const { fetchCryptoPrices } = require('../acedata/scraper.js');
const { verifyAllSignals } = require('../signals/generator.js');
const { saveSignalReport } = require('../signals/formatter.js');

let cycleCount = 0;

export async function runX402Workflow() {
  cycleCount++;
  const cycleId = "X402-CYCLE-" + cycleCount + "-" + Date.now();

  log("=".repeat(50));
  log("Starting x402 workflow cycle: " + cycleId);
  log("=".repeat(50));

  try {
    log("STEP 1: Fetching prices...");
    const prices = await fetchCryptoPrices();
    log("Prices: BTC $" + prices.BTC.price + " | ETH $" + prices.ETH.price + " | SOL $" + prices.SOL.price);

    log("STEP 2: Fetching news via x402 SERP...");
    const serpResult = await makeX402Request(
      "https://api.acedata.cloud/serp/google",
      {
        method: "POST",
        body: JSON.stringify({ query: "Bitcoin Ethereum Solana crypto news today", number: 5 }),
      }
    );
    const headlines = serpResult?.organic?.slice(0, 5).map(r => r.title) || ["Crypto market update"];
    const news = { BTC: headlines, ETH: headlines, SOL: headlines };
    log("News fetched: " + headlines.length + " headlines via x402");

    log("STEP 3: Analyzing sentiment via x402 Gemini...");
    const sentiment = await analyzeSentimentX402(news, prices);
    log("Sentiment: " + sentiment.overall + " (" + sentiment.confidence + "%)");

    log("STEP 4: Generating signals via x402 GPT-4o-mini...");
    const rawSignals = await generateSignalX402(prices, sentiment);
    log("Signals generated for: " + Object.keys(rawSignals).join(", "));

    log("STEP 5: Verifying and saving signals...");
    const verifiedSignals = verifyAllSignals(rawSignals, prices);
    const reportPath = saveSignalReport(verifiedSignals);
    log("Report saved: " + reportPath);

    log("=".repeat(50));
    log("Cycle " + cycleId + " complete");
    log("Signals: " + Object.entries(verifiedSignals).map(([c,s]) => c+":"+s.signal).join(" | "));
    log("=".repeat(50));

    return { success: true, cycleId, signals: verifiedSignals };

  } catch(error) {
    log("x402 Workflow failed: " + error.message, "ERROR");
    return { success: false, cycleId, error: error.message };
  }
}
