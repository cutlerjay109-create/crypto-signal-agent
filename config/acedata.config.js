require("dotenv").config();

const acedataConfig = {
  baseUrl: "https://api.acedata.cloud",

  serpKey:   process.env.ACEDATA_SERP_KEY,
  geminiKey: process.env.ACEDATA_GEMINI_KEY,
  claudeKey: process.env.ACEDATA_CLAUDE_KEY,

  serp: {
    endpoint: "/serp/google",
    creditsPerCall: 0.01,
  },

  gemini: {
    endpoint: "/v1/chat/completions",
    model: "gemini-2.5-flash",
  },

  // Using gpt-4o-mini for signal generation (reliable, no refusals)
  claude: {
    endpoint: "/v1/chat/completions",
    model: "gpt-4o-mini",
  },

  coins: ["BTC", "ETH", "SOL"],
};

module.exports = acedataConfig;
