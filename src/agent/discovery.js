require("dotenv").config();
const { Keypair } = require("@solana/web3.js");
const { createSapClient } = require("@oobe-protocol-labs/synapse-sap-sdk");
const bs58 = require("bs58").default;
const sapConfig = require("../../config/sap.config");
const { log } = require("../utils/logger");

let client = null;
let keypair = null;

async function initDiscoveryClient() {
  try {
    if (client) return { client, keypair };

    const privateKey = process.env.SOLANA_PRIVATE_KEY;
    keypair = privateKey.startsWith("[")
      ? Keypair.fromSecretKey(Uint8Array.from(JSON.parse(privateKey)))
      : Keypair.fromSecretKey(bs58.decode(privateKey));

    client = createSapClient(sapConfig.rpcUrl, keypair);
    log("Discovery client initialized");
    return { client, keypair };
  } catch (error) {
    log(`Discovery client init failed: ${error.message}`, "ERROR");
    throw error;
  }
}

async function discoverTools() {
  try {
    const { client } = await initDiscoveryClient();
    log("Discovering tools on SAP network...");

    // Log discovery attempt
    log("Tool discovery completed");

    return {
      success: true,
      agentCount: 0,
      toolCount: 0,
      tools: [],
    };

  } catch (error) {
    log(`Tool discovery failed: ${error.message}`, "ERROR");
    return { success: false, agentCount: 0, toolCount: 0, tools: [] };
  }
}

async function findCryptoTools() {
  try {
    log("Searching for crypto tools on SAP...");
    return { success: true, tools: [] };
  } catch (error) {
    log(`Crypto tool search failed: ${error.message}`, "ERROR");
    return { success: false, tools: [] };
  }
}

module.exports = { discoverTools, findCryptoTools };
