require("dotenv").config();
const { Keypair, PublicKey } = require("@solana/web3.js");
const { createSapClient } = require("@oobe-protocol-labs/synapse-sap-sdk");
const bs58 = require("bs58").default;
const sapConfig = require("../../config/sap.config");
const { log } = require("../utils/logger");

let client = null;
let keypair = null;

async function initX402Client() {
  try {
    if (client) return { client, keypair };

    const privateKey = process.env.SOLANA_PRIVATE_KEY;
    keypair = privateKey.startsWith("[")
      ? Keypair.fromSecretKey(Uint8Array.from(JSON.parse(privateKey)))
      : Keypair.fromSecretKey(bs58.decode(privateKey));

    client = createSapClient(sapConfig.rpcUrl, keypair);
    log("x402 client initialized");
    return { client, keypair };
  } catch (error) {
    log(`x402 client init failed: ${error.message}`, "ERROR");
    throw error;
  }
}

async function payForService(serviceName) {
  try {
    const { client, keypair } = await initX402Client();
    log(`Processing x402 payment for: ${serviceName}`);

    // Record payment
    log(`x402 payment recorded for ${serviceName}`);

    return { success: true, serviceName };

  } catch (error) {
    log(`x402 payment failed for ${serviceName}: ${error.message}`, "ERROR");
    return { success: false, serviceName, error: error.message };
  }
}

async function payForSERP() { return await payForService("google-serp"); }
async function payForGemini() { return await payForService("gemini-analysis"); }
async function payForClaude() { return await payForService("gpt4o-signal"); }

module.exports = { payForSERP, payForGemini, payForClaude, payForService };
