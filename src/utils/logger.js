const fs = require("fs");
const path = require("path");

const logFile = path.join(__dirname, "../../logs/transactions.log");

function log(message, level = "INFO") {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] [${level}] ${message}`;
  
  // Print to console
  console.log(entry);

  // Write to log file
  fs.appendFileSync(logFile, entry + "\n");
}

module.exports = { log };
