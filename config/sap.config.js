require("dotenv").config();

const sapConfig = {
  rpcUrl: process.env.SYNAPSE_RPC_URL || "https://api.mainnet-beta.solana.com",
  apiKey: process.env.SYNAPSE_API_KEY,

  agent: {
    name: process.env.AGENT_NAME || "CryptoSignalAgent",
    description: process.env.AGENT_DESCRIPTION || "Autonomous crypto buy/sell signal agent",
    capabilities: [
      {
        id: "crypto:signal",
        protocolId: "crypto",
        version: "1.0",
        description: "Generates crypto buy/sell signals with TP and SL",
      }
    ],
    protocols: ["A2A"],
    pricing: [],
  },

  escrow: {
    pricePerCall: 1000,
    maxCalls: 0,
    deposit: 100000,
    expiresAt: 0,
  },

  sentinel: {
    address: "Ccr2yK3hLALU4p8oNRqrh4dGuvPJTth5KCLMio8cE1ph",
  },

  schedule: {
    intervalMinutes: process.env.SCHEDULE_INTERVAL || 60,
  }
};

module.exports = sapConfig;
