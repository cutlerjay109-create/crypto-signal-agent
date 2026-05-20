require("dotenv").config();
const { log } = require("../utils/logger");
const { discoverTools } = require("./discovery");
const { callSentinel } = require("./sentinel");
const { fetchCryptoNews, fetchCryptoPrices } = require("../acedata/scraper");
const { analyzeSentiment } = require("../acedata/analyzer");
const { generateSignal } = require("../acedata/signalAI");
const { verifyAllSignals } = require("../signals/generator");
const { saveSignalReport } = require("../signals/formatter");
const { setupEscrow, settleEscrowPayment } = require("../payments/escrow");
const { payForSERP, payForGemini, payForClaude } = require("../payments/x402");

let cycleCount = 0;

async function runWorkflow() {
  cycleCount++;
  const cycleId = `CYCLE-${cycleCount}-${Date.now()}`;

  log("=".repeat(50));
  log(`Starting workflow cycle: ${cycleId}`);
  log("=".repeat(50));

  try {

    // ================================================
    // STEP 1 — Tool Discovery via SAP
    // ================================================
    log("STEP 1: Discovering tools on SAP network...");
    const discovery = await discoverTools();
    log(`Discovery complete - Found ${discovery.toolCount} tools from ${discovery.agentCount} agents`);

    // ================================================
    // STEP 2 — Call Synapse Sentinel
    // ================================================
    log("STEP 2: Calling Synapse Sentinel...");
    const sentinel = await callSentinel();
    if (sentinel.success) {
      log("Sentinel call successful - Escrow payment settled");
    } else {
      log(`Sentinel call failed: ${sentinel.error}`, "WARN");
    }

    // ================================================
    // STEP 3 — Fetch Crypto News via Google SERP
    // ================================================
    log("STEP 3: Fetching crypto news via Google SERP API...");

    // x402 payment for SERP
    const serpPayment = await payForSERP();
    log(`x402 SERP payment: ${serpPayment.success ? "SUCCESS" : "FAILED"}`);

    // Fetch news
    const newsData = await fetchCryptoNews();
    log(`News fetched for ${Object.keys(newsData).length} coins`);

    // ================================================
    // STEP 4 — Fetch Live Prices (Free via CoinGecko)
    // ================================================
    log("STEP 4: Fetching live crypto prices...");
    const pricesData = await fetchCryptoPrices();
    log(`Prices fetched - BTC: $${pricesData.BTC.price} | ETH: $${pricesData.ETH.price} | SOL: $${pricesData.SOL.price}`);

    // ================================================
    // STEP 5 — Gemini Sentiment Analysis
    // ================================================
    log("STEP 5: Running sentiment analysis via Gemini...");

    // x402 payment for Gemini
    const geminiPayment = await payForGemini();
    log(`x402 Gemini payment: ${geminiPayment.success ? "SUCCESS" : "FAILED"}`);

    // Analyze sentiment
    const sentimentData = await analyzeSentiment(newsData, pricesData);
    log(`Sentiment: ${sentimentData.overall} (${sentimentData.confidence}% confidence)`);

    // ================================================
    // STEP 6 — Claude Signal Generation
    // ================================================
    log("STEP 6: Generating signals via Claude...");

    // x402 payment for Claude
    const claudePayment = await payForClaude();
    log(`x402 Claude payment: ${claudePayment.success ? "SUCCESS" : "FAILED"}`);

    // Generate signals
    const rawSignals = await generateSignal(pricesData, sentimentData);
    log(`Signals generated for: ${Object.keys(rawSignals).join(", ")}`);

    // ================================================
    // STEP 7 — Verify and Enhance Signals
    // ================================================
    log("STEP 7: Verifying and enhancing signals...");
    const verifiedSignals = verifyAllSignals(rawSignals, pricesData);
    log("All signals verified with mathematical confirmation");

    // ================================================
    // STEP 8 — Save Signal Report
    // ================================================
    log("STEP 8: Saving signal report...");
    const reportPath = saveSignalReport(verifiedSignals);
    log(`Report saved: ${reportPath}`);

    // ================================================
    // STEP 9 — Final Escrow Settlement
    // ================================================
    log("STEP 9: Settling final escrow payment...");
    const finalPayment = await settleEscrowPayment(
      `workflow-complete-${cycleId}`,
      1
    );
    log(`Final escrow payment: ${finalPayment.success ? "SUCCESS" : "FAILED"}`);

    // ================================================
    // CYCLE COMPLETE
    // ================================================
    log("=".repeat(50));
    log(`Cycle ${cycleId} completed successfully`);
    log(`Signals: ${Object.entries(verifiedSignals).map(([coin, s]) => `${coin}:${s.signal}`).join(" | ")}`);
    log(`Next cycle in ${process.env.SCHEDULE_INTERVAL || 60} minutes`);
    log("=".repeat(50));

    return {
      success: true,
      cycleId,
      signals: verifiedSignals,
      payments: {
        sentinel: sentinel.success,
        serp: serpPayment.success,
        gemini: geminiPayment.success,
        claude: claudePayment.success,
        final: finalPayment.success,
      },
    };

  } catch (error) {
    log(`Workflow cycle failed: ${error.message}`, "ERROR");
    log(`Cycle ${cycleId} failed - will retry next scheduled run`, "ERROR");

    return {
      success: false,
      cycleId,
      error: error.message,
    };
  }
}

module.exports = { runWorkflow };
