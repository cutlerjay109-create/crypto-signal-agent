const express = require("express");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

function getLatestSignal(coin) {
  const reportsDir = path.join(__dirname, "../reports/output");
  const files = fs.readdirSync(reportsDir)
    .filter(f => f.endsWith(".txt"))
    .sort().reverse();
  if(files.length === 0) return null;
  const latest = fs.readFileSync(path.join(reportsDir, files[0]), "utf8");
  const lines = latest.split("\n");
  let signal = null, entry = null, tp1 = null, tp2 = null, sl = null, rr = null, confidence = null;
  let inSection = false;
  const coinPair = coin.toUpperCase() + "/USDT";
  for(const line of lines) {
    if(line.includes(coinPair)) inSection = true;
    if(inSection && (line.includes("BUY SIGNAL") || line.includes("SELL SIGNAL") || line.includes("HOLD SIGNAL"))) {
      if(line.includes("BUY")) signal = "BUY";
      if(line.includes("SELL")) signal = "SELL";
      if(line.includes("HOLD")) signal = "HOLD";
    }
    if(inSection && line.includes("Entry Price:")) entry = parseFloat(line.split("$")[1].replace(/,/g,"").trim());
    if(inSection && line.includes("Take Profit 1:")) tp1 = parseFloat(line.split("$")[1].replace(/,/g,"").trim());
    if(inSection && line.includes("Take Profit 2:")) tp2 = parseFloat(line.split("$")[1].replace(/,/g,"").trim());
    if(inSection && line.includes("Stop Loss:")) sl = parseFloat(line.split("$")[1].replace(/,/g,"").trim());
    if(inSection && line.includes("Risk/Reward:")) rr = parseFloat(line.replace("Risk/Reward:","").trim());
    if(inSection && line.includes("Confidence:")) confidence = parseInt(line.replace("Confidence:","").replace("%","").trim());
    if(inSection && signal && entry && tp1 && sl && rr && confidence) break;
  }
  return { signal, entry, tp1, tp2, sl, rr, confidence, coin: coin.toUpperCase(), timestamp: files[0] };
}

app.get("/signal", (req, res) => {
  const coin = req.query.coin || "BTC";
  const result = getLatestSignal(coin);
  if(!result) return res.status(404).json({ error: "No signal available" });
  res.json(result);
});

app.get("/signals", (req, res) => {
  res.json({ BTC: getLatestSignal("BTC"), ETH: getLatestSignal("ETH"), SOL: getLatestSignal("SOL"), generatedBy: "CryptoSignalAgent", poweredBy: "Ace Data Cloud AI" });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", agent: "CryptoSignalAgent", wallet: process.env.SOLANA_PUBLIC_KEY });
});

app.listen(PORT, () => {
  console.log("CryptoSignalTool API running on port " + PORT);
});
