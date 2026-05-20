require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { log } = require("../utils/logger");

function getSignalEmoji(signal) {
  switch (signal) {
    case "BUY":  return "🟢";
    case "SELL": return "🔴";
    case "HOLD": return "🟡";
    default:     return "⚪";
  }
}

function formatSingleSignal(signal) {
  const emoji = getSignalEmoji(signal.signal);
  const line = "━".repeat(35);

  return `
${emoji} ${signal.signal} SIGNAL — ${signal.coin}/USDT
${line}
Entry Price:    $${signal.entry.toLocaleString()}
Take Profit 1:  $${signal.tp1.toLocaleString()} (+${signal.tp1Percent}%)
Take Profit 2:  $${signal.tp2.toLocaleString()} (+${signal.tp2Percent}%)
Stop Loss:      $${signal.stopLoss.toLocaleString()} (${signal.slPercent}%)
${line}
Confidence:     ${signal.confidence}%
Timeframe:      ${signal.timeframe}
24h Change:     ${signal.change24h.toFixed(2)}%
Risk/Reward:    ${signal.riskReward}
${line}
Reason:
${signal.reason}
${line}
Powered by Ace Data Cloud AI
Generated: ${new Date(signal.timestamp).toUTCString()}
${line}
`;
}

function formatAllSignals(signals) {
  const header = `
${"=".repeat(35)}
   CRYPTO SIGNAL AGENT REPORT
   ${new Date().toUTCString()}
${"=".repeat(35)}
`;

  const body = Object.values(signals)
    .map(signal => formatSingleSignal(signal))
    .join("\n");

  return header + body;
}

function saveSignalReport(signals) {
  try {
    const formatted = formatAllSignals(signals);

    // Generate filename with timestamp
    const timestamp = new Date()
      .toISOString()
      .replace(/:/g, "-")
      .replace(/\..+/, "");

    const filename = `signal_${timestamp}.txt`;
    const filepath = path.join(
      __dirname,
      "../../reports/output",
      filename
    );

    // Save to file
    fs.writeFileSync(filepath, formatted);
    log(`Signal report saved: ${filename}`);

    // Also print to console
    console.log(formatted);

    return filepath;

  } catch (error) {
    log(`Failed to save signal report: ${error.message}`, "ERROR");
    throw error;
  }
}

module.exports = { formatAllSignals, formatSingleSignal, saveSignalReport };
